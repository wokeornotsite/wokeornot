import axios from 'axios';
import { TMDBMovie, TMDBTVShow, TMDBGenre, TMDBResponse } from '@/types';

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

// Create axios instance for TMDB API
const tmdbApi = axios.create({
  baseURL: TMDB_BASE_URL,
  params: {
    api_key: TMDB_API_KEY,
  },
});

// Get popular movies
export const getPopularMovies = async (page = 1): Promise<TMDBResponse<TMDBMovie>> => {
  const response = await tmdbApi.get<TMDBResponse<TMDBMovie>>('/movie/popular', {
    params: { page },
  });
  return response.data;
};

// Get popular TV shows
export const getPopularTVShows = async (page = 1): Promise<TMDBResponse<TMDBTVShow>> => {
  const response = await tmdbApi.get<TMDBResponse<TMDBTVShow>>('/tv/popular', {
    params: { page },
  });
  return response.data;
};

// Get movie details
export const getMovieDetails = async (id: number) => {
  const response = await tmdbApi.get(`/movie/${id}`);
  return response.data;
};

// Get TV show details
export const getTVShowDetails = async (id: number) => {
  const response = await tmdbApi.get(`/tv/${id}`);
  return response.data;
};

// Get TV show credits (cast and crew)
export const getTVCredits = async (id: number) => {
  const response = await tmdbApi.get(`/tv/${id}/credits`);
  return response.data;
};

// Get movie credits (cast and crew)
export const getMovieCredits = async (id: number) => {
  const response = await tmdbApi.get(`/movie/${id}/credits`);
  return response.data;
};

// Get similar TV shows
export const getSimilarTVShows = async (id: number, page = 1) => {
  const response = await tmdbApi.get(`/tv/${id}/similar`, { params: { page } });
  return response.data;
};

// Get similar movies
export const getSimilarMovies = async (id: number, page = 1) => {
  const response = await tmdbApi.get(`/movie/${id}/similar`, { params: { page } });
  return response.data;
};

// Search movies
export const searchMovies = async (query: string, page = 1): Promise<TMDBResponse<TMDBMovie>> => {
  const response = await tmdbApi.get<TMDBResponse<TMDBMovie>>('/search/movie', {
    params: { query, page },
  });
  return response.data;
};

// Search TV shows
export const searchTVShows = async (query: string, page = 1): Promise<TMDBResponse<TMDBTVShow>> => {
  const response = await tmdbApi.get<TMDBResponse<TMDBTVShow>>('/search/tv', {
    params: { query, page },
  });
  return response.data;
};

// Get movie genres
export const getMovieGenres = async (): Promise<TMDBGenre[]> => {
  const response = await tmdbApi.get<{ genres: TMDBGenre[] }>('/genre/movie/list');
  return response.data.genres;
};

// Get TV show genres
export const getTVGenres = async (): Promise<TMDBGenre[]> => {
  const response = await tmdbApi.get<{ genres: TMDBGenre[] }>('/genre/tv/list');
  return response.data.genres;
};

// Discover movies with filters
type DiscoverMoviesParams = { genre?: string; year?: string; page?: number; language?: string };
export const discoverMovies = async ({ genre, year, page = 1, language }: DiscoverMoviesParams): Promise<TMDBResponse<TMDBMovie>> => {
  const params: any = { page, sort_by: 'popularity.desc' };
  if (genre) params.with_genres = genre;
  if (year) params.primary_release_year = year;
  if (language) params.with_original_language = language;
  const response = await tmdbApi.get<TMDBResponse<TMDBMovie>>('/discover/movie', { params });
  return response.data;
};

// Discover TV shows with filters
type DiscoverTVShowsParams = { genre?: string; year?: string; page?: number; language?: string };
export const discoverTVShows = async ({ genre, year, page = 1, language }: DiscoverTVShowsParams): Promise<TMDBResponse<TMDBTVShow>> => {
  const params: any = { page, sort_by: 'popularity.desc' };
  if (genre) params.with_genres = genre;
  if (year) params.first_air_date_year = year;
  if (language) params.with_original_language = language;
  const response = await tmdbApi.get<TMDBResponse<TMDBTVShow>>('/discover/tv', { params });
  return response.data;
};

// Get family/kids content
export const getKidsContent = async (page = 1): Promise<TMDBResponse<TMDBMovie>> => {
  // Get family genre movies (Family genre ID is 10751)
  const response = await tmdbApi.get<TMDBResponse<TMDBMovie>>('/discover/movie', {
    params: {
      with_genres: '10751',
      page,
      certification_country: 'US',
      certification: 'G',
      sort_by: 'popularity.desc',
    },
  });
  return response.data;
};

// Get image URL
export const getImageUrl = (path: string | null, size = 'w500'): string => {
  if (!path) return '/images/placeholder.png';
  return `https://image.tmdb.org/t/p/${size}${path}`;
};
