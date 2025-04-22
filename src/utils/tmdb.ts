// Utility for fetching trending movies and TV shows from TMDb
import fetch from 'node-fetch';

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const BASE_URL = 'https://api.themoviedb.org/3';

export async function fetchTrendingMovies() {
  const res = await fetch(`${BASE_URL}/trending/movie/day?api_key=${TMDB_API_KEY}`);
  if (!res.ok) throw new Error('Failed to fetch trending movies');
  const data = await res.json();
  return data.results;
}

export async function fetchTrendingTVShows() {
  const res = await fetch(`${BASE_URL}/trending/tv/day?api_key=${TMDB_API_KEY}`);
  if (!res.ok) throw new Error('Failed to fetch trending TV shows');
  const data = await res.json();
  return data.results;
}
