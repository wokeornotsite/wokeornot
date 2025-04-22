

// Extend the Session type to include user ID and role
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: string;
    };
  }
}

// Content types
export interface ContentItem {
  id: string;
  tmdbId: number;
  title: string;
  overview: string;
  posterPath?: string | null;
  backdropPath?: string | null;
  releaseDate?: Date | null;
  contentType: string;
  wokeScore: number;
  reviewCount: number;
  genres?: Genre[];
  categoryScores?: CategoryScore[];
  categories?: Category[];
}

export interface Genre {
  id: string;
  name: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string | null;
}

export interface CategoryScore {
  id: string;
  categoryId: string;
  score: number;
  count: number;
  percentage: number;
  contentId: string;
  category?: Category;
}

export interface Review {
  id: string;
  userId: string;
  contentId: string;
  rating: number;
  text?: string | null;
  createdAt: Date;
  updatedAt: Date;
  user?: { id: string; name?: string | null; image?: string | null };
  categories?: ReviewCategory[];
}

export interface ReviewCategory {
  id: string;
  categoryId: string;
  category?: Category;
}

export interface Comment {
  id: string;
  text: string;
  userId: string;
  parentId?: string | null;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
  user?: { id: string; name?: string | null; image?: string | null };
  replies?: Comment[];
}

export interface ForumThread {
  id: string;
  title: string;
  content: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  user?: { id: string; name?: string | null; image?: string | null };
}

// TMDB API types
export interface TMDBMovie {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  genre_ids: number[];
}

export interface TMDBTVShow {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string;
  genre_ids: number[];
}

export interface TMDBGenre {
  id: number;
  name: string;
}

export interface TMDBResponse<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}
