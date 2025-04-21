import type { NextApiRequest, NextApiResponse } from 'next';
import { discoverTVShows } from '@/lib/tmdb';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { genre, year, page, language } = req.query;
    const tvShowsData = await discoverTVShows({
      genre: typeof genre === 'string' ? genre : undefined,
      year: typeof year === 'string' ? year : undefined,
      page: page ? Number(page) : 1,
      language: typeof language === 'string' ? language : undefined,
    });
    const tmdbIds = tvShowsData?.results?.map((show: any) => show.id) || [];
    const dbContents = await prisma.content.findMany({
      where: { tmdbId: { in: tmdbIds }, contentType: 'TV_SHOW' },
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
    const tvShows = tvShowsData?.results?.map((show: any) => ({
      id: show.id.toString(),
      tmdbId: show.id,
      title: show.name,
      overview: show.overview,
      posterPath: show.poster_path,
      backdropPath: show.backdrop_path,
      releaseDate: show.first_air_date ? new Date(show.first_air_date) : null,
      contentType: 'TV_SHOW',
      wokeScore: getWokeScore(show.id),
      reviewCount: getReviewCount(show.id),
      genres: show.genre_ids.map((id: number) => {
        // genre names will be mapped on the client using /api/genres
        return { id };
      }),
      categoryScores: getCategoryScores(show.id),
    }));
    res.status(200).json(tvShows);
  } catch (err) {
    res.status(500).json([]);
  }
}
