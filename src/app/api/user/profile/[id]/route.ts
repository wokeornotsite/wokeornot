import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/user/profile/[id]
 * Returns public profile data for a user.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        image: true,
        avatar: true,
        bio: true,
        createdAt: true,
        role: true,
        _count: {
          select: {
            reviews: true,
            comments: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Fetch recent reviews by this user
    const recentReviews = await prisma.review.findMany({
      where: { userId: id, isHidden: false },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        content: {
          select: { tmdbId: true, title: true, posterPath: true, contentType: true, wokeScore: true },
        },
        categories: { include: { category: true } },
      },
    });

    // Fetch user's badges
    const badges = await prisma.userBadge.findMany({
      where: { userId: id },
      include: { badge: true },
      orderBy: { earnedAt: 'desc' },
    });

    // Calculate average rating
    const avgRating = await prisma.review.aggregate({
      where: { userId: id, isHidden: false },
      _avg: { rating: true },
    });

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        image: user.image,
        avatar: user.avatar,
        bio: user.bio,
        role: user.role,
        createdAt: user.createdAt,
        reviewCount: user._count.reviews,
        commentCount: user._count.comments,
        avgRating: avgRating._avg.rating ?? 0,
      },
      recentReviews: recentReviews.map(r => ({
        id: r.id,
        rating: r.rating,
        text: r.text,
        createdAt: r.createdAt,
        content: r.content ? {
          tmdbId: r.content.tmdbId,
          title: r.content.title,
          posterPath: r.content.posterPath,
          contentType: r.content.contentType === 'TV_SHOW' ? 'tv' : r.content.contentType === 'KIDS' ? 'kids' : 'movie',
          wokeScore: r.content.wokeScore,
        } : null,
        categories: r.categories.map(rc => ({
          id: rc.categoryId,
          name: rc.category.name,
        })),
      })),
      badges: badges.map(ub => ({
        id: ub.badge.id,
        key: ub.badge.key,
        name: ub.badge.name,
        description: ub.badge.description,
        icon: ub.badge.icon,
        earnedAt: ub.earnedAt,
      })),
    });
  } catch (error) {
    console.error('User profile error:', error);
    return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 });
  }
}
