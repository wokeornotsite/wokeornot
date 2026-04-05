import React from 'react';

// Map category names to icons (can expand as needed)
const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  'LGBTQ+ Themes': <span role="img" aria-label="LGBTQ+ Themes" className="text-purple-400 drop-shadow-glow">🏳️‍🌈</span>,
  'Transgender Themes': <span role="img" aria-label="Transgender Themes" className="text-blue-300 drop-shadow-glow">🏳️‍⚧️</span>,
  'Gender Identity': <span role="img" aria-label="Gender Identity" className="text-pink-400 drop-shadow-glow">♀️</span>,
  'Feminist Themes': <span role="img" aria-label="Feminist Themes" className="text-pink-300 drop-shadow-glow">✊</span>,
  'Anti-Patriarchy': <span role="img" aria-label="Anti-Patriarchy" className="text-rose-400 drop-shadow-glow">⚡</span>,
  'Race Swapping': <span role="img" aria-label="Race Swapping" className="text-orange-400 drop-shadow-glow">🔄</span>,
  'Diversity Casting': <span role="img" aria-label="Diversity Casting" className="text-yellow-400 drop-shadow-glow">🎬</span>,
  'Race & Ethnicity': <span role="img" aria-label="Race & Ethnicity" className="text-yellow-400 drop-shadow-glow">✊🏽</span>,
  'Social Justice': <span role="img" aria-label="Social Justice" className="text-teal-400 drop-shadow-glow">⚖️</span>,
  'Political Content': <span role="img" aria-label="Political Content" className="text-green-400 drop-shadow-glow">🏛️</span>,
  'Environmental Messaging': <span role="img" aria-label="Environmental Messaging" className="text-emerald-400 drop-shadow-glow">🌿</span>,
  'Religion': <span role="img" aria-label="Religion" className="text-blue-400 drop-shadow-glow">✝️</span>,
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
