import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { rateLimitCheck, setRateLimitHeaders } from '@/lib/rateLimit';
import { parseJson, schemas } from '@/lib/validation';
import { error } from '@/lib/http';
import { createNotification } from '@/lib/notifications';
import { checkHelpfulBadge } from '@/lib/badges';

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
    // Shadow-mode rate limiting for reactions (IP-based). Does not block when in shadow, but logs and sets headers.
    const rl = rateLimitCheck(request, { limit: 30, windowMs: 60_000, route: 'review_reaction' });
    if (!rl.allowed && !rl.shadowed) {
      const res = error(429, 'Too Many Requests', 'RATE_LIMITED');
      setRateLimitHeaders(res, rl);
      return res;
    }

    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      const res = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      setRateLimitHeaders(res, rl);
      return res;
    }

    // Next.js 15 requires awaiting params
    const resolvedParams = await params;
    const reviewId = resolvedParams.id;
    const { reaction } = await parseJson(request, schemas.reaction);

    // Zod already validates reaction value

    // Get the current user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email as string },
    });

    if (!user) {
      const res = NextResponse.json({ error: 'User not found' }, { status: 404 });
      setRateLimitHeaders(res, rl);
      return res;
    }

    // Check if the review exists
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }
    
    // Check if the user has already reacted to this review
    const existingReaction = await prisma.reviewReaction.findFirst({
      where: {
        userId: user.id,
        reviewId: reviewId
      }
    });

    // Handle the reaction logic
    if (existingReaction) {
      if (existingReaction.type === reaction) {
        // User is toggling off their reaction
        await prisma.reviewReaction.deleteMany({
          where: {
            userId: user.id,
            reviewId: reviewId
          }
        });
      } else {
        // User is changing their reaction from like to dislike or vice versa
        await prisma.reviewReaction.updateMany({
          where: {
            userId: user.id,
            reviewId: reviewId
          },
          data: { type: reaction }
        });
      }
    } else {
      // User is adding a new reaction
      await prisma.reviewReaction.create({
        data: {
          type: reaction,
          userId: user.id,
          reviewId: reviewId
        }
      });

      if (reaction === 'like' && review.userId) { checkHelpfulBadge(review.userId).catch(() => {}); }

      // Notify review author if it's not the current user
      if (review.userId && review.userId !== user.id) {
        const content = await prisma.content.findUnique({
          where: { id: review.contentId },
          select: { tmdbId: true, contentType: true },
        });
        if (content) {
          const linkPrefix =
            content.contentType === 'TV_SHOW'
              ? '/tv-shows'
              : content.contentType === 'KIDS'
              ? '/kids'
              : '/movies';
          await createNotification({
            userId: review.userId,
            type: 'REVIEW_REACTION',
            message: 'Someone liked your review',
            link: `${linkPrefix}/${content.tmdbId}`,
          });
        }
      }
    }

    // Get updated counts
    const likes = await prisma.reviewReaction.count({
      where: {
        reviewId,
        type: 'like'
      }
    });

    const dislikes = await prisma.reviewReaction.count({
      where: {
        reviewId,
        type: 'dislike'
      }
    });

    // Get the user's current reaction after the update
    const updatedUserReaction = await prisma.reviewReaction.findFirst({
      where: {
        userId: user.id,
        reviewId: reviewId
      }
    });

    const res = NextResponse.json({
      likes,
      dislikes,
      userReaction: updatedUserReaction ? updatedUserReaction.type : null
    });
    setRateLimitHeaders(res, rl);
    return res;
  } catch (error) {
    console.error('Error handling review reaction:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
