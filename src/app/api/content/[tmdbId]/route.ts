import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  getMovieDetails, getTVShowDetails,
  getMovieCredits, getTVCredits,
  getMovieVideos, getTVVideos,
} from '@/lib/tmdb';

/**
 * GET /api/content/[tmdbId]
 * Full content detail: TMDB metadata + DB woke scores/reviews.
 *
 * Query params:
 *   type: 'movie' | 'tv' (default: 'movie')
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
    const isTV = type === 'tv';
    const dbContentType = isTV ? 'TV_SHOW' : 'MOVIE';

    // Fetch TMDB data in parallel
    const [details, credits, trailer] = await Promise.all([
      isTV ? getTVShowDetails(tmdbId) : getMovieDetails(tmdbId),
      isTV ? getTVCredits(tmdbId) : getMovieCredits(tmdbId),
      isTV ? getTVVideos(tmdbId) : getMovieVideos(tmdbId),
    ]);

    // Fetch DB data (scores, review count)
    const dbContent = await prisma.content.findUnique({
      where: { tmdbId_contentType: { tmdbId, contentType: dbContentType } },
      include: {
        categoryScores: {
          include: { category: true },
          orderBy: { percentage: 'desc' },
        },
      },
    });

    // Build cast list (top 20)
    const cast = (credits?.cast || []).slice(0, 20).map((c: any) => ({
      id: c.id,
      name: c.name,
      character: c.character,
      profilePath: c.profile_path,
    }));

    // Build response
    const response = {
      tmdbId: details.id,
      title: details.title || details.name,
      overview: details.overview,
      posterPath: details.poster_path,
      backdropPath: details.backdrop_path,
      releaseDate: details.release_date || details.first_air_date,
      contentType: type,
      runtime: details.runtime || (details.episode_run_time?.[0]) || null,
      voteAverage: details.vote_average,
      genres: (details.genres || []).map((g: any) => ({ id: g.id, name: g.name })),
      tagline: details.tagline || null,
      status: details.status || null,
      // TV-specific fields
      numberOfSeasons: details.number_of_seasons || null,
      numberOfEpisodes: details.number_of_episodes || null,
      // Our DB data
      wokeScore: dbContent?.wokeScore ?? 0,
      reviewCount: dbContent?.reviewCount ?? 0,
      categoryScores: (dbContent?.categoryScores || []).map(cs => ({
        categoryId: cs.categoryId,
        categoryName: cs.category.name,
        score: cs.score,
        count: cs.count,
        percentage: cs.percentage,
      })),
      // Additional details
      cast,
      trailer: trailer ? { key: trailer.key, name: trailer.name } : null,
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200',
      },
    });
  } catch (error) {
    console.error('Content detail error:', error);
    return NextResponse.json({ error: 'Failed to fetch content details' }, { status: 500 });
  }
}
