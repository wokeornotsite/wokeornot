import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Fetch last 100 non-hidden reviews ordered by most recent
    const recentReviews = await prisma.review.findMany({
      where: { isHidden: false },
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: { contentId: true },
    });

    // Deduplicate by contentId, keep first occurrence (most recent review per item)
    const seen = new Set<string>();
    const uniqueContentIds: string[] = [];
    for (const r of recentReviews) {
      if (!seen.has(r.contentId)) {
        seen.add(r.contentId);
        uniqueContentIds.push(r.contentId);
        if (uniqueContentIds.length === 10) break;
      }
    }

    if (uniqueContentIds.length === 0) {
      return NextResponse.json([], {
        headers: { 'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300' },
      });
    }

    // Batch-fetch the content rows
    const contents = await prisma.content.findMany({
      where: { id: { in: uniqueContentIds } },
      select: {
        id: true,
        tmdbId: true,
        title: true,
        overview: true,
        posterPath: true,
        backdropPath: true,
        releaseDate: true,
        contentType: true,
        wokeScore: true,
        reviewCount: true,
      },
    });

    // Re-sort to match review recency order
    const contentMap = Object.fromEntries(contents.map(c => [c.id, c]));
    const sorted = uniqueContentIds
      .map(id => contentMap[id])
      .filter(Boolean);

    return NextResponse.json(sorted, {
      headers: { 'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300' },
    });
  } catch (error) {
    return NextResponse.json([], { status: 200 });
  }
}
