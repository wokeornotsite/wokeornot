import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET handler
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const reviews = await prisma.review.findMany({
      where: { contentId: id },
      include: {
        user: { select: { id: true, name: true, image: true } },
        categories: { include: { category: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(reviews);
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

// PATCH handler
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { rating, text } = await req.json();
  try {
    const resolvedParams = await params;
  const { id } = resolvedParams;
  const review = await prisma.review.findUnique({ where: { id } });
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!review || !user || review.userId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const updated = await prisma.review.update({
      where: { id },
      data: { rating, text },
      include: {
        user: { select: { id: true, name: true, image: true } },
        categories: { include: { category: true } },
      },
    });
    // Recalculate wokeScore and reviewCount
    const contentId = review.contentId;
    const allReviews = await prisma.review.findMany({ where: { contentId } });
    const reviewCount = allReviews.length;
    const wokeScore = reviewCount > 0 ? allReviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount : 0;
    await prisma.content.update({ where: { id: contentId }, data: { wokeScore, reviewCount } });
    return NextResponse.json(updated);
  } catch (err) {
    return NextResponse.json({ error: 'Failed to update review' }, { status: 500 });
  }
}

// DELETE handler
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const { id } = await params;
    const review = await prisma.review.findUnique({ where: { id } });
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!review || !user || review.userId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const contentId = review.contentId;
    await prisma.review.delete({ where: { id } });
    // Recalculate wokeScore and reviewCount
    const allReviews = await prisma.review.findMany({ where: { contentId } });
    const reviewCount = allReviews.length;
    const wokeScore = reviewCount > 0 ? allReviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount : 0;
    await prisma.content.update({ where: { id: contentId }, data: { wokeScore, reviewCount } });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    let message = 'Failed to delete review.';
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
    const session = await getServerSession(authOptions);
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const { rating, text, categoryIds, guestName } = await req.json();

    // Check content exists
    const content = await prisma.content.findUnique({ where: { id: id } });
    if (!content) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 });
    }
    if (rating > 1 && (!categoryIds || !categoryIds.length)) {
      return NextResponse.json({ error: 'At least one category must be selected for this rating.' }, { status: 400 });
    }
    if (categoryIds && categoryIds.length) {
      const validCategories = await prisma.category.findMany({ where: { id: { in: categoryIds } } });
      if (validCategories.length !== categoryIds.length) {
        return NextResponse.json({ error: 'One or more categories not found' }, { status: 400 });
      }
    }

    let userId: string | undefined = undefined;
    let reviewExists = false;
    // Always explicitly build reviewData, never include a 'user' property
    let reviewData: any = {
      contentId: id,
      rating,
      text: guestName ? `[Guest: ${guestName}] ${text}` : text,
      categories: {
        create: (categoryIds || []).filter(Boolean).map((categoryId: string) => ({ categoryId })),
      },
    };
    if (session && session.user && session.user.id) {
      // Authenticated user
      const dbUser = await prisma.user.findUnique({ where: { email: session.user.email } });
      if (!dbUser) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      userId = dbUser.id;
      reviewData.userId = userId;
      // Only enforce uniqueness for logged-in users
      reviewExists = !!(await prisma.review.findFirst({ where: { userId, contentId: id } }));
    }
    // For guests, allow multiple reviews per content (do not check for duplicates)
    if (reviewExists) {
      return NextResponse.json({ error: 'You have already reviewed this content.' }, { status: 400 });
    }
    // Debug log to verify reviewData shape
    console.log('[DEBUG] reviewData to be created:', JSON.stringify(reviewData, null, 2));
    
    // Create the review with explicit handling for both authenticated and guest users
    let createData: any = {
      contentId: id,
      rating,
      text: guestName ? `[Guest: ${guestName}] ${text}` : text,
      categories: {
        create: (categoryIds || []).filter(Boolean).map((categoryId: string) => ({ categoryId })),
      },
    };
    
    // Only add userId for authenticated users (MongoDB/Prisma)
    if (userId) {
      createData.userId = userId;
    }
    
    const review = await prisma.review.create({
      data: createData,
      include: {
        user: { select: { id: true, name: true, image: true } },
        categories: { include: { category: true } },
      },
    });

    // Aggregation and update logic
    const allReviews = await prisma.review.findMany({
      where: { contentId: id },
      include: { categories: true },
    });
    console.log('[DEBUG] allReviews:', JSON.stringify(allReviews, null, 2));
    const reviewCount = allReviews.length;
    const wokeScore = reviewCount > 0 ? allReviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviewCount : 0;
    await prisma.content.update({
      where: { id: id },
      data: { wokeScore, reviewCount },
    });
    const reviewIds = allReviews.map(r => r.id);
const allReviewCategories = await prisma.reviewCategory.findMany({
  where: { reviewId: { in: reviewIds } },
});
    console.log('[DEBUG] allReviewCategories:', JSON.stringify(allReviewCategories, null, 2));
    console.log('[DEBUG] reviewCount:', reviewCount);
    const categoryStats: Record<string, { count: number; scoreSum: number }> = {};
    for (const rc of allReviewCategories) {
      if (!categoryStats[rc.categoryId]) {
        categoryStats[rc.categoryId] = { count: 0, scoreSum: 0 };
      }
      const reviewObj = allReviews.find((r: any) => r.id === rc.reviewId);
      if (reviewObj) {
        categoryStats[rc.categoryId].count += 1;
        categoryStats[rc.categoryId].scoreSum += reviewObj.rating;
      }
    }
        // Calculate percentage based on number of reviews, not total category votes
    console.log('[DEBUG] categoryStats:', JSON.stringify(categoryStats, null, 2));
for (const [categoryId, stat] of Object.entries(categoryStats)) {
  const percentage = reviewCount > 0 ? Math.round((stat.count / reviewCount) * 100) : 0;
  console.log(`[DEBUG] Upserting categoryScore for categoryId=${categoryId}: count=${stat.count}, percentage=${percentage}`);
  await prisma.categoryScore.upsert({
    where: { contentId_categoryId: { contentId: id, categoryId } },
    update: {
      score: stat.count > 0 ? stat.scoreSum / stat.count : 0,
      count: stat.count,
      percentage,
    },
    create: {
      contentId: id,
      categoryId,
      score: stat.count > 0 ? stat.scoreSum / stat.count : 0,
      count: stat.count,
      percentage,
    },
  });
}
console.log('[DEBUG] Deleting categoryScores with count=0 for contentId:', id);
await prisma.categoryScore.deleteMany({ where: { contentId: id, count: 0 } });

    // Return review
    return NextResponse.json(review);
  } catch (error: unknown) {
    let message = 'Failed to submit review.';
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
