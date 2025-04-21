import React from 'react';

// Map category names to icons (can expand as needed)
const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  'Gender': <span role="img" aria-label="Gender" className="text-pink-400 drop-shadow-glow">♀️</span>,
  'Race': <span role="img" aria-label="Race" className="text-yellow-400 drop-shadow-glow">✊🏽</span>,
  'LGBTQ+': <span role="img" aria-label="LGBTQ+" className="text-purple-400 drop-shadow-glow">🏳️‍🌈</span>,
  'Religion': <span role="img" aria-label="Religion" className="text-blue-400 drop-shadow-glow">✝️</span>,
  'Politics': <span role="img" aria-label="Politics" className="text-green-400 drop-shadow-glow">🏛️</span>,
  'Other': <span role="img" aria-label="Other" className="text-gray-300 drop-shadow-glow">❓</span>,
};

export function CategoryIcon({ name, className = '' }: { name?: string; className?: string }) {
  if (!name) return null;
  return (
    <span
      className={`inline-block align-middle mr-1 transition-all duration-200 hover:scale-125 focus:scale-125 focus:outline-none ${className}`}
      style={{ fontSize: '1.35em', filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.4))' }}
      tabIndex={0}
      aria-label={name + ' category'}
    >
      {CATEGORY_ICONS[name] || CATEGORY_ICONS['Other']}
    </span>
  );
}
