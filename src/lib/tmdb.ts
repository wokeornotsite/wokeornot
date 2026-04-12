import axios from 'axios';
import { TMDBMovie, TMDBTVShow, TMDBGenre, TMDBResponse } from '@/types';

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

const tmdbCache = new Map<string, { data: unknown; expiresAt: number }>();
const TMDB_CACHE_TTL = 60 * 60 * 1000; // 1 hour

function getCached<T>(key: string): T | null {
  const entry = tmdbCache.get(key);
  if (entry && Date.now() < entry.expiresAt) return entry.data as T;
  tmdbCache.delete(key);
  return null;
}

function setCache(key: string, data: unknown): void {
  tmdbCache.set(key, { data, expiresAt: Date.now() + TMDB_CACHE_TTL });
}

// Create axios instance for TMDB API
const tmdbApi = axios.create({
  baseURL: TMDB_BASE_URL,
  params: {
    api_key: TMDB_API_KEY,
  },
});

if (!TMDB_API_KEY) {
  console.error('[TMDB] TMDB_API_KEY is not set — search and content fetching will fail');
}

tmdbApi.interceptors.response.use(
  r => r,
  error => {
    console.error('[TMDB] API error:', error.response?.status, error.config?.url, error.response?.data?.status_message || error.message);
    return Promise.reject(error);
  }
);

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
  const cacheKey = 'movieDetails:' + id;
  const cached = getCached<unknown>(cacheKey);
  if (cached) return cached;
  const response = await tmdbApi.get(`/movie/${id}`);
  setCache(cacheKey, response.data);
  return response.data;
};

// Get TV show details
export const getTVShowDetails = async (id: number) => {
  const cacheKey = 'tvShowDetails:' + id;
  const cached = getCached<unknown>(cacheKey);
  if (cached) return cached;
  const response = await tmdbApi.get(`/tv/${id}`);
  setCache(cacheKey, response.data);
  return response.data;
};

// Get TV show credits (cast and crew)
export const getTVCredits = async (id: number) => {
  const cacheKey = 'tvCredits:' + id;
  const cached = getCached<unknown>(cacheKey);
  if (cached) return cached;
  const response = await tmdbApi.get(`/tv/${id}/credits`);
  setCache(cacheKey, response.data);
  return response.data;
};

// Get movie credits (cast and crew)
export const getMovieCredits = async (id: number) => {
  const cacheKey = 'movieCredits:' + id;
  const cached = getCached<unknown>(cacheKey);
  if (cached) return cached;
  const response = await tmdbApi.get(`/movie/${id}/credits`);
  setCache(cacheKey, response.data);
  return response.data;
};

// Get similar TV shows
export const getSimilarTVShows = async (id: number, page = 1) => {
  const cacheKey = 'similarTVShows:' + id + ':' + page;
  const cached = getCached<unknown>(cacheKey);
  if (cached) return cached;
  const response = await tmdbApi.get(`/tv/${id}/similar`, { params: { page } });
  setCache(cacheKey, response.data);
  return response.data;
};

// Get similar movies
export const getSimilarMovies = async (id: number, page = 1) => {
  const cacheKey = 'similarMovies:' + id + ':' + page;
  const cached = getCached<unknown>(cacheKey);
  if (cached) return cached;
  const response = await tmdbApi.get(`/movie/${id}/similar`, { params: { page } });
  setCache(cacheKey, response.data);
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

// Multi-search (movies + TV shows in one call, better fuzzy/typo matching than separate endpoints)
export const searchMulti = async (query: string, page = 1) => {
  const response = await tmdbApi.get('/search/multi', {
    params: { query, page, language: 'en-US', include_adult: false },
  });
  return response.data as { results: any[]; total_results: number; total_pages: number };
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

// Watch provider item type
export interface WatchProvider {
  provider_id: number;
  provider_name: string;
  logo_path: string;
}

export interface WatchProviders {
  flatrate?: WatchProvider[];
  rent?: WatchProvider[];
  buy?: WatchProvider[];
}

// Video item type
export interface TMDBVideo {
  key: string;
  name: string;
}

// Get movie watch providers (US region)
export const getMovieWatchProviders = async (tmdbId: number): Promise<WatchProviders> => {
  const cacheKey = 'movieWatchProviders:' + tmdbId;
  const cached = getCached<WatchProviders>(cacheKey);
  if (cached) return cached;
  try {
    const response = await tmdbApi.get(`/movie/${tmdbId}/watch/providers`);
    const usData = response.data?.results?.US;
    if (!usData) return {};
    const result: WatchProviders = {
      flatrate: usData.flatrate || [],
      rent: usData.rent || [],
      buy: usData.buy || [],
    };
    setCache(cacheKey, result);
    return result;
  } catch {
    return {};
  }
};

// Get TV show watch providers (US region)
export const getTVWatchProviders = async (tmdbId: number): Promise<WatchProviders> => {
  const cacheKey = 'tvWatchProviders:' + tmdbId;
  const cached = getCached<WatchProviders>(cacheKey);
  if (cached) return cached;
  try {
    const response = await tmdbApi.get(`/tv/${tmdbId}/watch/providers`);
    const usData = response.data?.results?.US;
    if (!usData) return {};
    const result: WatchProviders = {
      flatrate: usData.flatrate || [],
      rent: usData.rent || [],
      buy: usData.buy || [],
    };
    setCache(cacheKey, result);
    return result;
  } catch {
    return {};
  }
};

// Get movie trailer (first YouTube trailer)
export const getMovieVideos = async (tmdbId: number): Promise<TMDBVideo | null> => {
  const cacheKey = 'movieVideos:' + tmdbId;
  const cached = getCached<TMDBVideo | null>(cacheKey);
  if (cached !== null && cached !== undefined) return cached;
  try {
    const response = await tmdbApi.get(`/movie/${tmdbId}/videos`);
    const videos: any[] = response.data?.results || [];
    const trailer = videos.find(
      (v) => v.site === 'YouTube' && v.type === 'Trailer'
    ) || videos.find((v) => v.site === 'YouTube') || null;
    if (!trailer) return null;
    const result: TMDBVideo = { key: trailer.key, name: trailer.name };
    setCache(cacheKey, result);
    return result;
  } catch {
    return null;
  }
};

// Get TV show trailer (first YouTube trailer)
export const getTVVideos = async (tmdbId: number): Promise<TMDBVideo | null> => {
  const cacheKey = 'tvVideos:' + tmdbId;
  const cached = getCached<TMDBVideo | null>(cacheKey);
  if (cached !== null && cached !== undefined) return cached;
  try {
    const response = await tmdbApi.get(`/tv/${tmdbId}/videos`);
    const videos: any[] = response.data?.results || [];
    const trailer = videos.find(
      (v) => v.site === 'YouTube' && v.type === 'Trailer'
    ) || videos.find((v) => v.site === 'YouTube') || null;
    if (!trailer) return null;
    const result: TMDBVideo = { key: trailer.key, name: trailer.name };
    setCache(cacheKey, result);
    return result;
  } catch {
    return null;
  }
};
