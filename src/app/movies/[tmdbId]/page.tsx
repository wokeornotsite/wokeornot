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
import ReviewSection from '@/components/review/review-section';
import { notFound } from 'next/navigation';
import { CategoryIcon } from '@/components/ui/category-icon';

import { prisma } from '@/lib/prisma';

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a1a2e] via-[#232946] to-[#121212] text-white px-0 md:px-0">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="flex flex-col md:flex-row gap-10 items-start">
          <Image
            src={posterUrl}
            alt={movie.title}
            className="w-full md:w-80 rounded-xl shadow-2xl border-4 border-white/10 bg-white/5 object-cover"
            style={{ maxHeight: 480 }}
            width={320}
            height={480}
            priority
          />
          <div className="flex-1">
            <h1 className="text-4xl md:text-5xl font-extrabold mb-3 leading-tight bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
              {movie.title}
            </h1>
            <div className="flex items-center gap-4 text-lg text-gray-300 mb-4">
              <span>{movie.release_date}</span>
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
            <WokenessBar score={wokeScore} />
            {/* Woke Reasons (Gradient Bars) */}
            <div className="mt-4 mb-6">
              <h4 className="text-sm font-bold text-blue-300 mb-1 tracking-wide uppercase">Woke Reasons</h4>
              {categoryScores && categoryScores.length > 0 ? (
                <div className="w-full flex flex-col gap-2">
                  {categoryScores
  .filter(cs => cs.count > 0)
  .sort((a, b) => b.percentage !== a.percentage ? b.percentage - a.percentage : (a.category?.name || '').localeCompare(b.category?.name || ''))
  .map(cs => (
                    <div key={cs.categoryId} className="flex items-center gap-2 w-full">
                      <span className="w-40 text-xs font-semibold text-white truncate drop-shadow-sm flex items-center">
                        {/* Render category icon or default */}
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
            <div className="mt-6 text-lg text-gray-100 leading-relaxed bg-black/30 p-4 rounded-xl shadow-inner">
              {movie.overview}
            </div>
          </div>
        </div>
        <div className="mt-12 flex justify-center">
          <div className="bg-[#232946] rounded-2xl p-6 shadow-lg border border-white/10 w-full max-w-xl mx-auto">
            <ReviewSection id={dbContent.id} />
          </div>
        </div>
      </div>
    </div>
  );
}

