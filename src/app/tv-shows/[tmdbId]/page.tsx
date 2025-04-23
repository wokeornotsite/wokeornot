import React from 'react';
import { FaRainbow, FaGenderless, FaLeaf, FaQuestionCircle } from 'react-icons/fa';
import { MdWc } from 'react-icons/md';

const categoryIcons: Record<string, React.ReactNode> = {
  'LGBT Representation': <FaRainbow className="text-pink-400" />,
  'Transgender Themes': <MdWc className="text-blue-400" />,
  'Gender Nonconformity': <MdWc className="text-violet-400" />,
  'Queer Representation': <FaGenderless className="text-purple-400" />,
  'Environmental Agenda': <FaLeaf className="text-green-400" />,
};
import Image from 'next/image';
import { getTVShowDetails, getTVCredits, getSimilarTVShows } from '@/lib/tmdb';
import { ClientContentCard } from '@/components/ui/client-content-card';
import { fetchAndCacheGenres, getGenreNames } from '@/lib/genre-map';
import { WokenessBar } from '@/components/ui/wokeness-bar';
import ReviewTabsWrapper from '@/components/review/review-tabs-wrapper';
import ReviewSection from '@/components/review/review-section';
import { CategoryIcon } from '@/components/ui/category-icon';
import { notFound } from 'next/navigation';
// Import ContentType enum directly from Prisma client
import { prisma } from '@/lib/prisma';

export default async function TvShowDetailPage({ params }: { params: { tmdbId: string } }) {
  // Next.js 15: params may be a promise, so await if needed
  const resolvedParams = await params;
  const tmdbId = resolvedParams?.tmdbId;
  if (!tmdbId) return notFound();
  // Fetch TV show details from TMDB
  const tvShow = await getTVShowDetails(Number(tmdbId));
  if (!tvShow) return notFound();

  // --- Automatic content creation ---
  let dbContent = await prisma.content.findFirst({ where: { tmdbId: Number(tmdbId), contentType: "TV_SHOW" } });
  if (!dbContent) {
    dbContent = await prisma.content.create({
      data: {
        tmdbId: Number(tmdbId),
        contentType: "TV_SHOW",
        title: tvShow.name,
        overview: tvShow.overview,
        posterPath: tvShow.poster_path || '',
        backdropPath: tvShow.backdrop_path || '',
        releaseDate: tvShow.first_air_date ? new Date(tvShow.first_air_date).toISOString() : null,
      },
    });
  }
  // --- End automatic content creation ---

  // Fetch categoryScores for this content (with category name)
  const categoryScores = dbContent
    ? await prisma.categoryScore.findMany({
        where: { contentId: dbContent.id },
        include: { category: true },
      })
    : [];

  const wokeScore = dbContent?.wokeScore ?? 0;
  const reviewCount = dbContent?.reviewCount ?? 0;

  // Fallback for poster
  const posterUrl = tvShow.poster_path
    ? `https://image.tmdb.org/t/p/w500${tvShow.poster_path}`
    : '/images/placeholder.png';

  // Fetch credits (cast)
  const credits = await getTVCredits(Number(tmdbId));
  const mainCast = credits.cast?.slice(0, 3) || [];

  // Fetch similar TV shows
  const similarShowsData = await getSimilarTVShows(Number(tmdbId));
  const similarShows = similarShowsData.results || [];

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-[#1a1a2e] via-[#232946] to-[#121212] text-white">
      {/* Hero Section with Backdrop */}
      <div className="relative h-64 md:h-96 w-full overflow-hidden flex items-end justify-center">
        {tvShow.backdrop_path && (
          <Image
            src={`https://image.tmdb.org/t/p/original${tvShow.backdrop_path}`}
            alt={tvShow.name}
            fill
            className="object-cover w-full h-full absolute top-0 left-0 z-0 blur-sm scale-105 opacity-70"
            priority
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#181824] via-[#232946cc] to-transparent z-10" />
        <div className="relative z-20 flex flex-col md:flex-row items-end md:items-center gap-6 px-4 pb-6 md:pb-0 md:pt-16">
          <Image
            src={posterUrl}
            alt={tvShow.name}
            className="w-36 h-52 md:w-52 md:h-80 rounded-xl shadow-2xl border-4 border-white/10 bg-white/5 object-cover"
            width={208}
            height={320}
            priority
          />
          <div className="flex flex-col gap-2 md:gap-4">
            <div className="flex items-center gap-4">
              <h1 className="text-3xl md:text-5xl font-extrabold bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 bg-clip-text text-transparent drop-shadow-lg">
                {tvShow.name}
              </h1>
              <span className="bg-gradient-to-r from-green-400 via-yellow-400 to-red-500 text-xs px-3 py-1 rounded-full font-bold shadow-lg border border-white/10 ml-2">
                WOKE
              </span>
            </div>
            <div className="flex items-center gap-4 text-base md:text-lg text-gray-200">
              <span>{tvShow.first_air_date?.slice(0,4)}</span>
              <span>&bull;</span>
              <span>{tvShow.episode_run_time?.[0] || ''} min/ep</span>
              <span>&bull;</span>
              <span className="flex gap-1 flex-wrap">
                {tvShow.genres.map((g: { id: number; name: string }) => (
                  <span key={g.id} className="bg-blue-900/40 px-2 py-1 rounded text-xs font-semibold text-blue-200 border border-blue-400/30">
                    {g.name}
                  </span>
                ))}
              </span>
            </div>
            {/* No main cast in hero for Movie layout parity */}
          </div>
        </div>
      </div>
      {/* Info Panel & Main Content */}
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="flex flex-col md:flex-row gap-10 items-start">
          {/* Info Card (match Movie layout) */}
          <div className="w-full md:w-80 bg-[#232946] rounded-2xl shadow-lg border border-white/10 p-6 flex flex-col gap-4">
            <WokenessBar score={wokeScore} />
            <div>
              <h4 className="text-xs font-bold text-blue-300 mb-1 tracking-wide uppercase">Woke Reasons</h4>
              {categoryScores && categoryScores.length > 0 ? (
                <div className="w-full flex flex-col gap-2">
                  {categoryScores
                    .filter(cs => cs.count > 0)
                    .sort((a, b) => b.percentage !== a.percentage ? b.percentage - a.percentage : (a.category?.name || '').localeCompare(b.category?.name || ''))
                    .map(cs => (
                      <div key={cs.categoryId} className="flex items-center gap-2 w-full">
                        <span className="w-32 text-xs font-semibold text-white truncate drop-shadow-sm flex items-center">
                          {categoryIcons[cs.category?.name || ''] || <FaQuestionCircle className="text-gray-400" />}
                          {cs.category?.name || ''}
                        </span>
                        <div className="flex-1 bg-blue-100 rounded-full h-6 relative overflow-hidden">
                          <div
                            className="h-6 rounded-full bg-gradient-to-r from-blue-400 via-blue-600 to-blue-800 animate-fadeIn"
                            style={{ 
                              width: `${cs.percentage}%`, 
                              transition: 'width 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)', 
                              animationDuration: '0.6s',
                              animationDelay: `${0.1 * (categoryScores.findIndex(c => c.categoryId === cs.categoryId))}s`
                            }}
                          />
                          <span className="absolute left-3 top-0 text-xs text-white font-bold h-6 flex items-center drop-shadow-sm">{cs.percentage}%</span>
                        </div>
                        <span className="w-14 text-xs text-blue-700 font-medium text-right">{cs.count} vote{cs.count !== 1 ? 's' : ''}</span>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-xs text-gray-400 italic">No wokeness reasons yet. Be the first to rate!</div>
              )}
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {tvShow.genres.map((g: { id: number; name: string }) => (
                <span key={g.id} className="bg-blue-900/40 px-2 py-1 rounded text-xs font-semibold text-blue-200 border border-blue-400/30">
                  {g.name}
                </span>
              ))}
            </div>
            <div className="mt-2 text-xs text-gray-400">{reviewCount} Reviews</div>
          </div>
          {/* Main Content */}
          <div className="flex-1 w-full">
            {/* Overview */}
            <div className="mt-2 text-lg text-gray-100 leading-relaxed bg-black/30 p-4 rounded-xl shadow-inner">
              {tvShow.overview}
            </div>
            {/* Review Tabs: Submit Review / User Reviews */}
            <div className="mt-8">
              {/* Use ReviewTabsWrapper for parity with Movie page */}
              <ReviewTabsWrapper id={dbContent.id} />
            </div>
          </div>
        </div>
        {/* Similar Shows Carousel */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-4 text-blue-200">Similar Shows</h2>
          <div className="flex gap-6 overflow-x-auto pb-2">
            {similarShows.slice(0, 8).map((show: any) => {
              const genreNames = getGenreNames(show.genre_ids || [], 'tv');
              const genres = (show.genre_ids || []).map((gid: number, idx: number) => ({ id: gid, name: genreNames[idx] || '' }));
              const contentItem = {
                id: show.id?.toString() || '',
                tmdbId: show.id,
                title: show.name || 'Untitled',
                overview: show.overview || '',
                posterPath: show.poster_path,
                backdropPath: show.backdrop_path,
                releaseDate: show.first_air_date ? new Date(show.first_air_date) : undefined,
                contentType: 'TV_SHOW',
                wokeScore: Math.random() * 10, // Placeholder
                reviewCount: Math.floor(Math.random() * 100), // Placeholder
                genres,
              };
              return (
                <div key={show.id} className="min-w-[200px] max-w-[220px]">
                  <ClientContentCard content={contentItem} />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
