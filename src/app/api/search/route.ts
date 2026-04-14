import { NextRequest, NextResponse } from 'next/server';
import { searchMulti } from '@/lib/tmdb';
import type { ContentItem } from '@/types';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('query') || '';
  const genre = searchParams.get('genre') || '';
  const year = searchParams.get('year') || '';
  const mediaType = searchParams.get('mediaType') || '';
  const wokeness = searchParams.get('wokeness') || '';

  if (!query) {
    return NextResponse.json({ results: [] });
  }
  try {
    // Use /search/multi — searches movies + TV in one call with better fuzzy matching
    const multiRes = await searchMulti(query, 1);

    let movieItems: ContentItem[] = (multiRes.results ?? [])
      .filter((r: any) => r.media_type === 'movie')
      .map((m: any) => ({
        id: `movie-${m.id}`,
        tmdbId: m.id,
        title: m.title,
        overview: m.overview,
        posterPath: m.poster_path,
        backdropPath: m.backdrop_path,
        releaseDate: m.release_date ? new Date(m.release_date) : null,
        contentType: 'MOVIE',
        wokeScore: 0,
        reviewCount: 0,
        genres: m.genre_ids?.map((id: number) => ({ id: String(id), name: '' })) ?? [],
        categoryScores: [],
      }));
    let tvItems: ContentItem[] = (multiRes.results ?? [])
      .filter((r: any) => r.media_type === 'tv')
      .map((tv: any) => ({
        id: `tv-${tv.id}`,
        tmdbId: tv.id,
        title: tv.name,
        overview: tv.overview,
        posterPath: tv.poster_path,
        backdropPath: tv.backdrop_path,
        releaseDate: tv.first_air_date ? new Date(tv.first_air_date) : null,
        contentType: 'TV_SHOW',
        wokeScore: 0,
        reviewCount: 0,
        genres: tv.genre_ids?.map((id: number) => ({ id: String(id), name: '' })) ?? [],
        categoryScores: [],
      }));

    // --- Filtering (by type, genre, year) ---
    let results: ContentItem[] = [];
    if (mediaType === 'movie') {
      results = movieItems;
    } else if (mediaType === 'tv') {
      results = tvItems;
    } else if (mediaType === 'kids') {
      // Only family genre (10751)
      results = movieItems.filter(item => item.genres?.some(g => g.id === '10751'));
    } else {
      results = [...movieItems, ...tvItems];
    }
    if (genre) {
      const genreId = genre; // keep as string to match Genre.id type
      results = results.filter(item => item.genres?.some(g => g.id === genreId));
    }
    if (year) {
      results = results.filter(item => {
        if (!item.releaseDate) return false;
        return item.releaseDate.getFullYear() === parseInt(year, 10);
      });
    }

    // Merge wokeScore and reviewCount from local DB for the current result set
    if (results.length > 0) {
      const localEntries = await prisma.content.findMany({
        where: {
          OR: results.map(r => ({ tmdbId: r.tmdbId, contentType: r.contentType as any })),
        },
        select: { tmdbId: true, contentType: true, wokeScore: true, reviewCount: true },
      });
      const scoreMap = new Map<string, { wokeScore: number; reviewCount: number }>();
      localEntries.forEach(e => {
        scoreMap.set(`${e.contentType}-${e.tmdbId}`, { wokeScore: (e as any).wokeScore ?? 0, reviewCount: (e as any).reviewCount ?? 0 });
      });
      results = results.map(r => {
        const key = `${r.contentType}-${r.tmdbId}`;
        const match = scoreMap.get(key);
        if (match) {
          return { ...r, wokeScore: match.wokeScore, reviewCount: match.reviewCount };
        }
        return r;
      });
    }

    // Wokeness filter aligned with UI values (low/medium/high)
    if (wokeness) {
      results = results.filter(item => {
        const s = item.wokeScore ?? 0;
        if (wokeness === 'low') return s <= 3;
        if (wokeness === 'medium') return s > 3 && s <= 6;
        if (wokeness === 'high') return s > 6;
        return true;
      });
    }

    // Sort by release date descending
    results = results.sort((a, b) => (b.releaseDate?.getTime() || 0) - (a.releaseDate?.getTime() || 0));

    return NextResponse.json(
      { results },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300',
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Search failed.' }, { status: 500 });
  }
}
