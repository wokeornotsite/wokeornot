import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ContentItem } from '@/types';
import { getImageUrl } from '@/lib/tmdb';
import { GenreBadges } from './genre-badges';
import { FavoriteButton } from './favorite-button';
import { CategoryIcon } from './category-icon';
import { getYear } from '@/lib/date-utils';

import { SkeletonCard } from './skeleton-card';

interface ContentCardProps {
  content?: ContentItem;
  loading?: boolean;
}

export const ContentCard: React.FC<ContentCardProps> = ({ content, loading }) => {
  if (loading || !content) return <SkeletonCard />;
  const contentType = content.contentType.toLowerCase();
  const contentUrl = `/${contentType === 'tv_show' ? 'tv-shows' : contentType === 'movie' ? 'movies' : 'kids'}/${content.tmdbId}`;
  
  return (
    <Link href={contentUrl}>
      <div
        className="relative rounded-2xl overflow-hidden h-full flex flex-col group border border-white/20 backdrop-blur-xl bg-white/10 shadow-2xl transition-transform duration-200 hover:scale-105 focus-within:scale-105 hover:border-gradient-to-tr hover:from-pink-400 hover:to-blue-400 focus-within:border-gradient-to-tr focus-within:from-pink-400 focus-within:to-blue-400"
        tabIndex={0}
        aria-label={`View details for ${content.title}`}
      >
        {/* Favorite Button */}
        <div className="absolute top-2 left-2 z-10">
          <FavoriteButton
            contentId={content.tmdbId ?? (content as any).id}
            contentType={contentType === 'tv_show' ? 'tv' : (contentType as 'movie' | 'tv' | 'kids')}
            title={content.title}
            posterPath={content.posterPath ?? undefined}
            wokeScore={typeof content.wokeScore === 'number' ? content.wokeScore : undefined}
          />
        </div>
        <div className="relative pb-[150%] bg-gradient-to-br from-[#232946] via-[#232946]/80 to-[#181824]">
          <Image
            src={content.posterPath ? getImageUrl(content.posterPath) : '/images/placeholder.png'}
            alt={content.title}
            className="absolute inset-0 w-full h-full object-cover bg-[#181824] group-hover:brightness-110 group-focus:brightness-110 transition-all duration-300 group-hover:blur-[1px] group-focus:blur-[1px]"
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            loading="lazy"
            quality={75}
            unoptimized
            onError={(e:any) => { e.currentTarget.onerror = null; e.currentTarget.src = '/images/placeholder.png'; e.currentTarget.classList.add('blur-sm'); }}
          />
          <div className="absolute top-2 right-2">
  <div className={`px-3 py-1 rounded-full font-bold text-base shadow-xl flex items-center gap-2 ${getWokenessBadgeColor(content.wokeScore)}`}
       style={{ border: '2px solid #fff', background: getWokenessBadgeBg(content.wokeScore) }}>
    {content.reviewCount === 0 ? 'Not yet rated' : getWokenessLabel(content.wokeScore)}
    {content.reviewCount === 0 ? null : <span className="text-lg font-black">{content.wokeScore.toFixed(1)}/10</span>}
  </div>
</div>
        </div>
        <div className="p-4 flex-grow flex flex-col">
          {/* Animated border overlay */}
          <div className="pointer-events-none absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-gradient-to-tr group-hover:from-pink-400 group-hover:to-blue-400 group-focus-within:border-gradient-to-tr group-focus-within:from-pink-400 group-focus-within:to-blue-400 transition-all duration-300 z-20" aria-hidden="true" />
          {/* Wokeness Score Badge */}
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-base font-bold ${getWokenessTextColor(content.wokeScore)}`}>{content.reviewCount === 0 ? 'Not yet rated' : getWokenessLabel(content.wokeScore)}</span>
            {content.reviewCount === 0 ? null : <span className="text-lg font-extrabold text-gray-900">{content.wokeScore.toFixed(1)}/10</span>}
          </div>

          {/* Woke Reasons (Gradient Bars) */}
          <div className="mb-3">
            <h4 className="text-xs font-bold text-blue-400 mb-1 tracking-wide uppercase">Woke Reasons</h4>
            {content.categoryScores && content.categoryScores.length > 0 ? (
              <div className="w-full flex flex-col gap-1">
                {content.categoryScores.filter(cs => cs.count > 0).sort((a, b) => b.percentage - a.percentage).map(cs => (
                  <div key={cs.categoryId} className="flex items-center gap-2 w-full">
                    <span className="w-32 text-xs font-semibold text-white truncate drop-shadow-sm flex items-center">
                      <CategoryIcon name={cs.category?.name} />
                      {cs.category?.name || ''}
                    </span>
                    <div className="flex-1 bg-blue-100 rounded-full h-5 relative overflow-hidden">
                      <div
                        className="h-5 rounded-full bg-gradient-to-r from-blue-400 via-blue-600 to-blue-800 animate-fadeIn"
                        style={{ 
                          width: `${cs.percentage}%`, 
                          transition: 'width 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)', 
                          animationDuration: '0.6s' 
                        }}
                      />
                      <span className="absolute left-2 top-0 text-xs text-white font-bold h-5 flex items-center drop-shadow-sm">{cs.percentage}%</span>
                    </div>
                    <span className="w-14 text-xs text-white font-medium text-right drop-shadow-sm">{cs.count} vote{cs.count !== 1 ? 's' : ''}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-gray-400 italic">No wokeness reasons yet. Be the first to rate!</div>
            )}
          </div>

          <h3 className="font-semibold text-lg mb-1 line-clamp-2 text-white drop-shadow-sm">{content.title}</h3>
          {/* Genre Badges */}
          {content.genres && content.genres.length > 0 && (
            <div className="mb-2">
              {/* Filter out genres with missing or empty names */}
              <GenreBadges genres={content.genres.filter(g => g?.name && g.name.trim())} />
            </div>
          )}
          <p className="text-blue-200 text-xs mb-2">
            {getYear(content.releaseDate) || 'Unknown'}
          </p>
          <p className="text-gray-200 text-sm line-clamp-3 flex-grow mb-2">{content.overview}</p>
          {/* Wokeness indicator */}
          
          <div className="mt-2 flex justify-between items-center">
            <span className="text-xs text-blue-300">
              {content.reviewCount} {content.reviewCount === 1 ? 'review' : 'reviews'}
            </span>
            <span className={`text-xs font-bold ${getWokenessTextColor(content.wokeScore)}`}>{content.reviewCount === 0 ? 'Not yet rated' : getWokenessLabel(content.wokeScore)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

// Helper functions for wokeness visualization
const getWokenessBadgeColor = (score: number) => {
  if (score <= 3) return 'bg-green-500 text-white';
  if (score <= 6) return 'bg-yellow-400 text-gray-900';
  return 'bg-red-500 text-white';
};

const getWokenessBadgeBg = (score: number) => {
  if (score <= 3) return 'linear-gradient(90deg,#d1fae5 0%,#6ee7b7 100%)';
  if (score <= 6) return 'linear-gradient(90deg,#fef9c3 0%,#fde68a 100%)';
  return 'linear-gradient(90deg,#fee2e2 0%,#fca5a5 100%)';
};

const getWokenessTextColor = (score: number) => {
  if (score <= 3) return 'text-green-600';
  if (score <= 6) return 'text-yellow-600';
  return 'text-red-600';
};

const getWokenessLabel = (score: number) => {
  if (score <= 3) return 'Not Woke';
  if (score <= 6) return 'Moderately Woke';
  return 'Very Woke';
};
