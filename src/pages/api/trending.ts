import type { NextApiRequest, NextApiResponse } from 'next';
import { fetchTrendingMovies, fetchTrendingTVShows } from '@/utils/tmdb';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { type } = req.query;
  try {
    let results;
    let contentType;
    if (type === 'movie') {
      results = await fetchTrendingMovies();
      contentType = 'MOVIE';
    } else if (type === 'tv') {
      results = await fetchTrendingTVShows();
      contentType = 'TV_SHOW';
    } else {
      res.status(400).json({ error: 'Invalid type' });
      return;
    }

    // Get TMDb IDs from trending results
    const tmdbIds = results.map((item: any) => item.id);

    // Query local DB for wokeScore for these TMDb IDs
    const localScores = await prisma.content.findMany({
      where: {
        tmdbId: { in: tmdbIds },
        contentType: contentType,
      },
      select: {
        tmdbId: true,
        wokeScore: true,
      },
    });
    // Map for quick lookup
    const wokeScoreMap = new Map<number, number | null>();
    localScores.forEach((entry) => {
      wokeScoreMap.set(entry.tmdbId, entry.wokeScore);
    });
    // Merge wokeScore into results
    const mergedResults = results.map((item: any) => ({
      ...item,
      wokeScore: wokeScoreMap.has(item.id) ? wokeScoreMap.get(item.id) : undefined,
    }));

    res.status(200).json({ results: mergedResults });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch trending content' });
  }
}
