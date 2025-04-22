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

interface ContentCardProps {
  content?: ContentItem;
  loading?: boolean;
}

export const ClientContentCard: React.FC<ContentCardProps> = ({ content, loading }) => {
  const [imgError, setImgError] = useState(false);
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
          <FavoriteButton />
        </div>
        <div className="relative pb-[150%] bg-gradient-to-br from-[#232946] via-[#232946]/80 to-[#181824]">
          <Image
            src={imgError || !content.posterPath ? '/images/placeholder.png' : getImageUrl(content.posterPath)}
            alt={content.title}
            className={`absolute inset-0 w-full h-full object-cover bg-[#181824] group-hover:brightness-110 group-focus:brightness-110 transition-all duration-300 ${imgError ? 'blur-sm grayscale' : ''}`}
            fill
            sizes="(max-width: 768px) 100vw, 320px"
            priority
            onError={() => setImgError(true)}
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
          <h3 className="font-semibold text-lg mb-1 line-clamp-2 text-white drop-shadow-sm">{content.title}</h3>
          {content.genres && content.genres.length > 0 && (
            <div className="mb-2">
              <GenreBadges genres={content.genres.filter(g => g.name)} />
            </div>
          )}
          <p className="text-blue-200 text-xs mb-2">
            {content.releaseDate ? new Date(content.releaseDate).getFullYear() : 'Unknown'}
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
