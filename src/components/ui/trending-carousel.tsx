// Test redeploy: trigger Vercel with a tiny change
import Image from 'next/image';
import Link from 'next/link';

interface TrendingItem {
  id: number;
  title?: string;
  name?: string;
  poster_path: string;
  vote_average?: number;
  wokeScore?: number;
  tmdbId?: number;
}

interface TrendingCarouselProps {
  items: TrendingItem[];
  type: 'movie' | 'tv';
  wokeScores?: Record<number, number>;
}

import React, { useRef } from 'react';

export default function TrendingCarousel({ items, type, wokeScores }: TrendingCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollBy = (dx: number) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: dx, behavior: 'smooth' });
    }
  };

  // Show arrows only if overflow is possible (basic check: more than 4 items)
  const showArrows = items.length > 4;

  return (
    <div className="relative">
      {showArrows && (
        <>
          <button
            aria-label="Scroll left"
            className="absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-[#18182a] bg-opacity-80 hover:bg-purple-600 hover:text-white text-gray-300 rounded-full shadow p-2 transition-colors disabled:opacity-40"
            style={{ marginLeft: '-16px' }}
            onClick={() => scrollBy(-220)}
          >
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <button
            aria-label="Scroll right"
            className="absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-[#18182a] bg-opacity-80 hover:bg-purple-600 hover:text-white text-gray-300 rounded-full shadow p-2 transition-colors disabled:opacity-40"
            style={{ marginRight: '-16px' }}
            onClick={() => scrollBy(220)}
          >
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </>
      )}
      <div
        ref={scrollRef}
        className="overflow-x-auto flex gap-4 pb-2 px-1 scrollbar-hide scroll-smooth trending-carousel-scrollbar"
        tabIndex={0}
        style={{ scrollBehavior: 'smooth' }}
      >
        {items.map((item) => (
          <Link
            key={item.id}
            href={`/${type === 'tv' ? 'tv-shows' : 'movies'}/${item.id}`}
            className="flex-shrink-0 w-32 sm:w-36 md:w-40 lg:w-44 group"
          >
            <div className="relative rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 bg-[#18182a]">
              <Image
                src={item.poster_path ? `https://image.tmdb.org/t/p/w300${item.poster_path}` : '/images/placeholder.png'}
                alt={item.title || item.name || 'Poster'}
                width={176}
                height={264}
                className="object-cover w-full h-48 sm:h-56"
                loading="lazy"
                unoptimized={!item.poster_path}
                sizes="(max-width: 640px) 128px, (max-width: 768px) 144px, (max-width: 1024px) 160px, 176px"
                quality={75}
              />
              <div className="absolute top-2 right-2 z-10 flex flex-col items-end gap-1">
                {(wokeScores && wokeScores[item.id] !== undefined) ? (
                  (() => {
                    // Calculate color: 0 (green) to 10 (red)
                    const score = wokeScores[item.id];
                    // Interpolate HSL: 120deg (green) to 0deg (red)
                    const hue = 120 - Math.round((score / 10) * 120); // 0=green, 10=red
                    const bg = `linear-gradient(90deg, hsl(${hue}, 80%, 45%), hsl(${hue}, 80%, 55%))`;
                    return (
                      <span
                        className="flex items-center gap-1 text-white text-xs px-2 py-1 rounded-full font-semibold shadow"
                        style={{ background: bg }}
                        title="Wokeness Score"
                      >
                        <span className="font-bold">{score.toFixed(1)}</span>
                        <span className="ml-1 bg-white/20 px-1.5 py-0.5 rounded text-[10px] font-bold tracking-widest">WOKE</span>
                      </span>
                    );
                  })()
                ) : item.vote_average !== undefined ? (
                  <span className="flex items-center gap-1 bg-gray-800 text-gray-200 text-xs px-2 py-1 rounded-full font-semibold shadow" title="TMDb User Rating">
                    <span className="font-bold">{item.vote_average.toFixed(1)}</span>
                    <span className="ml-1 bg-white/10 px-1.5 py-0.5 rounded text-[10px] font-bold tracking-widest">TMDb</span>
                  </span>
                ) : null}
              </div>
            </div>
            <div className="mt-2 text-xs sm:text-sm text-center text-gray-100 truncate">
              {item.title || item.name}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
