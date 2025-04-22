import React from 'react';

interface GenreBadgesProps {
  genres: { id: string; name: string }[];
}

export const GenreBadges: React.FC<GenreBadgesProps> = ({ genres }) => {
  if (!genres || genres.length === 0) return null;
  return (
    <div className="flex gap-1 flex-wrap">
      {genres.map(g => (
        <span key={g.id} className="bg-blue-900/40 px-2 py-1 rounded text-xs font-semibold text-blue-200 border border-blue-400/30">
          {g.name}
        </span>
      ))}
    </div>
  );
};
