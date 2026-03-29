import React from 'react';
import { ClientContentCard } from '@/components/ui/client-content-card';

const CONTENT_TYPE_LABELS: Record<string, string> = {
  MOVIE: 'Movie',
  TV_SHOW: 'TV Show',
  KIDS: 'Kids',
};

export default async function RecentlyRatedSection() {
  let items: any[] = [];

  try {
    const res = await fetch(
      `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/recently-rated`,
      { next: { revalidate: 120 } }
    );
    if (res.ok) {
      items = await res.json();
    }
  } catch {
    // Silently skip if unavailable
  }

  if (!items || items.length === 0) return null;

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
