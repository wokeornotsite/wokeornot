"use client";
import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ContentItem } from '@/types';
import { getImageUrl } from '@/lib/tmdb';
import { GenreBadges } from './genre-badges';
import { FavoriteButton } from './favorite-button';
import { CategoryIcon } from './category-icon';
import { SkeletonCard } from './skeleton-card';
import { getWokenessLabel, getWokenessBadgeColor, getWokenessBadgeBg, formatWokenessScore, getWokenessTextColor } from '@/lib/wokeness-utils';
import { getYear } from '@/lib/date-utils';

interface ContentCardProps {
  content?: ContentItem;
  loading?: boolean;
}

export const ClientContentCard: React.FC<ContentCardProps> = ({ content, loading }) => {
  const [imgError, setImgError] = useState(false);
  if (loading || !content) return <SkeletonCard />;
  const contentType = (content.contentType ?? 'kids').toLowerCase();
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
          <FavoriteButton />
        </div>
        <div className="relative pb-[150%] bg-gradient-to-br from-[#232946] via-[#232946]/80 to-[#181824]">
          <Image
            src={imgError || !content.posterPath ? '/images/placeholder.png' : getImageUrl(content.posterPath)}
            alt={content.title}
            className={`absolute inset-0 w-full h-full object-cover bg-[#181824] group-hover:brightness-110 group-focus:brightness-110 transition-all duration-300 ${imgError ? 'blur-sm grayscale' : ''}`}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            loading="lazy"
            quality={75}
            unoptimized
            onError={() => setImgError(true)}
          />
          <div className="absolute top-2 right-2">
            <div className={`px-3 py-1 rounded-full font-bold text-base shadow-xl flex items-center gap-2 ${getWokenessBadgeColor(content.wokeScore)}`}
                 style={{ border: '2px solid #fff', background: getWokenessBadgeBg(content.wokeScore) }}>
              {content.reviewCount === 0 ? 'Not yet rated' : getWokenessLabel(content.wokeScore)}
              {content.reviewCount === 0 ? null : <span className="text-lg font-black">{typeof content.wokeScore === 'number' ? content.wokeScore.toFixed(1) : '0.0'}/10</span>}
            </div>
          </div>
        </div>
        <div className="p-4 flex-grow flex flex-col">
          {/* Animated border overlay */}
          <div className="pointer-events-none absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-gradient-to-tr group-hover:from-pink-400 group-hover:to-blue-400 group-focus-within:border-gradient-to-tr group-focus-within:from-pink-400 group-focus-within:to-blue-400 transition-all duration-300 z-20" aria-hidden="true" />
          <h3 className="font-semibold text-lg mb-1 line-clamp-2 text-white drop-shadow-sm">{content.title}</h3>
          {content.genres && content.genres.length > 0 && (
            <div className="mb-2">
              {/* Filter out genres with missing or empty names */}
              <GenreBadges genres={content.genres.filter(g => g?.name && g.name.trim())} />
            </div>
          )}
          <p className="text-blue-200 text-xs mb-2">
            {getYear(content.releaseDate) || getYear((content as any).release_date) || ''}
          </p>
          <p className="text-gray-200 text-sm line-clamp-3 flex-grow mb-2">{content.overview}</p>
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
