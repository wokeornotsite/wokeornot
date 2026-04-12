import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { discoverMovies, discoverTVShows, getKidsContent } from '@/lib/tmdb';

/**
 * GET /api/content
 * Paginated content list with filters for the browse screen.
 *
 * Query params:
 *   contentType: 'movie' | 'tv' | 'kids' (default: 'movie')
 *   genre: TMDB genre ID
 *   year: release year
 *   language: original language code (e.g., 'en')
 *   sort: 'popularity' | 'rating' | 'wokeness' | 'newest' (default: 'popularity')
 *   wokeness: 'low' | 'moderate' | 'high' — filter by woke score range
 *   page: page number (default: 1)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const contentType = searchParams.get('contentType') || 'movie';
    const genre = searchParams.get('genre') || undefined;
    const year = searchParams.get('year') || undefined;
    const language = searchParams.get('language') || undefined;
    const sort = searchParams.get('sort') || 'popularity';
    const wokeness = searchParams.get('wokeness') || undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);

    let tmdbResults: any;

    if (contentType === 'kids') {
      tmdbResults = await getKidsContent(page);
    } else if (contentType === 'tv') {
      tmdbResults = await discoverTVShows({ genre, year, page, language });
    } else {
      tmdbResults = await discoverMovies({ genre, year, page, language });
    }

    const tmdbItems = tmdbResults.results || [];

    // Get tmdbIds to look up our DB scores
    const tmdbIds = tmdbItems.map((item: any) => item.id);
    const dbContentType = contentType === 'tv' ? 'TV_SHOW' : contentType === 'kids' ? 'KIDS' : 'MOVIE';

    const dbContent = await prisma.content.findMany({
      where: {
        tmdbId: { in: tmdbIds },
        contentType: dbContentType,
      },
      select: {
        tmdbId: true,
        wokeScore: true,
        reviewCount: true,
      },
    });

    const scoreMap = new Map(dbContent.map(c => [c.tmdbId, { wokeScore: c.wokeScore, reviewCount: c.reviewCount }]));

    // Merge TMDB data with our DB scores
    let items = tmdbItems.map((item: any) => {
      const scores = scoreMap.get(item.id);
      return {
        tmdbId: item.id,
        title: item.title || item.name,
        overview: item.overview,
        posterPath: item.poster_path,
        backdropPath: item.backdrop_path,
        releaseDate: item.release_date || item.first_air_date,
        genreIds: item.genre_ids,
        contentType,
        wokeScore: scores?.wokeScore ?? 0,
        reviewCount: scores?.reviewCount ?? 0,
      };
    });

    // Apply wokeness filter
    if (wokeness) {
      items = items.filter((item: any) => {
        if (item.reviewCount === 0) return wokeness === 'low'; // unrated = show in "low"
        if (wokeness === 'low') return item.wokeScore <= 3;
        if (wokeness === 'moderate') return item.wokeScore > 3 && item.wokeScore <= 6;
        if (wokeness === 'high') return item.wokeScore > 6;
        return true;
      });
    }

    // Apply local sort for wokeness/rating (TMDB already sorts by popularity)
    if (sort === 'wokeness') {
      items.sort((a: any, b: any) => b.wokeScore - a.wokeScore);
    } else if (sort === 'newest') {
      items.sort((a: any, b: any) => {
        const dateA = a.releaseDate ? new Date(a.releaseDate).getTime() : 0;
        const dateB = b.releaseDate ? new Date(b.releaseDate).getTime() : 0;
        return dateB - dateA;
      });
    }

    return NextResponse.json({
      items,
      page: tmdbResults.page,
      totalPages: tmdbResults.total_pages,
      totalResults: tmdbResults.total_results,
    }, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
    });
  } catch (error) {
    console.error('Content browse error:', error);
    return NextResponse.json({ error: 'Failed to fetch content' }, { status: 500 });
  }
}
