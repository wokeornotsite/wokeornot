'use client';
import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import axios from 'axios';

interface FavoriteButtonProps {
  contentId: string | number;
  contentType: 'movie' | 'tv' | 'kids';
  title: string;
  posterPath?: string;
  wokeScore?: number;
}

export const FavoriteButton: React.FC<FavoriteButtonProps> = ({
  contentId,
  contentType,
  title,
  posterPath,
  wokeScore,
}) => {
  const { data: session } = useSession();
  const [favorite, setFavorite] = useState(false);
  const [loading, setLoading] = useState(false);

  // Check if already favorited on mount
  useEffect(() => {
    if (!session) return;
    
    async function checkFavorite() {
      try {
        const res = await axios.get('/api/favorites');
        const favorites = res.data.favorites || [];
        const isFavorited = favorites.some(
          (fav: any) => fav.contentId === String(contentId) && fav.contentType === contentType
        );
        setFavorite(isFavorited);
      } catch (error) {
        console.error('Error checking favorite:', error);
      }
    }
    
    checkFavorite();
  }, [session, contentId, contentType]);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!session) {
      alert('Please sign in to add favorites');
      return;
    }

    setLoading(true);
    
    try {
      if (favorite) {
        // Remove from favorites
        await axios.delete(`/api/favorites?contentId=${contentId}&contentType=${contentType}`);
        setFavorite(false);
      } else {
        // Add to favorites
        await axios.post('/api/favorites', {
          contentId: String(contentId),
          contentType,
          title,
          posterPath,
          wokeScore,
        });
        setFavorite(true);
      }
    } catch (error: any) {
      console.error('Error toggling favorite:', error);
      if (error.response?.status === 409) {
        // Already favorited
        setFavorite(true);
      } else {
        alert('Failed to update favorites');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      aria-label={favorite ? 'Remove from favorites' : 'Add to favorites'}
      className={`rounded-full p-2 transition border border-blue-400/30 bg-blue-950/60 hover:bg-blue-800/80 ${favorite ? 'text-yellow-400' : 'text-blue-200'}`}
      onClick={handleClick}
      tabIndex={0}
    >
      {favorite ? (
        <svg viewBox="0 0 24 24" fill="currentColor" width={24} height={24}><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41 0.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
      ) : (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={24} height={24}><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41 0.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
      )}
    </button>
  );
};
