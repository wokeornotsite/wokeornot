import { NextRequest, NextResponse } from 'next/server';

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
  // Add contentType and tmdbId for frontend compatibility
  const results = data.results.map((movie: any) => ({
    ...movie,
    contentType: 'MOVIE',
    tmdbId: movie.id,
    wokeScore: 0,
    reviewCount: 0,
    posterPath: movie.poster_path || null,
    backdropPath: movie.backdrop_path || null
  }));
  return NextResponse.json(results);
}
