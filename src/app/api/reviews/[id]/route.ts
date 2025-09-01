import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { parseJson, schemas, sanitizeHTML } from '@/lib/validation';
import { rateLimitCheck, setRateLimitHeaders } from '@/lib/rateLimit';
import { error as httpError } from '@/lib/http';

// Type assertion to bypass TypeScript errors until Prisma types are updated
const db = prisma as any;

// GET handler
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    const currentUserId = session?.user ? await db.user.findUnique({
      where: { email: session.user.email as string },
      select: { id: true }
    }).then((user: any) => user?.id) : null;
    
    const { id } = await params;
    const reviews = await db.review.findMany({
      where: { contentId: id },
      include: {
        user: { select: { id: true, name: true, image: true } },
        categories: { include: { category: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    
    // Get reaction counts separately
    const reviewsWithReactions = await Promise.all(reviews.map(async (review: any) => {
      // Get likes count
      const likes = await db.reviewReaction.count({
        where: {
          reviewId: review.id,
          type: 'like'
        }
      });
      
      // Get dislikes count
      const dislikes = await db.reviewReaction.count({
        where: {
          reviewId: review.id,
          type: 'dislike'
        }
      });
      
      // Get user's reaction if logged in
      let userReaction = null;
      if (currentUserId) {
        const reaction = await db.reviewReaction.findFirst({
          where: {
            reviewId: review.id,
            userId: currentUserId
          }
        });
        userReaction = reaction?.type || null;
      }
      
      // Make sure we preserve the categories structure exactly
      return {
        id: review.id,
        rating: review.rating,
        text: review.text,
        createdAt: review.createdAt,
        updatedAt: review.updatedAt,
        userId: review.userId,
        guestName: review.guestName, // Include guestName for anonymous reviews
        contentId: review.contentId,
        user: review.user,
        categories: review.categories, // Ensure categories are preserved
        likes,
        dislikes,
        userReaction
      };
    }));
    
    // Calculate weighted Woke Reasons summary for this contentId
    // 1. Get all categories for this content
    // First, get all review IDs for this content
    const reviewIds = reviews.map((r: any) => r.id);
    console.log(`Found ${reviewIds.length} reviews for content ${id}:`, reviewIds);
    
    // Then, get all review categories with these review IDs
    const allReviewCategories = await db.reviewCategory.findMany({
      where: { 
        reviewId: { in: reviewIds }
      },
      include: { category: true }
    });
    
    // Debug log
    console.log(`Found ${allReviewCategories.length} review categories for content ${id}`);
    
    // Directly query categories to ensure they exist
    const categories = await db.category.findMany();
    console.log(`Total categories in database: ${categories.length}`);
    
    // 2. Count votes for each category
    const categoryCountMap: Record<string, { name: string, count: number }> = {};
    
    allReviewCategories.forEach((rc: any) => {
      if (!rc.categoryId || !rc.category?.name) {
        console.log('Missing category data:', rc);
        return;
      }
      
      if (!categoryCountMap[rc.categoryId]) {
        categoryCountMap[rc.categoryId] = { name: rc.category.name, count: 1 };
      } else {
        categoryCountMap[rc.categoryId].count++;
      }
    });
    
    // 3. Prepare summary array
    const totalReviews = reviews.length;
    const wokeReasons = Object.entries(categoryCountMap).map(([categoryId, { name, count }]) => ({
      categoryId,
      name,
      count,
      percent: totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0
    }));
    
    // Debug log
    console.log(`Generated ${wokeReasons.length} woke reasons for content ${id}:`, wokeReasons);
    
    // If no categories were found through the normal query, try a direct approach
    if (wokeReasons.length === 0) {
      console.log('No categories found through normal query, trying direct approach');
      
      // Get all review categories directly from the database
      const directCategories = [];
      for (const review of reviews) {
        if (review.categories && Array.isArray(review.categories)) {
          for (const cat of review.categories) {
            if (cat.category && cat.category.name) {
              directCategories.push({
                categoryId: cat.categoryId,
                name: cat.category.name,
                count: 1,
                percent: 100
              });
            }
          }
        }
      }
      
      console.log(`Found ${directCategories.length} categories directly from reviews`);
      
      if (directCategories.length > 0) {
        // Merge duplicate categories
        const mergedCategories: Record<string, { name: string, count: number, percent: number }> = {};
        directCategories.forEach(cat => {
          if (!mergedCategories[cat.categoryId]) {
            mergedCategories[cat.categoryId] = cat;
          } else {
            mergedCategories[cat.categoryId].count++;
          }
        });
        
        // Calculate percentages
        Object.values(mergedCategories).forEach((cat: { name: string, count: number, percent: number }) => {
          cat.percent = Math.round((cat.count / totalReviews) * 100);
        });
        
        console.log('Using direct categories:', Object.values(mergedCategories));
        return NextResponse.json({
          reviews: reviewsWithReactions,
          wokeReasons: Object.values(mergedCategories),
          totalReviews
        });
      }
    }

    return NextResponse.json({
      reviews: reviewsWithReactions,
      wokeReasons,
      totalReviews
    });
  } catch (error: unknown) {
    let message = 'Failed to fetch reviews.';
    if (
      typeof error === 'object' &&
      error !== null &&
      'message' in error &&
      typeof (error as { message?: string }).message === 'string'
    ) {
      message = (error as { message: string }).message;
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST handler
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Shadow-mode rate limiting for review submissions (IP-based).
    const rl = rateLimitCheck(req as any, { limit: 10, windowMs: 60_000, route: 'review_submit' });
    if (!rl.allowed && !rl.shadowed) {
      const res = httpError(429, 'Too Many Requests', 'RATE_LIMITED');
      setRateLimitHeaders(res, rl);
      return res;
    }
    const { rating, text, categoryIds, guestName } = await parseJson(req as any, schemas.reviewCreate);
    const safeText = text ? sanitizeHTML(text) : '';
    const session = await getServerSession(authOptions);
    console.log('Received review submission with categories:', categoryIds);
    const resolvedParams = await params;
    const { id: contentId } = resolvedParams;
    
    // Get review count before adding new review
    const reviewCountBefore = await db.review.findMany({ where: { contentId } }).then((reviews: { length: number }) => reviews.length);

    let userId = null;
    // If user is authenticated, get their ID and check for existing review
    if (session?.user) {
      const user = await db.user.findUnique({
        where: { email: session.user.email as string },
      });
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      userId = user.id;
      
      // Check if the user has already reviewed this content
      const existingReview = await db.review.findFirst({
        where: {
          contentId,
          userId: user.id,
        },
      });
      if (existingReview) {
        return NextResponse.json({ error: 'You have already reviewed this content' }, { status: 400 });
      }
    }
    // Create the review
    const review = await db.review.create({
      data: {
        rating,
        text: safeText,
        userId,
        guestName: userId ? undefined : ((guestName && guestName.trim()) ? guestName.trim() : 'Anonymous'),
        contentId,
        categories: {
          create: categoryIds?.map((catId: string) => ({
            categoryId: catId,
          })) || [],
        },
      },
      include: {
        user: { select: { id: true, name: true, image: true } },
        categories: { include: { category: true } },
      },
    });
    // Update category scores for this content
    const reviewCategories = await db.reviewCategory.findMany({
      where: { reviewId: review.id },
      include: { category: true }
    });

    // Update or create category scores
    const categoryUpdates = reviewCategories.map(async (rc: { categoryId: string }) => {
      const existingScore = await db.categoryScore.findUnique({
        where: { contentId_categoryId: { contentId, categoryId: rc.categoryId } }
      });

      const newCount = (existingScore?.count || 0) + 1;
      const newScore = (existingScore?.score || 0) + review.rating;
      const percentage = (newCount / (reviewCountBefore + 1)) * 100;

      return db.categoryScore.upsert({
        where: { contentId_categoryId: { contentId, categoryId: rc.categoryId } },
        update: {
          count: newCount,
          score: newScore,
          percentage
        },
        create: {
          contentId,
          categoryId: rc.categoryId,
          count: 1,
          score: review.rating,
          percentage: 100 / (reviewCountBefore + 1)
        }
      });
    });

    // Wait for all category updates to complete
    await Promise.all(categoryUpdates);

    // Recalculate the content's wokeScore and reviewCount
    const allReviews = await db.review.findMany({ where: { contentId } });
    const reviewCount = allReviews.length;
    const wokeScore = allReviews.length > 0 ? allReviews.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / allReviews.length : 0;
    await db.content.update({ where: { id: contentId }, data: { wokeScore, reviewCount } });

    // Update category percentages
    const allCategoryScores = await db.categoryScore.findMany({
      where: { contentId },
      include: { category: true }
    });
    const totalScore = allCategoryScores.reduce((sum: number, score: { score: number }) => sum + score.score, 0);
    
    const updatePercentages = allCategoryScores.map(async (score: { id: string; score: number }) => {
      const newPercentage = totalScore > 0 ? (score.score / totalScore) * 100 : 0;
      return db.categoryScore.update({
        where: { id: score.id },
        data: { percentage: newPercentage }
      });
    });

    await Promise.all(updatePercentages);
    const res = NextResponse.json({ message: 'Review created successfully' });
    setRateLimitHeaders(res, rl);
    return res;
  } catch (error: unknown) {
    let message = 'Failed to create review.';
    if (
      typeof error === 'object' &&
      error !== null &&
      'message' in error &&
      typeof (error as { message?: string }).message === 'string'
    ) {
      message = (error as { message: string }).message;
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PATCH handler
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const { rating, text } = await parseJson(req as any, schemas.reviewUpdate);
    const safeText = typeof text === 'string' ? sanitizeHTML(text) : undefined;
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const review = await db.review.findUnique({ where: { id } });
    const user = await db.user.findUnique({ where: { email: session.user.email as string } });
    if (!review || !user || review.userId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const updated = await db.review.update({
      where: { id },
      data: { rating, text: safeText },
    });
    return NextResponse.json({ message: 'Review updated successfully' });
  } catch (error: unknown) {
    let message = 'Failed to update review.';
    if (
      typeof error === 'object' &&
      error !== null &&
      'message' in error &&
      typeof (error as { message?: string }).message === 'string'
    ) {
      message = (error as { message: string }).message;
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
