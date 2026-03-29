import React from 'react';
import { prisma } from '@/lib/prisma';
import { ClientContentCard } from '@/components/ui/client-content-card';

const CONTENT_TYPE_LABELS: Record<string, string> = {
  MOVIE: 'Movie',
  TV_SHOW: 'TV Show',
  KIDS: 'Kids',
};

export default async function RecentlyRatedSection() {
  let items: any[] = [];

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

    if (uniqueContentIds.length > 0) {
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
      items = uniqueContentIds.map(id => contentMap[id]).filter(Boolean);
    }
  } catch {
    // Silently skip on error
  }

  if (items.length === 0) return null;

  return (
    <section className="py-12 bg-[#0f0f1a]">
      <div className="container mx-auto px-6">
        <h2 className="text-2xl font-bold mb-6 text-white">
          <span className="relative inline-block">
            Recently Rated by the Community
            <span className="absolute -bottom-2 left-0 right-1/2 h-1 bg-gradient-to-r from-purple-500 to-transparent rounded-full"></span>
          </span>
        </h2>
        <div className="flex gap-5 overflow-x-auto pb-3 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          {items.map((item: any) => (
            <div key={item.id} className="min-w-[200px] max-w-[220px] flex flex-col gap-2">
              <ClientContentCard
                content={{
                  id: item.id,
                  tmdbId: item.tmdbId,
                  title: item.title,
                  overview: item.overview || '',
                  posterPath: item.posterPath,
                  backdropPath: item.backdropPath,
                  releaseDate: item.releaseDate ? new Date(item.releaseDate) : undefined,
                  contentType: item.contentType,
                  wokeScore: item.wokeScore ?? 0,
                  reviewCount: item.reviewCount ?? 0,
                  genres: [],
                }}
              />
              {item.contentType && (
                <span className="text-center text-xs font-semibold px-2 py-0.5 rounded-full bg-white/10 text-blue-200 border border-white/10 self-center">
                  {CONTENT_TYPE_LABELS[item.contentType] ?? item.contentType}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
