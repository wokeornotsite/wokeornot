// Utility for mapping TMDB genre IDs to names for movies and TV
import { getMovieGenres, getTVGenres } from './tmdb';
import { Genre } from '@/types';

export type GenreMap = Record<number, string>;

// Fetch and cache all genres for both movies and TV
let movieGenreMap: GenreMap = {};
let tvGenreMap: GenreMap = {};

export const fetchAndCacheGenres = async () => {
  const [movieGenres, tvGenres] = await Promise.all([
    getMovieGenres(),
    getTVGenres(),
  ]);
  movieGenreMap = Object.fromEntries(movieGenres.map((g: Genre) => [g.id, g.name]));
  tvGenreMap = Object.fromEntries(tvGenres.map((g: Genre) => [g.id, g.name]));
};

export const getGenreName = (id: number, type: 'movie' | 'tv' = 'movie'): string => {
  if (type === 'tv') return tvGenreMap[id] || '';
  return movieGenreMap[id] || '';
};

export const getGenreNames = (ids: number[], type: 'movie' | 'tv' = 'movie'): string[] => {
  return ids.map(id => getGenreName(id, type)).filter(Boolean);
};
