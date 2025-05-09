import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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
      
      return {
        ...review,
        likes,
        dislikes,
        userReaction
      };
    }));
    
    return NextResponse.json(reviewsWithReactions);
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
    const review = await db.review.findUnique({ where: { id } });
    const user = await db.user.findUnique({ where: { email: session.user.email as string } });
    if (!review || !user || review.userId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const updated = await db.review.update({
      where: { id },
      data: { rating, text },
      include: {
        user: { select: { id: true, name: true, image: true } },
        categories: { include: { category: true } },
      },
    });
    const contentId = review.contentId;
    // Recalculate wokeScore and reviewCount
    const allReviews = await db.review.findMany({ where: { contentId } });
    const reviewCount = allReviews.length;
    const wokeScore = reviewCount > 0 ? allReviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviewCount : 0;
    await db.content.update({ where: { id: contentId }, data: { wokeScore, reviewCount } });
    return NextResponse.json(updated);
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

// DELETE handler
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const { id } = await params;
    const review = await db.review.findUnique({ where: { id } });
    const user = await db.user.findUnique({ where: { email: session.user.email as string } });
    if (!review || !user || review.userId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const contentId = review.contentId;
    await db.review.delete({ where: { id } });
    // Recalculate wokeScore and reviewCount
    const allReviews = await db.review.findMany({ where: { contentId } });
    const reviewCount = allReviews.length;
    const wokeScore = reviewCount > 0 ? allReviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviewCount : 0;
    await db.content.update({ where: { id: contentId }, data: { wokeScore, reviewCount } });
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
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const { rating, text, categories } = await req.json();
    if (typeof rating !== 'number' || rating < 0 || rating > 10) {
      return NextResponse.json({ error: 'Rating must be between 0 and 10' }, { status: 400 });
    }
    const resolvedParams = await params;
    const { id: contentId } = resolvedParams;
    // Get the user
    const user = await db.user.findUnique({
      where: { email: session.user.email as string },
    });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
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
    // Create the review
    const review = await db.review.create({
      data: {
        rating,
        text,
        userId: user.id,
        contentId,
        categories: {
          create: categories?.map((catId: string) => ({
            categoryId: catId,
          })) || [],
        },
      },
      include: {
        user: { select: { id: true, name: true, image: true } },
        categories: { include: { category: true } },
      },
    });
    // Recalculate the content's wokeScore and reviewCount
    const allReviews = await db.review.findMany({ where: { contentId } });
    const reviewCount = allReviews.length;
    const wokeScore = reviewCount > 0 ? allReviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviewCount : 0;
    await db.content.update({ where: { id: contentId }, data: { wokeScore, reviewCount } });
    return NextResponse.json(review);
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
