import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromBearerToken, formatUserResponse } from '@/lib/mobile-auth';

/**
 * GET /api/auth/mobile/me
 * Returns the current user's profile from a Bearer JWT.
 * Used by the mobile app to check auth status on launch.
 */
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const user = await getUserFromBearerToken(authHeader);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch additional profile data
    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        avatar: true,
        role: true,
        bio: true,
        createdAt: true,
        _count: {
          select: {
            reviews: true,
            comments: true,
            favorites: true,
          },
        },
      },
    });

    if (!fullUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        ...formatUserResponse(fullUser),
        bio: fullUser.bio,
        createdAt: fullUser.createdAt,
        reviewCount: fullUser._count.reviews,
        commentCount: fullUser._count.comments,
        favoriteCount: fullUser._count.favorites,
      },
    });
  } catch (error) {
    console.error('Mobile /me error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
