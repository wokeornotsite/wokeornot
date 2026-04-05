import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSimilarMovies, getSimilarTVShows } from '@/lib/tmdb';

/**
 * GET /api/content/[tmdbId]/similar
 * Returns similar content for a given TMDB ID.
 *
 * Query params:
 *   type: 'movie' | 'tv' (default: 'movie')
 *   page: page number (default: 1)
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ tmdbId: string }> }) {
  try {
    const { tmdbId: tmdbIdStr } = await params;
    const tmdbId = parseInt(tmdbIdStr, 10);
    if (isNaN(tmdbId)) {
      return NextResponse.json({ error: 'Invalid tmdbId' }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'movie';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const isTV = type === 'tv';
    const dbContentType = isTV ? 'TV_SHOW' : 'MOVIE';

    const similar = isTV
      ? await getSimilarTVShows(tmdbId, page)
      : await getSimilarMovies(tmdbId, page);

    const tmdbIds = (similar.results || []).map((item: any) => item.id);

    const dbContent = await prisma.content.findMany({
      where: { tmdbId: { in: tmdbIds }, contentType: dbContentType },
      select: { tmdbId: true, wokeScore: true, reviewCount: true },
    });

    const scoreMap = new Map(dbContent.map(c => [c.tmdbId, c]));

    const items = (similar.results || []).map((item: any) => ({
      tmdbId: item.id,
      title: item.title || item.name,
      overview: item.overview,
      posterPath: item.poster_path,
      backdropPath: item.backdrop_path,
      releaseDate: item.release_date || item.first_air_date,
      genreIds: item.genre_ids,
      contentType: type,
      wokeScore: scoreMap.get(item.id)?.wokeScore ?? 0,
      reviewCount: scoreMap.get(item.id)?.reviewCount ?? 0,
    }));

    return NextResponse.json({
      items,
      page: similar.page,
      totalPages: similar.total_pages,
    });
  } catch (error) {
    console.error('Similar content error:', error);
    return NextResponse.json({ error: 'Failed to fetch similar content' }, { status: 500 });
  }
}
