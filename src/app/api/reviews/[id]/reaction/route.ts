import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Type assertion to bypass TypeScript errors until Prisma types are updated
const db = prisma as any;

// Need to run prisma generate after schema changes
// This is a temporary type until Prisma generates the proper types
type ReviewWithReactions = {
  id: string;
  reactions: Array<{ id: string; type: string; userId: string }>;
};

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Next.js 15 requires awaiting params
    const resolvedParams = await params;
    const reviewId = resolvedParams.id;
    const { reaction } = await request.json();

    if (!['like', 'dislike'].includes(reaction)) {
      return NextResponse.json({ error: 'Invalid reaction type' }, { status: 400 });
    }

    // Get the current user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email as string },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if the review exists
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }
    
    // Check if the user has already reacted to this review
    const existingReaction = await db.reviewReaction.findFirst({
      where: {
        userId: user.id,
        reviewId: reviewId
      }
    });

    // Handle the reaction logic
    if (existingReaction) {
      if (existingReaction.type === reaction) {
        // User is toggling off their reaction
        await db.reviewReaction.deleteMany({
          where: {
            userId: user.id,
            reviewId: reviewId
          }
        });
      } else {
        // User is changing their reaction from like to dislike or vice versa
        await db.reviewReaction.updateMany({
          where: {
            userId: user.id,
            reviewId: reviewId
          },
          data: { type: reaction }
        });
      }
    } else {
      // User is adding a new reaction
      await db.reviewReaction.create({
        data: {
          type: reaction,
          userId: user.id,
          reviewId: reviewId
        }
      });
    }

    // Get updated counts
    const likes = await db.reviewReaction.count({
      where: {
        reviewId,
        type: 'like'
      }
    });

    const dislikes = await db.reviewReaction.count({
      where: {
        reviewId,
        type: 'dislike'
      }
    });

    // Get the user's current reaction after the update
    const updatedUserReaction = await db.reviewReaction.findFirst({
      where: {
        userId: user.id,
        reviewId: reviewId
      }
    });

    return NextResponse.json({
      likes,
      dislikes,
      userReaction: updatedUserReaction ? updatedUserReaction.type : null
    });
  } catch (error) {
    console.error('Error handling review reaction:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
