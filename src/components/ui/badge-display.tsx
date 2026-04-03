'use client';

interface BadgeItem {
  icon: string;
  name: string;
  description: string;
}

interface BadgeDisplayProps {
  badges: BadgeItem[];
  size?: 'sm' | 'md';
}

export function BadgeDisplay({ badges, size = 'md' }: BadgeDisplayProps) {
  if (!badges || badges.length === 0) return null;
  if (size === 'sm') {
    return (
      <div className="flex flex-wrap gap-1">
        {badges.map((b) => (
          <span key={b.name} title={`${b.name}: ${b.description}`} className="text-lg cursor-help">{b.icon}</span>
        ))}
      </div>
    );
  }
  return (
    <div className="flex flex-wrap gap-2">
      {badges.map((b) => (
        <div key={b.name} title={b.description} className="flex items-center gap-1.5 bg-purple-900/30 border border-purple-500/20 rounded-full px-3 py-1">
          <span className="text-sm">{b.icon}</span>
          <span className="text-xs font-medium text-purple-200">{b.name}</span>
        </div>
      ))}
    </div>
  );
}
