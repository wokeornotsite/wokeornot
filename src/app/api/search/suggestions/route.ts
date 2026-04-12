import { NextRequest, NextResponse } from 'next/server';
import { searchMulti } from '@/lib/tmdb';

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('query') || '';
  if (query.length < 2) {
    return NextResponse.json({ suggestions: [] });
  }

  try {
    const multiRes = await searchMulti(query);

    const movies = (multiRes?.results || [])
      .filter((r: any) => r.media_type === 'movie')
      .slice(0, 4)
      .map((m: any) => ({
        tmdbId: m.id,
        title: m.title || '',
        year: m.release_date ? m.release_date.slice(0, 4) : '',
        type: 'movie' as const,
        posterPath: m.poster_path || null,
      }));

    const tvShows = (multiRes?.results || [])
      .filter((r: any) => r.media_type === 'tv')
      .slice(0, 3)
      .map((t: any) => ({
        tmdbId: t.id,
        title: t.name || '',
        year: t.first_air_date ? t.first_air_date.slice(0, 4) : '',
        type: 'tv' as const,
        posterPath: t.poster_path || null,
      }));

    // Up to 4 movies + 3 tv = 7 total, dedupe by title
    const seen = new Set<string>();
    const suggestions = [...movies, ...tvShows].filter(s => {
      if (!s.title || seen.has(s.title.toLowerCase())) return false;
      seen.add(s.title.toLowerCase());
      return true;
    });

    return NextResponse.json({ suggestions });
  } catch (err: any) {
    console.error('[suggestions] TMDB error:', err?.message);
    return NextResponse.json({ suggestions: [] });
  }
}
