import type { NextApiRequest, NextApiResponse } from 'next';
import { discoverMovies } from '@/lib/tmdb';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { genre, year, page, language } = req.query;
    const moviesData = await discoverMovies({
      genre: typeof genre === 'string' ? genre : undefined,
      year: typeof year === 'string' ? year : undefined,
      page: page ? Number(page) : 1,
      language: typeof language === 'string' ? language : undefined,
    });
    const tmdbIds = moviesData?.results?.map((movie: any) => movie.id) || [];
    const dbContents = await prisma.content.findMany({
      where: { tmdbId: { in: tmdbIds }, contentType: 'MOVIE' },
      include: {
        categoryScores: {
          include: { category: true }
        }
      }
    });
    function getCategoryScores(tmdbId: number) {
      const dbContent = dbContents.find((c: any) => c.tmdbId === tmdbId);
      if (!dbContent) return [];
      return dbContent.categoryScores
        .filter((cs: any) => cs.count > 0)
        .map((cs: any) => ({
          categoryId: cs.categoryId,
          category: { name: cs.category?.name || '' },
          percentage: cs.percentage,
          count: cs.count,
        }));
    }
    function getWokeScore(tmdbId: number) {
      const dbContent = dbContents.find((c: any) => c.tmdbId === tmdbId);
      return dbContent?.wokeScore ?? 0;
    }
    function getReviewCount(tmdbId: number) {
      const dbContent = dbContents.find((c: any) => c.tmdbId === tmdbId);
      return dbContent?.reviewCount ?? 0;
    }
    const movies = moviesData?.results?.map((movie: any) => ({
      id: movie.id,
      tmdbId: movie.id,
      title: movie.title,
      overview: movie.overview,
      posterPath: movie.poster_path,
      backdropPath: movie.backdrop_path,
      releaseDate: movie.release_date ? new Date(movie.release_date) : null,
      contentType: 'MOVIE',
      wokeScore: getWokeScore(movie.id),
      reviewCount: getReviewCount(movie.id),
      genres: movie.genre_ids.map((id: number) => {
        // genre names will be mapped on the client using /api/genres
        return { id };
      }),
      categoryScores: getCategoryScores(movie.id),
    }));
    // Cache for 5 minutes
    res.setHeader(
      'Cache-Control',
      'public, s-maxage=300, stale-while-revalidate=600'
    );
    res.status(200).json(movies);
  } catch (err) {
    res.status(500).json([]);
  }
}
