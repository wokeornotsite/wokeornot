interface UserStatsCardProps {
  totalReviews: number;
  totalComments: number;
  avgRating: number;
  totalLikes: number;
}

export default function UserStatsCard({
  totalReviews,
  totalComments,
  avgRating,
  totalLikes,
}: UserStatsCardProps) {
  const stats = [
    {
      label: 'Reviews',
      value: totalReviews,
      color: 'text-purple-300',
      bg: 'bg-purple-900/30 border-purple-700/40',
    },
    {
      label: 'Comments',
      value: totalComments,
      color: 'text-indigo-300',
      bg: 'bg-indigo-900/30 border-indigo-700/40',
    },
    {
      label: 'Likes Received',
      value: totalLikes,
      color: 'text-green-300',
      bg: 'bg-green-900/30 border-green-700/40',
    },
    {
      label: 'Avg Rating',
      value: totalReviews > 0 ? `${avgRating.toFixed(1)}/10` : '—',
      color: 'text-yellow-300',
      bg: 'bg-yellow-900/30 border-yellow-700/40',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className={`flex flex-col items-center justify-center rounded-xl border px-4 py-3 ${stat.bg}`}
        >
          <span className={`text-xl font-bold ${stat.color}`}>{stat.value}</span>
          <span className="text-xs text-gray-400 mt-0.5">{stat.label}</span>
        </div>
      ))}
    </div>
  );
}
