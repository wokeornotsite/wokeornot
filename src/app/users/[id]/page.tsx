import { prisma } from '@/lib/prisma';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import UserStatsCard from '@/components/ui/user-stats-card';
import { BadgeDisplay } from '@/components/ui/badge-display';

interface PageProps {
  params: { id: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const user = await prisma.user.findUnique({
    where: { id: params.id },
    select: { name: true },
  });
  const displayName = user?.name || 'User';
  return {
    title: `${displayName}'s Profile | WokeOrNot`,
  };
}

export default async function UserProfilePage({ params }: PageProps) {
  const user = await prisma.user.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      name: true,
      avatar: true,
      image: true,
      bio: true,
      createdAt: true,
      reviews: {
        where: { isHidden: false },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          content: {
            select: {
              title: true,
              tmdbId: true,
              contentType: true,
            },
          },
          reactions: {
            select: { type: true },
          },
        },
      },
      _count: {
        select: {
          comments: true,
          reviews: true,
        },
      },
    },
  });

  if (!user) return notFound();

  const userBadges = await prisma.userBadge.findMany({
    where: { userId: user.id },
    include: { badge: true },
    orderBy: { earnedAt: 'asc' },
  });

  // Calculate stats
  const totalReviews = user._count.reviews;
  const totalComments = user._count.comments;

  const allRatings = user.reviews.map((r) => r.rating);
  const avgRating =
    allRatings.length > 0
      ? allRatings.reduce((sum, r) => sum + r, 0) / allRatings.length
      : 0;

  const totalLikes = user.reviews.reduce((sum, r) => {
    return sum + r.reactions.filter((rx) => rx.type === 'like').length;
  }, 0);

  const avatarSrc = user.avatar || user.image || '/avatars/default.png';
  const displayName = user.name || 'User';

  const memberSince = new Date(user.createdAt).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="min-h-screen bg-[#0f0f1a] text-white">
      {/* Profile Header */}
      <div className="bg-[#1a1a2e] border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* Avatar */}
            <div className="shrink-0">
              <Image
                src={avatarSrc}
                alt={displayName}
                width={100}
                height={100}
                className="rounded-full ring-4 ring-purple-500 object-cover"
                unoptimized
              />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 text-center sm:text-left">
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
                {displayName}
              </h1>
              <p className="text-gray-400 text-sm mt-1">Member since {memberSince}</p>

              {user.bio && (
                <p className="text-gray-300 text-sm mt-3 max-w-xl leading-relaxed">{user.bio}</p>
              )}
            </div>
          </div>

          {/* Stats Row */}
          <div className="mt-6">
            <UserStatsCard
              totalReviews={totalReviews}
              totalComments={totalComments}
              avgRating={avgRating}
              totalLikes={totalLikes}
            />
          </div>

          <div className="mt-4">
            <BadgeDisplay badges={userBadges.map((ub: any) => ub.badge)} size="md" />
          </div>
        </div>
      </div>

      {/* Recent Reviews */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h2 className="text-lg font-semibold text-white mb-4">
          Recent Reviews
          <span className="ml-2 text-sm font-normal text-gray-400">
            ({user.reviews.length > 0 ? `showing ${user.reviews.length} of ${totalReviews}` : '0'})
          </span>
        </h2>

        {user.reviews.length === 0 ? (
          <div className="text-gray-400 italic text-center py-12">
            No reviews yet.
          </div>
        ) : (
          <ul className="space-y-4">
            {user.reviews.map((review) => {
              const contentTypePathMap: Record<string, string> = {
                MOVIE: 'movies',
                TV_SHOW: 'tv-shows',
                KIDS: 'kids',
              };
              const contentHref = review.content
                ? `/${contentTypePathMap[review.content.contentType] ?? review.content.contentType.toLowerCase()}/${review.content.tmdbId}`
                : null;

              const snippet =
                review.text && review.text.length > 160
                  ? review.text.slice(0, 160) + '…'
                  : review.text;

              return (
                <li
                  key={review.id}
                  className="bg-[#1a1a2e] border border-white/10 rounded-xl p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      {contentHref && review.content ? (
                        <Link
                          href={contentHref}
                          className="text-indigo-300 hover:text-indigo-200 font-medium text-sm transition-colors"
                        >
                          {review.content.title}
                        </Link>
                      ) : (
                        <span className="text-gray-400 text-sm">Unknown content</span>
                      )}
                      {snippet && (
                        <p className="text-gray-300 text-sm mt-1 leading-relaxed">{snippet}</p>
                      )}
                      <p className="text-gray-500 text-xs mt-2">
                        {new Date(review.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                    <span className="shrink-0 bg-yellow-900/40 text-yellow-300 text-sm font-semibold rounded-full px-3 py-1">
                      {review.rating}/10
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
