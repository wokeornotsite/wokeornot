import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireStaffAPI } from '@/lib/admin-auth';

/**
 * GET /api/admin/search?q=...
 *
 * Cross-entity admin search. Returns up to 5 matches from each of:
 *   - Users (email or name)
 *   - Reviews (text)
 *   - Content (title)
 *   - ForumThread (title)
 *
 * Designed for the AdminSearchBar dropdown. Staff-gated.
 */
export async function GET(req: NextRequest) {
  const auth = await requireStaffAPI();
  if ('error' in auth) return auth.error;

  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q')?.trim() ?? '';

  if (q.length < 2) {
    return NextResponse.json({ users: [], reviews: [], content: [], forumThreads: [] });
  }

  const TAKE = 5;

  try {
    const [users, reviews, content, forumThreads] = await Promise.all([
      prisma.user.findMany({
        where: {
          OR: [
            { email: { contains: q, mode: 'insensitive' } },
            { name: { contains: q, mode: 'insensitive' } },
          ],
        },
        select: { id: true, email: true, name: true, role: true, isBanned: true },
        take: TAKE,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.review.findMany({
        where: { text: { contains: q, mode: 'insensitive' } },
        select: {
          id: true,
          text: true,
          rating: true,
          isHidden: true,
          contentId: true,
          user: { select: { email: true } },
          guestName: true,
        },
        take: TAKE,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.content.findMany({
        where: { title: { contains: q, mode: 'insensitive' } },
        select: { id: true, title: true, contentType: true, reviewCount: true, wokeScore: true },
        take: TAKE,
        orderBy: { reviewCount: 'desc' },
      }),
      prisma.forumThread.findMany({
        where: { title: { contains: q, mode: 'insensitive' } },
        select: { id: true, title: true, userId: true, createdAt: true },
        take: TAKE,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    // Resolve content titles for any reviews we returned (best-effort).
    const objectIdHex = /^[a-f\d]{24}$/i;
    const reviewContentIds = Array.from(
      new Set(
        reviews
          .map((r) => r.contentId)
          .filter((id): id is string => Boolean(id) && objectIdHex.test(id as string))
      )
    );
    const reviewContents = reviewContentIds.length
      ? await prisma.content.findMany({
          where: { id: { in: reviewContentIds } },
          select: { id: true, title: true },
        })
      : [];
    const contentTitleById = new Map(reviewContents.map((c) => [c.id, c.title]));

    return NextResponse.json({
      users,
      reviews: reviews.map((r) => ({
        ...r,
        contentTitle: r.contentId ? contentTitleById.get(r.contentId) ?? null : null,
      })),
      content,
      forumThreads,
    });
  } catch (err) {
    console.error('[admin/search] failed', err);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
