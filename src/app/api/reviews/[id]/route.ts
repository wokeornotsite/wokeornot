import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { parseJson, schemas, sanitizeHTML } from '@/lib/validation';
import { rateLimitCheck, setRateLimitHeaders } from '@/lib/rateLimit';
import { error as httpError } from '@/lib/http';
import { checkReviewBadges } from '@/lib/badges';
import { getPostHogClient } from '@/lib/posthog-server';

// GET handler
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    const currentUserId = session?.user ? await prisma.user.findUnique({
      where: { email: session.user.email as string },
      select: { id: true }
    }).then((user: { id: string } | null) => user?.id) : null;
    
    const { id } = await params;
    const reviews = await prisma.review.findMany({
      where: { contentId: id, isHidden: false },
      include: {
        user: { select: { id: true, name: true, image: true, avatar: true } },
        categories: { include: { category: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    
    const reviewIds = reviews.map((r: any) => r.id);

    // Fetch all reaction counts in a single grouped query (avoids N+1)
    const reactionGroups = await (prisma.reviewReaction as any).groupBy({
      by: ['reviewId', 'type'],
      _count: { _all: true },
      where: { reviewId: { in: reviewIds } },
    });

    // Fetch current user's reactions in a single query
    const userReactionsMap: Record<string, string> = {};
    if (currentUserId && reviewIds.length > 0) {
      const userReactions = await prisma.reviewReaction.findMany({
        where: { reviewId: { in: reviewIds }, userId: currentUserId },
        select: { reviewId: true, type: true },
      });
      for (const r of userReactions) {
        userReactionsMap[r.reviewId] = r.type;
      }
    }

    const likesMap: Record<string, number> = {};
    const dislikesMap: Record<string, number> = {};
    for (const group of reactionGroups) {
      if (group.type === 'like') likesMap[group.reviewId] = group._count._all;
      else if (group.type === 'dislike') dislikesMap[group.reviewId] = group._count._all;
    }

    const reviewsWithReactions = reviews.map((review: any) => ({
      id: review.id,
      rating: review.rating,
      text: review.text,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
      userId: review.userId,
      guestName: review.guestName,
      contentId: review.contentId,
      user: review.user,
      categories: review.categories,
      likes: likesMap[review.id] || 0,
      dislikes: dislikesMap[review.id] || 0,
      userReaction: userReactionsMap[review.id] || null,
    }));

    // Calculate woke reasons summary
    const allReviewCategories = await prisma.reviewCategory.findMany({
      where: { reviewId: { in: reviewIds } },
      include: { category: true }
    });

    const categoryCountMap: Record<string, { name: string, count: number }> = {};
    allReviewCategories.forEach((rc: any) => {
      if (!rc.categoryId || !rc.category?.name) return;
      if (!categoryCountMap[rc.categoryId]) {
        categoryCountMap[rc.categoryId] = { name: rc.category.name, count: 1 };
      } else {
        categoryCountMap[rc.categoryId].count++;
      }
    });

    const totalReviews = reviews.length;
    const wokeReasons = Object.entries(categoryCountMap).map(([categoryId, { name, count }]) => ({
      categoryId,
      name,
      count,
      percent: totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0
    }));

    // Fallback: derive categories from already-loaded reviews if normal query yielded nothing
    if (wokeReasons.length === 0) {
      const mergedCategories: Record<string, { name: string, count: number, percent: number }> = {};
      for (const review of reviews) {
        if (review.categories && Array.isArray(review.categories)) {
          for (const cat of review.categories) {
            if (cat.category?.name) {
              if (!mergedCategories[cat.categoryId]) {
                mergedCategories[cat.categoryId] = { name: cat.category.name, count: 1, percent: 0 };
              } else {
                mergedCategories[cat.categoryId].count++;
              }
            }
          }
        }
      }
      Object.values(mergedCategories).forEach((cat) => {
        cat.percent = Math.round((cat.count / totalReviews) * 100);
      });
      if (Object.keys(mergedCategories).length > 0) {
        return NextResponse.json({ reviews: reviewsWithReactions, wokeReasons: Object.values(mergedCategories), totalReviews });
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
    const rl = rateLimitCheck(req, { limit: 10, windowMs: 60_000, route: 'review_submit' });
    if (!rl.allowed && !rl.shadowed) {
      const res = httpError(429, 'Too Many Requests', 'RATE_LIMITED');
      setRateLimitHeaders(res, rl);
      return res;
    }
    const body = await parseJson(req, schemas.reviewCreate);
    const { rating, text, categoryIds, guestName } = body;

    // Honeypot check — bots that fill the hidden field get a fake success response
    if (body.honeypot) {
      return NextResponse.json({ message: 'Review submitted' });
    }

    // Timing check — submissions faster than 3 seconds are likely automated
    if (body.formLoadedAt && Date.now() - body.formLoadedAt < 3000) {
      return NextResponse.json({ error: 'Please take your time reviewing' }, { status: 400 });
    }

    const safeText = text ? sanitizeHTML(text) : '';
    const session = await getServerSession(authOptions);
    const resolvedParams = await params;
    const { id: contentId } = resolvedParams;
    
    // Get review count before adding new review
    const reviewCountBefore = await prisma.review.findMany({ where: { contentId } }).then((reviews: { length: number }) => reviews.length);

    let userId = null;
    // If user is authenticated, get their ID and check for existing review
    if (session?.user) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email as string },
      });
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      userId = user.id;
      
      // Check if the user has already reviewed this content
      const existingReview = await prisma.review.findFirst({
        where: {
          contentId,
          userId: user.id,
        },
      });
      if (existingReview) {
        return NextResponse.json({ error: 'You have already reviewed this content' }, { status: 400 });
      }
    }
    // Hash the IP address for guest review spam tracking (privacy-preserving)
    let ipHash: string | undefined;
    if (!userId) {
      const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || req.headers.get('x-real-ip') || 'unknown';
      ipHash = crypto.createHash('sha256').update(ip).digest('hex');
    }

    // Create the review
    const review = await prisma.review.create({
      data: {
        rating,
        text: safeText,
        userId,
        guestName: userId ? undefined : ((guestName && guestName.trim()) ? guestName.trim() : 'Anonymous'),
        ipHash: userId ? undefined : ipHash,
        contentId,
        categories: {
          create: categoryIds?.map((catId: string) => ({
            categoryId: catId,
          })) || [],
        },
      },
      include: {
        user: { select: { id: true, name: true, image: true, avatar: true } },
        categories: { include: { category: true } },
      },
    });
    if (userId) { checkReviewBadges(userId).catch(() => {}); }
    try { getPostHogClient().capture({ distinctId: userId ?? `guest-${ipHash}`, event: 'review_submitted', properties: { content_id: contentId, rating, category_count: categoryIds?.length ?? 0, is_guest: !userId } }); } catch {}

    // Update category scores for this content
    const reviewCategories = await prisma.reviewCategory.findMany({
      where: { reviewId: review.id },
      include: { category: true }
    });

    // Update or create category scores
    const categoryUpdates = reviewCategories.map(async (rc: { categoryId: string }) => {
      const existingScore = await prisma.categoryScore.findUnique({
        where: { contentId_categoryId: { contentId, categoryId: rc.categoryId } }
      });

      const newCount = (existingScore?.count || 0) + 1;
      const newScore = (existingScore?.score || 0) + review.rating;
      const percentage = (newCount / (reviewCountBefore + 1)) * 100;

      return prisma.categoryScore.upsert({
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
    const allReviews = await prisma.review.findMany({ where: { contentId } });
    const reviewCount = allReviews.length;
    const wokeScore = allReviews.length > 0 ? allReviews.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / allReviews.length : 0;
    await prisma.content.update({ where: { id: contentId }, data: { wokeScore, reviewCount } });

    // Update category percentages
    const allCategoryScores = await prisma.categoryScore.findMany({
      where: { contentId },
      include: { category: true }
    });
    const totalScore = allCategoryScores.reduce((sum: number, score: { score: number }) => sum + score.score, 0);
    
    const updatePercentages = allCategoryScores.map(async (score: { id: string; score: number }) => {
      const newPercentage = totalScore > 0 ? (score.score / totalScore) * 100 : 0;
      return prisma.categoryScore.update({
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
    const { rating, text, categoryIds } = await parseJson(req, schemas.reviewUpdate);
    const safeText = typeof text === 'string' ? sanitizeHTML(text) : undefined;
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const review = await prisma.review.findUnique({ where: { id } });
    const user = await prisma.user.findUnique({ where: { email: session.user.email as string } });
    if (!review || !user || review.userId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await prisma.review.update({
      where: { id },
      data: { rating, text: safeText },
    });

    const contentId = review.contentId;

    // Replace categories if provided
    if (categoryIds !== undefined) {
      await prisma.reviewCategory.deleteMany({ where: { reviewId: id } });
      if (categoryIds.length > 0) {
        await prisma.reviewCategory.createMany({
          data: categoryIds.map((catId: string) => ({ reviewId: id, categoryId: catId })),
        });
      }

      // Recalculate CategoryScore from scratch for this content
      const allReviewsWithCategories = await prisma.review.findMany({
        where: { contentId },
        include: { categories: true },
      });

      // Build per-category count + score aggregates
      const categoryAggregates: Record<string, { count: number; score: number }> = {};
      for (const r of allReviewsWithCategories) {
        for (const rc of r.categories) {
          if (!categoryAggregates[rc.categoryId]) {
            categoryAggregates[rc.categoryId] = { count: 0, score: 0 };
          }
          categoryAggregates[rc.categoryId].count += 1;
          categoryAggregates[rc.categoryId].score += r.rating;
        }
      }

      const totalScore = Object.values(categoryAggregates).reduce((sum, v) => sum + v.score, 0);

      // Upsert each category score
      await Promise.all(
        Object.entries(categoryAggregates).map(([categoryId, { count, score }]) =>
          prisma.categoryScore.upsert({
            where: { contentId_categoryId: { contentId, categoryId } },
            update: {
              count,
              score,
              percentage: totalScore > 0 ? (score / totalScore) * 100 : 0,
            },
            create: {
              contentId,
              categoryId,
              count,
              score,
              percentage: totalScore > 0 ? (score / totalScore) * 100 : 0,
            },
          })
        )
      );

      // Delete CategoryScore records for categories no longer referenced
      await prisma.categoryScore.deleteMany({
        where: {
          contentId,
          categoryId: { notIn: Object.keys(categoryAggregates) },
        },
      });
    }

    // Recalculate wokeScore for the content
    const allReviews = await prisma.review.findMany({ where: { contentId } });
    const reviewCount = allReviews.length;
    const wokeScore = reviewCount > 0
      ? allReviews.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / reviewCount
      : 0;
    await prisma.content.update({ where: { id: contentId }, data: { wokeScore, reviewCount } });

    try { getPostHogClient().capture({ distinctId: user.id, event: 'review_updated', properties: { review_id: id, content_id: review.contentId, rating } }); } catch {}
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
