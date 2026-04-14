import { NextRequest, NextResponse } from 'next/server';
import { getMovieWatchProviders, getTVWatchProviders } from '@/lib/tmdb';

/**
 * GET /api/content/[tmdbId]/providers
 * Returns watch providers (streaming, rent, buy) for content.
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

    const providers = type === 'tv'
      ? await getTVWatchProviders(tmdbId)
      : await getMovieWatchProviders(tmdbId);

    return NextResponse.json(providers, {
      headers: {
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=172800',
      },
    });
  } catch (error) {
    console.error('Watch providers error:', error);
    return NextResponse.json({ error: 'Failed to fetch watch providers' }, { status: 500 });
  }
}
