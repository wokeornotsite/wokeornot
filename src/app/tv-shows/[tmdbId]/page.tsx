import React from 'react';
import Image from 'next/image';
import { getTVShowDetails, getTVCredits, getSimilarTVShows } from '@/lib/tmdb';
import { ClientContentCard } from '@/components/ui/client-content-card';
import { fetchAndCacheGenres, getGenreNames } from '@/lib/genre-map';
import { WokenessBar } from '@/components/ui/wokeness-bar';
import ReviewSection from '@/components/review/review-section';
import { CategoryIcon } from '@/components/ui/category-icon';
import { notFound } from 'next/navigation';
// Import ContentType enum directly from Prisma client
import { prisma } from '@/lib/prisma';

export default async function TvShowDetailPage({ params }: { params: { tmdbId: string } }) {
  const resolvedParams = await params;
  const tmdbId = resolvedParams?.tmdbId;
  // Fetch TV show details from TMDB
  const tvShow = await getTVShowDetails(Number(tmdbId));
  if (!tvShow) return notFound();

  // Fetch credits (cast)
  const credits = await getTVCredits(Number(tmdbId));
  const mainCast = credits.cast?.slice(0, 3) || [];

    // Fetch and cache TV genres for mapping
  await fetchAndCacheGenres();
  // Fetch similar TV shows
  const similarShowsData = await getSimilarTVShows(Number(tmdbId));
  const similarShows = similarShowsData.results || [];


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

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a1a2e] via-[#232946] to-[#121212] text-white px-0 md:px-0">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="flex flex-col md:flex-row gap-10 items-start">
          <Image
            src={posterUrl}
            alt={tvShow.name}
            className="w-full md:w-80 rounded-xl shadow-2xl border-4 border-white/10 bg-white/5 object-cover"
            style={{ maxHeight: 480 }}
            width={320}
            height={480}
            priority
          />
          <div className="flex-1">
            <h1 className="text-4xl md:text-5xl font-extrabold mb-3 leading-tight bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
              {tvShow.name}
            </h1>
            <div className="flex items-center gap-4 text-lg text-gray-300 mb-4">
              <span>{tvShow.first_air_date}</span>
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
            {/* Main Cast */}
            <div className="flex gap-3 mb-4">
              {mainCast.map((actor: any) => (
                <div key={actor.id} className="flex flex-col items-center">
                  <Image
                    src={actor.profile_path ? `https://image.tmdb.org/t/p/w185${actor.profile_path}` : '/images/placeholder.png'}
                    alt={actor.name}
                    width={60}
                    height={60}
                    className="rounded-full border-2 border-blue-400/40 bg-[#232946] object-cover"
                  />
                  <span className="text-xs mt-1 text-blue-100 font-semibold">{actor.name}</span>
                  <span className="text-[10px] text-gray-400">{actor.character}</span>
                </div>
              ))}
            </div>
            <WokenessBar score={wokeScore} />
            {/* Woke Reasons (Gradient Bars) */}
            <div className="mt-4 mb-6">
              <h4 className="text-sm font-bold text-blue-300 mb-1 tracking-wide uppercase">Woke Reasons</h4>
              {categoryScores && categoryScores.length > 0 ? (
                <div className="w-full flex flex-col gap-2">
                  {categoryScores.filter(cs => cs.count > 0).sort((a, b) => b.percentage - a.percentage).map(cs => (
                    <div key={cs.categoryId} className="flex items-center gap-2 w-full">
                      <span className="w-32 text-xs font-semibold text-white truncate drop-shadow-sm flex items-center">
                        <CategoryIcon name={cs.category?.name} />
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
                      <span className="w-14 text-xs text-white font-medium text-right drop-shadow-sm">{cs.count} vote{cs.count !== 1 ? 's' : ''}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-gray-400 italic">No wokeness reasons yet. Be the first to rate!</div>
              )}
            </div>
            <div className="mt-6 text-lg text-gray-100 leading-relaxed bg-black/30 p-4 rounded-xl shadow-inner">
              {tvShow.overview}
            </div>
          </div>
        </div>
        {/* Similar Shows */}
        {similarShows.length > 0 && (
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
        )}
        <div className="mt-12 flex justify-center">
          <div className="bg-[#232946] rounded-2xl p-6 shadow-lg border border-white/10 w-full max-w-xl mx-auto">
            <ReviewSection id={dbContent.id} />
          </div>
        </div>
      </div>
    </div>
  );
}

