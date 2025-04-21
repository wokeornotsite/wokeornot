import type { NextApiRequest, NextApiResponse } from 'next';
import { discoverMovies } from '@/lib/tmdb';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { genre, year, page, language } = req.query;
    // Always include Family genre (10751)
    let genres = '10751';
    if (typeof genre === 'string' && genre !== '10751') {
      genres += `,${genre}`;
    }
    const kidsData = await discoverMovies({
      genre: genres,
      year: typeof year === 'string' ? year : undefined,
      page: page ? Number(page) : 1,
      language: typeof language === 'string' ? language : undefined,
    });
    const tmdbIds = kidsData.results.map((movie: any) => movie.id) || [];
    const dbContents = await prisma.content.findMany({
      where: { tmdbId: { in: tmdbIds }, contentType: 'KIDS' },
      include: {
        categoryScores: {
          include: { category: true }
        }
      }
    });
    function getCategoryScores(tmdbId: number) {
      const dbContent = dbContents.find((c: any) => c.tmdbId === tmdbId);
      if (!dbContent) return [];
      return dbContent.categoryScores.map((cs: any) => ({
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
    const kidsContent = kidsData.results.map((movie: any) => ({
      id: movie.id.toString(),
      tmdbId: movie.id,
      title: movie.title,
      overview: movie.overview,
      posterPath: movie.poster_path,
      backdropPath: movie.backdrop_path,
      releaseDate: movie.release_date ? new Date(movie.release_date) : null,
      contentType: 'KIDS',
      wokeScore: getWokeScore(movie.id),
      reviewCount: getReviewCount(movie.id),
      genres: movie.genre_ids.map((id: number) => {
        // genre names will be mapped on the client using /api/genres
        return { id };
      }),
      categoryScores: getCategoryScores(movie.id),
    }));
    res.status(200).json(kidsContent);
  } catch (err) {
    res.status(500).json([]);
  }
}
