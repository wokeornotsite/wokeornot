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
import type { Metadata } from 'next';
import { getTVShowDetails, getTVCredits, getSimilarTVShows, getTVWatchProviders } from '@/lib/tmdb';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { WatchProviders } from '@/components/ui/watch-providers';
import { ClientContentCard } from '@/components/ui/client-content-card';
import { fetchAndCacheGenres, getGenreNames } from '@/lib/genre-map';
import { WokenessBar } from '@/components/ui/wokeness-bar';
import { SocialShareButtons } from '@/components/ui/social-share-buttons';
import ReviewTabsWrapper from '@/components/review/review-tabs-wrapper';
import ReviewSection from '@/components/review/review-section';
import { CategoryIcon } from '@/components/ui/category-icon';
import { notFound } from 'next/navigation';
// Import ContentType enum directly from Prisma client
import { prisma } from '@/lib/prisma';
import { getTVShowContent } from '@/lib/content-fetch';
import { getWokenessLabel, getWokenessBadgeBg } from '@/lib/wokeness-utils';

export const revalidate = 3600; // Cache TV detail pages for 1 hour

export async function generateMetadata({ params }: { params: Promise<{ tmdbId: string }> }): Promise<Metadata> {
  const { tmdbId } = await params;
  let tvShow;
  try {
    tvShow = await getTVShowDetails(Number(tmdbId));
  } catch {
    return {};
  }
  if (!tvShow) return {};
  const dbContent = await getTVShowContent(Number(tmdbId));
  const wokeScore = dbContent?.wokeScore;
  const reviewCount = dbContent?.reviewCount ?? 0;
  const score = wokeScore ? Number(wokeScore) : null;
  const label = score !== null ? getWokenessLabel(score) : null;
  const pageTitle = score !== null
    ? `Is ${tvShow.name} Woke? — ${label} (${score.toFixed(1)}/10) | WokeOrNot`
    : `Is ${tvShow.name} Woke? Community Ratings & Reviews | WokeOrNot`;
  const descBase = score !== null
    ? `${tvShow.name} has a wokeness score of ${score.toFixed(1)}/10 (${label})${reviewCount > 0 ? ` from ${reviewCount} community reviews` : ''}. `
    : `Find out if ${tvShow.name} is woke. Read community wokeness ratings and reviews. `;
  const description = (descBase + (tvShow.overview || '')).trim().slice(0, 160);
  const fallbackImageUrl = tvShow.backdrop_path
    ? `https://image.tmdb.org/t/p/w1280${tvShow.backdrop_path}`
    : tvShow.poster_path
    ? `https://image.tmdb.org/t/p/w500${tvShow.poster_path}`
    : null;
  const ogImageUrl =
    `https://wokeornot.net/api/og?title=${encodeURIComponent(tvShow.name)}&type=tv` +
    (score !== null ? `&score=${score.toFixed(1)}` : '');
  const ogImages = [
    { url: ogImageUrl, width: 1200, height: 630, alt: `${tvShow.name} woke score` },
    ...(fallbackImageUrl ? [{ url: fallbackImageUrl }] : []),
  ];
  return {
    title: pageTitle,
    description,
    alternates: { canonical: `https://wokeornot.net/tv-shows/${tmdbId}` },
    openGraph: {
      title: pageTitle,
      description,
      type: 'video.tv_show',
      images: ogImages,
    },
    twitter: { card: 'summary_large_image', images: [ogImageUrl] },
  };
}

export default async function TvShowDetailPage({ params }: { params: { tmdbId: string } }) {
  // Next.js 15: params may be a promise, so await if needed
  const resolvedParams = await params;
  const tmdbId = resolvedParams?.tmdbId;
  if (!tmdbId) return notFound();
  // Fetch TV show details from TMDB
  let tvShow;
  try {
    tvShow = await getTVShowDetails(Number(tmdbId));
  } catch {
    return notFound();
  }
  if (!tvShow) return notFound();

  // --- Automatic content creation ---
  // Reuses the React cache() entry populated by generateMetadata above.
  let dbContent = await getTVShowContent(Number(tmdbId));
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

  // Fetch credits and watch providers in parallel (non-critical)
  let cast: { id: number; name: string; character: string; profile_path: string | null }[] = [];
  let watchProviders: { flatrate?: any[]; rent?: any[]; buy?: any[] } = {};
  try {
    const [creditsData, providersData] = await Promise.all([
      getTVCredits(Number(tmdbId)),
      getTVWatchProviders(Number(tmdbId)),
    ]);
    cast = (creditsData?.cast || []).slice(0, 10).map((c: any) => ({
      id: c.id,
      name: c.name,
      character: c.character,
      profile_path: c.profile_path ?? null,
    }));
    watchProviders = providersData || {};
  } catch { /* non-critical */ }

  // Fetch similar TV shows
  let similarShows: any[] = [];
  try {
    const similarShowsData = await getSimilarTVShows(Number(tmdbId));
    similarShows = similarShowsData.results || [];
  } catch { /* non-critical */ }

  // Batch-fetch real woke scores for similar shows from DB
  const similarTmdbIds = similarShows.slice(0, 8).map((s: any) => s.id).filter(Boolean);
  const similarDbData = similarTmdbIds.length > 0
    ? await prisma.content.findMany({
        where: { tmdbId: { in: similarTmdbIds }, contentType: 'TV_SHOW' },
        select: { tmdbId: true, wokeScore: true, reviewCount: true },
      })
    : [];
  const similarDbMap = Object.fromEntries(similarDbData.map(c => [c.tmdbId, c]));

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'TVSeries',
    name: tvShow.name,
    description: tvShow.overview || undefined,
    image: tvShow.poster_path ? `https://image.tmdb.org/t/p/w500${tvShow.poster_path}` : undefined,
    ...(tvShow.first_air_date ? { datePublished: tvShow.first_air_date } : {}),
    ...(reviewCount > 0 ? {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: Number(wokeScore).toFixed(1),
        bestRating: '10',
        worstRating: '1',
        ratingCount: String(reviewCount),
      },
    } : {}),
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'TV Shows', item: 'https://wokeornot.net/tv-shows' },
        { '@type': 'ListItem', position: 2, name: tvShow.name },
      ],
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
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
            sizes="100vw"
            quality={75}
            unoptimized
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
            sizes="(max-width: 768px) 144px, 208px"
            quality={80}
            unoptimized
          />
          <div className="flex flex-col gap-2 md:gap-4">
            <div className="flex items-center gap-4">
              <h1 className="text-3xl md:text-5xl font-extrabold bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 bg-clip-text text-transparent drop-shadow-lg">
                {tvShow.name}
              </h1>
              {reviewCount > 0 ? (
                <span className="text-xs px-3 py-1 rounded-full font-bold shadow-lg border border-white/10 ml-2 text-white"
                  style={{ background: getWokenessBadgeBg(wokeScore) }}>
                  {getWokenessLabel(wokeScore)}
                </span>
              ) : (
                <span className="text-xs px-3 py-1 rounded-full font-bold shadow-lg border border-white/10 ml-2 text-white bg-gray-600">
                  Not Rated
                </span>
              )}
            </div>
            {/* Social Share Buttons */}
            <SocialShareButtons url={`https://www.wokeornot.net/tv-shows/${tmdbId}`} title={tvShow.name} />
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
        <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'TV Shows', href: '/tv-shows' }, { label: tvShow.name }]} />
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
                    .map((cs, i) => (
                      <div key={cs.categoryId} className="flex items-center gap-2 w-full">
                        <span className="w-32 text-xs font-semibold text-white truncate drop-shadow-sm flex items-center">
                          {categoryIcons[cs.category?.name || ''] || <FaQuestionCircle className="text-gray-400" />}
                          {cs.category?.name || ''}
                        </span>
                        <div className="flex-1 bg-blue-100 rounded-full h-6 relative overflow-hidden">
                          <div
                            className="h-6 rounded-full bg-gradient-to-r from-blue-400 via-blue-600 to-blue-800 animate-fadeIn"
                            style={{
                              width: `${Math.round(cs.percentage)}%`,
                              transition: 'width 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
                              animationDuration: '0.6s',
                              animationDelay: `${0.1 * i}s`
                            }}
                          />
                          <span className="absolute left-3 top-0 text-xs text-white font-bold h-6 flex items-center drop-shadow-sm">{Math.round(cs.percentage)}%</span>
                        </div>
                        <span className="w-14 text-xs text-gray-300 font-medium text-right">{cs.count} vote{cs.count !== 1 ? 's' : ''}</span>
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
            {/* Cast - compact sidebar list */}
            {cast.length > 0 && (
              <div className="mt-4 pt-4 border-t border-white/10">
                <h4 className="text-xs font-bold text-blue-300 mb-2 tracking-wide uppercase">Top Cast</h4>
                <div className="flex flex-col gap-2">
                  {cast.slice(0, 6).map((c) => (
                    <div key={c.id} className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-[#1a1a2e] border border-white/10 overflow-hidden flex-shrink-0">
                        {c.profile_path ? (
                          <Image
                            src={`https://image.tmdb.org/t/p/w92${c.profile_path}`}
                            alt={c.name}
                            width={28}
                            height={28}
                            className="w-full h-full object-cover"
                            unoptimized
                          />
                        ) : (
                          <span className="w-full h-full flex items-center justify-center text-[10px] font-bold text-gray-400">{c.name[0]}</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-medium text-white truncate">{c.name}</div>
                        <div className="text-[10px] text-gray-400 truncate">{c.character}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* Where to Watch - compact sidebar */}
            {(watchProviders.flatrate?.length || watchProviders.rent?.length || watchProviders.buy?.length) ? (
              <div className="mt-4 pt-4 border-t border-white/10">
                <WatchProviders providers={watchProviders} />
              </div>
            ) : null}
          </div>
          {/* Main Content */}
          <div className="flex-1 w-full">
            {/* Overview */}
            <div className="mt-2 text-lg text-gray-100 leading-relaxed bg-black/30 p-4 rounded-xl shadow-inner">
              {tvShow.overview}
            </div>
            {/* Review Tabs: Submit Review / User Reviews */}
            <div className="mt-6">
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
                wokeScore: similarDbMap[show.id]?.wokeScore ?? 0,
                reviewCount: similarDbMap[show.id]?.reviewCount ?? 0,
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
    </>
  );
}
