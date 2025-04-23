import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const genre = searchParams.get('genre') || '';
  const year = searchParams.get('year') || '';
  const language = searchParams.get('language') || 'en-US';
  const TMDB_API_KEY = process.env.TMDB_API_KEY;
  if (!TMDB_API_KEY) {
    return NextResponse.json({ error: 'TMDB_API_KEY not set' }, { status: 500 });
  }
  // TMDb "family" genre is id 10751
  let withGenres = '10751';
  if (genre) {
    withGenres += `,${genre}`;
  }
  let url = `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&with_genres=${withGenres}&language=${language}&sort_by=popularity.desc&page=1`;
  if (year) {
    url += `&primary_release_year=${year}`;
  }
  const response = await fetch(url);
  if (!response.ok) {
    return NextResponse.json({ error: 'Failed to fetch from TMDb' }, { status: 502 });
  }
  const data = await response.json();
  // Merge real wokeScore and reviewCount from DB (contentType: 'KIDS')
  const tmdbIds = data.results.map((movie: any) => movie.id);
  const dbContents = await prisma.content.findMany({
    where: { tmdbId: { in: tmdbIds }, contentType: 'KIDS' },
    select: { tmdbId: true, wokeScore: true, reviewCount: true }
  });
  const dbMap = Object.fromEntries(dbContents.map((c: any) => [c.tmdbId, c]));

  const results = data.results.map((movie: any) => {
    const db = dbMap[movie.id];
    return {
      ...movie,
      contentType: 'KIDS',
      tmdbId: movie.id,
      wokeScore: db?.wokeScore ?? 0,
      reviewCount: db?.reviewCount ?? 0,
      posterPath: movie.poster_path || null,
      backdropPath: movie.backdrop_path || null
    };
  });
  return NextResponse.json(results);
}
