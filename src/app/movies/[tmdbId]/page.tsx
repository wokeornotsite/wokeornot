// Trigger Vercel redeploy
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
import { getMovieDetails } from '@/lib/tmdb';
import { WokenessBar } from '@/components/ui/wokeness-bar';
import { SocialShareButtons } from '@/components/ui/social-share-buttons';
import { notFound } from 'next/navigation';
import { CategoryIcon } from '@/components/ui/category-icon';

import { prisma } from '@/lib/prisma';
import ReviewTabsWrapper from '@/components/review/review-tabs-wrapper';

export default async function MovieDetailPage({ params }: { params: { tmdbId: string } }) {
  // Next.js 15: params may be a promise, so await if needed
  const resolvedParams = await params;
  const tmdbId = resolvedParams?.tmdbId;
  if (!tmdbId) return notFound();
  // Fetch movie details from TMDB
  const movie = await getMovieDetails(Number(tmdbId));
  if (!movie) return notFound();

  // --- Automatic content creation ---
  // Try to find content in DB by tmdbId and type
  let dbContent = await prisma.content.findFirst({ where: { tmdbId: Number(tmdbId), contentType: "MOVIE" } });
  if (!dbContent) {
    dbContent = await prisma.content.create({
      data: {
        tmdbId: Number(tmdbId),
        contentType: "MOVIE",
        title: movie.title,
        overview: movie.overview,
        posterPath: movie.poster_path || '',
        backdropPath: movie.backdrop_path || '',
        releaseDate: movie.release_date ? new Date(movie.release_date).toISOString() : null,
      },
    });
  }
  // --- End automatic content creation ---

  // Fetch weighted woke reasons summary and reviews
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
  const reviewsApiRes = await fetch(`${baseUrl}/api/reviews/${dbContent.id}`, { 
    cache: 'no-store',
    headers: {
      'Accept': 'application/json'
    }
  });

  let apiJson;
  try {
    apiJson = await reviewsApiRes.json();
    if (typeof window !== 'undefined') {
      console.log('[Debug] API Response Status:', reviewsApiRes.status);
      console.log('[Debug] API Response Headers:', Object.fromEntries(reviewsApiRes.headers.entries()));
      console.log('[Debug] API /api/reviews/[id] raw response:', apiJson);
    }
  } catch (error) {
    console.error('[Error] Failed to parse API response:', error);
    apiJson = {};
  }

  // Ensure wokeReasons is always an array
  const rawWokeReasons = apiJson?.wokeReasons;
  const wokeReasons = Array.isArray(rawWokeReasons) ? rawWokeReasons : [];
  const reviews = Array.isArray(apiJson?.reviews) ? apiJson.reviews : [];
  const totalReviews = typeof apiJson?.totalReviews === 'number' ? apiJson.totalReviews : 0;

  if (typeof window !== 'undefined') {
    console.log('[Debug] Processed data:', {
      wokeReasonsLength: wokeReasons?.length,
      reviewsLength: reviews?.length,
      totalReviews,
      isWokeReasonsArray: Array.isArray(wokeReasons),
      baseUrl
    });
  }

  const wokeScore = dbContent?.wokeScore ?? 0;
  const reviewCount = totalReviews; // Use real-time count from API

  // Fallback for poster
  const posterUrl = movie.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : '/images/placeholder.png';

  return (
    <>
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
            sizes="100vw"
            quality={75}
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
            sizes="(max-width: 768px) 144px, 208px"
            quality={80}
            unoptimized={!movie.poster_path}
          />
          <div className="flex flex-col gap-2 md:gap-4">
            <div className="flex items-center gap-4">
              <h1 className="text-3xl md:text-5xl font-extrabold bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 bg-clip-text text-transparent drop-shadow-lg">
                {movie.title}
              </h1>
              <span className="bg-gradient-to-r from-green-400 via-yellow-400 to-red-500 text-xs px-3 py-1 rounded-full font-bold shadow-lg border border-white/10 ml-2">
                WOKE
              </span>
            </div>
            <SocialShareButtons url={`https://www.wokeornot.net/movies/${tmdbId}`} title={movie.title} />
            <div className="flex items-center gap-4 text-base md:text-lg text-gray-200">
              <span>{movie.release_date?.slice(0,4)}</span>
              <span>&bull;</span>
              <span>{movie.runtime} min</span>
              <span>&bull;</span>
              <span className="flex gap-1 flex-wrap">
                {movie.genres.map((g: { id: number; name: string }) => (
                  <span key={g.id} className="bg-blue-900/40 px-2 py-1 rounded text-xs font-semibold text-blue-200 border border-blue-400/30">
                    {g.name}
                  </span>
                ))}
              </span>
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
              {wokeReasons.length > 0 ? (
                <div className="w-full flex flex-col gap-2">
                  {wokeReasons
                    .filter((cs: any) => cs.count > 0)
                    .sort((a: any, b: any) => b.percent !== a.percent ? b.percent - a.percent : (a.name || '').localeCompare(b.name || ''))
                    .map((cs: any) => (
                      <div key={cs.categoryId} className="flex items-center gap-2 w-full">
                        <span className="w-32 text-xs font-semibold text-white truncate drop-shadow-sm flex items-center">
                          {categoryIcons[cs.name || ''] || <FaQuestionCircle className="text-gray-400" />}
                          {cs.name || ''}
                        </span>
                        <div className="flex-1 bg-blue-100 rounded-full h-6 relative overflow-hidden">
                          <div
                            className="h-6 rounded-full bg-gradient-to-r from-blue-400 via-blue-600 to-blue-800 animate-fadeIn"
                            style={{ 
                              width: `${cs.percent}%`, 
                              transition: 'width 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)', 
                              animationDuration: '0.6s',
                              animationDelay: `${0.1 * (wokeReasons.findIndex((c: any) => c.categoryId === cs.categoryId))}s`
                            }}
                          />
                          <span className="absolute left-3 top-0 text-xs text-white font-bold h-6 flex items-center drop-shadow-sm">{cs.percent}%</span>
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
              {movie.genres.map((g: { id: number; name: string }) => (
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
            {/* Review Tabs: Submit Review / User Reviews */}
            <div className="mt-8">
              <ReviewTabsWrapper id={dbContent.id} />
            </div>
            {/* Placeholder for future: Similar movies carousel/grid */}
          </div>
        </div>
      </div>
    </div>
    </>
  );
}

