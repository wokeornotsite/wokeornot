import { NextRequest, NextResponse } from 'next/server';
import { getMovieGenres, getTVGenres } from '@/lib/tmdb';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') || 'movie';
  try {
    if (type === 'tv') {
      const genres = await getTVGenres();
      return NextResponse.json(genres);
    } else {
      const genres = await getMovieGenres();
      return NextResponse.json(genres);
    }
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to fetch genres.' }, { status: 500 });
  }
}
