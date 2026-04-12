// Trigger Vercel redeploy: trivial comment change
import React from "react";
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
import { getMovieDetails, getMovieCredits, getSimilarMovies, getMovieGenres } from '@/lib/tmdb';
import { ClientContentCard } from '@/components/ui/client-content-card';
import { ErrorMessage } from '@/components/ui/error-message';
import { fetchAndCacheGenres, getGenreNames } from '@/lib/genre-map';
import { WokenessBar } from '@/components/ui/wokeness-bar';
import { SocialShareButtons } from '@/components/ui/social-share-buttons';
import ReviewSection from '@/components/review/review-section';
import ReviewTabsWrapper from '@/components/review/review-tabs-wrapper';
import CommentSection from '@/components/comment/comment-section';
import { CategoryIcon } from '@/components/ui/category-icon';
import { notFound } from 'next/navigation';

import { prisma } from '@/lib/prisma';
import { getWokenessLabel, getWokenessBadgeBg } from '@/lib/wokeness-utils';

export const revalidate = 3600; // Cache kids detail pages for 1 hour

export async function generateMetadata({ params }: { params: Promise<{ tmdbId: string }> }): Promise<Metadata> {
  const { tmdbId } = await params;
  let movie;
  try {
    movie = await getMovieDetails(Number(tmdbId));
  } catch {
    return {};
  }
  if (!movie) return {};
  const dbContent = await prisma.content.findFirst({ where: { tmdbId: Number(tmdbId), contentType: 'KIDS' } });
  const wokeScore = dbContent?.wokeScore;
  const reviewCount = dbContent?.reviewCount ?? 0;
  const score = wokeScore ? Number(wokeScore) : null;
  const label = score !== null ? getWokenessLabel(score) : null;
  const pageTitle = score !== null
    ? `Is ${movie.title} Safe for Kids? Wokeness: ${label} (${score.toFixed(1)}/10) | WokeOrNot`
    : `Is ${movie.title} Safe for Kids? | WokeOrNot`;
  const descBase = score !== null
    ? `${movie.title} has a kids content wokeness score of ${score.toFixed(1)}/10 (${label})${reviewCount > 0 ? ` from ${reviewCount} community reviews` : ''}. `
    : `Find out if ${movie.title} is appropriate for kids. Community wokeness ratings for children's content. `;
  const description = (descBase + (movie.overview || '')).trim().slice(0, 160);
  const imageUrl = movie.backdrop_path
    ? `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}`
    : movie.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : null;
  return {
    title: pageTitle,
    description,
    alternates: { canonical: `https://wokeornot.net/kids/${tmdbId}` },
    openGraph: {
      title: pageTitle,
      description,
      type: 'video.movie',
      ...(imageUrl ? { images: [{ url: imageUrl }] } : {}),
    },
    twitter: { card: 'summary_large_image' },
  };
}

export default async function KidsContentDetailPage({ params }: { params: { tmdbId: string } }) {
  const resolvedParams = await params;
  const tmdbId = resolvedParams?.tmdbId;
  if (!tmdbId) return notFound();
  // Fetch movie details from TMDB (kids content is just a filtered set of movies)
  let movie;
  try {
    movie = await getMovieDetails(Number(tmdbId));
  } catch {
    return notFound();
  }
  if (!movie) return notFound();

  // --- Automatic content creation ---
  let dbContent = await prisma.content.upsert({
    where: {
      tmdbId_contentType: {
        tmdbId: Number(tmdbId),
        contentType: "KIDS"
      } as any // workaround for Prisma MongoDB compound unique with upsert
    },
    update: {},
    create: {
      tmdbId: Number(tmdbId),
      contentType: "KIDS",
      title: movie.title,
      overview: movie.overview,
      posterPath: movie.poster_path || '',
      backdropPath: movie.backdrop_path || '',
      releaseDate: movie.release_date ? new Date(movie.release_date).toISOString() : null,
    }
  });
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
  const posterUrl = movie.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : '/images/placeholder.png';

  // Fetch credits and main cast
  let mainCast: any[] = [];
  try {
    const credits = await getMovieCredits(Number(tmdbId));
    mainCast = Array.isArray(credits?.cast) ? credits.cast.slice(0, 6) : [];
  } catch {
    mainCast = [];
  }

  // Fetch similar movies for 'Similar Content' section
  let similarShows: any[] = [];
  let similarError = '';
  try {
    const similar = await getSimilarMovies(Number(tmdbId));
    similarShows = similar?.results?.slice(0, 12) || [];
  } catch (err: any) {
    similarError = err?.message || 'Failed to load similar content.';
  }

  // Pre-populate genre cache for similar movies
  await fetchAndCacheGenres();

  // Batch-fetch real woke scores for similar movies from DB
  const similarTmdbIds = similarShows.map((s: any) => s.id).filter(Boolean);
  const similarDbData = similarTmdbIds.length > 0
    ? await prisma.content.findMany({
        where: { tmdbId: { in: similarTmdbIds }, contentType: 'KIDS' },
        select: { tmdbId: true, wokeScore: true, reviewCount: true },
      })
    : [];
  const similarDbMap = Object.fromEntries(similarDbData.map(c => [c.tmdbId, c]));

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Movie',
    name: movie.title,
    description: movie.overview || undefined,
    image: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : undefined,
    ...(movie.release_date ? { datePublished: movie.release_date } : {}),
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
        { '@type': 'ListItem', position: 1, name: "Kids' Content", item: 'https://wokeornot.net/kids' },
        { '@type': 'ListItem', position: 2, name: movie.title },
      ],
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="relative min-h-screen bg-gradient-to-b from-[#1a1a2e] via-[#232946] to-[#121212] text-white">
        {/* Hero Section with Backdrop */}
      <div className="relative h-64 md:h-96 w-full overflow-hidden flex items-end justify-center">
        {movie.backdrop_path && (
          <Image
            src={`https://image.tmdb.org/t/p/original${movie.backdrop_path}`}
            alt={movie.title}
            fill
            className="object-cover w-full h-full absolute top-0 left-0 z-0 blur-sm scale-105 opacity-70"
            priority
            unoptimized
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#181824] via-[#232946cc] to-transparent z-10" />
        <div className="relative z-20 flex flex-col md:flex-row items-end md:items-center gap-6 px-4 pb-6 md:pb-0 md:pt-16">
          <Image
            src={posterUrl}
            alt={movie.title}
            className="w-36 h-52 md:w-52 md:h-80 rounded-xl shadow-2xl border-4 border-white/10 bg-white/5 object-cover"
            width={208}
            height={320}
            priority
            unoptimized
          />
          <div className="flex flex-col gap-2 md:gap-4">
            <div className="flex items-center gap-4">
              <h1 className="text-3xl md:text-5xl font-extrabold bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 bg-clip-text text-transparent drop-shadow-lg">
                {movie.title}
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
            <SocialShareButtons url={`https://www.wokeornot.net/kids/${tmdbId}`} title={movie.title} />
            <div className="flex items-center gap-4 text-base md:text-lg text-gray-200">
              <span>{movie.release_date?.slice(0,4)}</span>
              <span>&bull;</span>
              <span>{movie.runtime} min</span>
              <span>&bull;</span>
              <span>{movie.original_language?.toUpperCase()}</span>
            </div>
            <div className="flex flex-wrap gap-2 items-center mt-2">
              {categoryScores.filter(score => score.count > 0).map((score: any) => (
                <span key={score.categoryId} className="flex items-center gap-1 px-2 py-1 rounded-full bg-white/10 border border-white/10 text-xs font-semibold text-blue-200">
                  {categoryIcons[score.category?.name] || <FaQuestionCircle className="text-gray-400" />} {score.category?.name}: {Math.round(score.percentage)}%
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
      {/* Info Panel & Main Content */}
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="flex flex-col md:flex-row gap-10 items-start">
          {/* Info Card */}
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
              {movie.genres?.map((g: { id: number; name: string }) => (
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
              {movie.overview}
            </div>
            {/* Review Section */}
            <div className="mt-8">
              <ReviewTabsWrapper id={dbContent.id} />
            </div>

          </div>
        </div>
        {/* Similar Movies Carousel */}
        {similarShows.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-4 text-blue-200">Similar Movies</h2>
            <div className="flex gap-6 overflow-x-auto pb-2">
              {similarShows.map((show: any) => {
                const genreNames = getGenreNames(show.genre_ids || [], 'movie');
                const genres = (show.genre_ids || []).map((gid: number, idx: number) => ({ id: gid, name: genreNames[idx] || '' }));
                const contentItem = {
                  id: show.id?.toString() || '',
                  tmdbId: show.id,
                  title: show.title || 'Untitled',
                  overview: show.overview || '',
                  posterPath: show.poster_path,
                  backdropPath: show.backdrop_path,
                  releaseDate: show.release_date ? new Date(show.release_date) : undefined,
                  contentType: 'KIDS',
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
        )}
      </div>
    </div>
    </>
  );
}
