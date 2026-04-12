import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getPopularMovies, getPopularTVShows } from '@/lib/tmdb';

/**
 * GET /api/content/trending
 * Returns trending movies and TV shows for the home screen.
 *
 * Query params:
 *   type: 'movies' | 'tv' | 'all' (default: 'all')
 *   limit: number of items per category (default: 20)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'all';
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 40);

    const results: Record<string, any> = {};

    if (type === 'all' || type === 'movies') {
      const movies = await getPopularMovies(1);
      const movieIds = movies.results.map(m => m.id);
      const dbMovies = await prisma.content.findMany({
        where: { tmdbId: { in: movieIds }, contentType: 'MOVIE' },
        select: { tmdbId: true, wokeScore: true, reviewCount: true },
      });
      const movieScoreMap = new Map(dbMovies.map(c => [c.tmdbId, c]));

      results.movies = movies.results.slice(0, limit).map(m => ({
        tmdbId: m.id,
        title: m.title,
        overview: m.overview,
        posterPath: m.poster_path,
        backdropPath: m.backdrop_path,
        releaseDate: m.release_date,
        genreIds: m.genre_ids,
        contentType: 'movie',
        wokeScore: movieScoreMap.get(m.id)?.wokeScore ?? 0,
        reviewCount: movieScoreMap.get(m.id)?.reviewCount ?? 0,
      }));
    }

    if (type === 'all' || type === 'tv') {
      const tvShows = await getPopularTVShows(1);
      const tvIds = tvShows.results.map(t => t.id);
      const dbTV = await prisma.content.findMany({
        where: { tmdbId: { in: tvIds }, contentType: 'TV_SHOW' },
        select: { tmdbId: true, wokeScore: true, reviewCount: true },
      });
      const tvScoreMap = new Map(dbTV.map(c => [c.tmdbId, c]));

      results.tvShows = tvShows.results.slice(0, limit).map(t => ({
        tmdbId: t.id,
        title: t.name,
        overview: t.overview,
        posterPath: t.poster_path,
        backdropPath: t.backdrop_path,
        releaseDate: t.first_air_date,
        genreIds: t.genre_ids,
        contentType: 'tv',
        wokeScore: tvScoreMap.get(t.id)?.wokeScore ?? 0,
        reviewCount: tvScoreMap.get(t.id)?.reviewCount ?? 0,
      }));
    }

    // Also fetch recently rated content from our DB
    const recentlyRated = await prisma.content.findMany({
      where: { reviewCount: { gt: 0 } },
      orderBy: { updatedAt: 'desc' },
      take: limit,
      select: {
        tmdbId: true,
        title: true,
        overview: true,
        posterPath: true,
        backdropPath: true,
        releaseDate: true,
        contentType: true,
        wokeScore: true,
        reviewCount: true,
      },
    });

    results.recentlyRated = recentlyRated.map(c => ({
      ...c,
      contentType: c.contentType === 'TV_SHOW' ? 'tv' : c.contentType === 'KIDS' ? 'kids' : 'movie',
    }));

    return NextResponse.json(results, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
    });
  } catch (error) {
    console.error('Trending content error:', error);
    return NextResponse.json({ error: 'Failed to fetch trending content' }, { status: 500 });
  }
}
