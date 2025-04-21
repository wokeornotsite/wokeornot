'use client';
import React, { useState } from 'react';

interface FavoriteButtonProps {
  initialFavorite?: boolean;
  onToggle?: (fav: boolean) => void;
}

export const FavoriteButton: React.FC<FavoriteButtonProps> = ({ initialFavorite = false, onToggle }) => {
  const [favorite, setFavorite] = useState(initialFavorite);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setFavorite(fav => {
      const newFav = !fav;
      onToggle?.(newFav);
      return newFav;
    });
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
