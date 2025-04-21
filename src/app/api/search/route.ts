import { NextRequest, NextResponse } from 'next/server';
import { searchMovies, searchTVShows } from '@/lib/tmdb';
import type { TMDBMovie, TMDBTVShow, ContentItem } from '@/types';

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
    // Fetch movies, TV, and optionally kids content
    const promises = [searchMovies(query, 1), searchTVShows(query, 1)];
    if (mediaType === 'kids') {
      // Optionally, you could fetch kids/family content here
      // For now, we'll just filter movies by family genre (10751)
    }
    const [moviesRes, tvRes] = await Promise.all(promises);
    let movieItems: ContentItem[] = moviesRes.results.map((m: TMDBMovie) => ({
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
      genres: m.genre_ids?.map(id => ({ id, name: '' })) ?? [],
      categoryScores: [],
    }));
    let tvItems: ContentItem[] = tvRes.results.map((tv: TMDBTVShow) => ({
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
      genres: tv.genre_ids?.map(id => ({ id, name: '' })) ?? [],
      categoryScores: [],
    }));

    // --- Filtering ---
    let results: ContentItem[] = [];
    if (mediaType === 'movie') {
      results = movieItems;
    } else if (mediaType === 'tv') {
      results = tvItems;
    } else if (mediaType === 'kids') {
      // Only family genre (10751)
      results = movieItems.filter(item => item.genres?.some(g => g.id === 10751));
    } else {
      results = [...movieItems, ...tvItems];
    }
    if (genre) {
      const genreId = parseInt(genre, 10);
      results = results.filter(item => item.genres?.some(g => g.id === genreId));
    }
    if (year) {
      results = results.filter(item => {
        if (!item.releaseDate) return false;
        return item.releaseDate.getFullYear() === parseInt(year, 10);
      });
    }
    // Wokeness filter (if you want to filter by score)
    if (wokeness) {
      const minWoke = parseInt(wokeness, 10);
      results = results.filter(item => (item.wokeScore ?? 0) >= minWoke);
    }
    // Sort by release date descending
    results = results.sort((a, b) => (b.releaseDate?.getTime() || 0) - (a.releaseDate?.getTime() || 0));
    return NextResponse.json({ results });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Search failed.' }, { status: 500 });
  }
}
