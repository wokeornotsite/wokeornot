'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { ClientContentCard } from '@/components/ui/client-content-card';
import type { ContentItem } from '@/types';

export default function FavoritesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState('title-asc');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated') {
      fetchFavorites();
    }
  }, [status, router]);

  async function fetchFavorites() {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get('/api/favorites');
      setFavorites(res.data.favorites || []);
    } catch (err) {
      console.error('Error fetching favorites:', err);
      setError('Failed to load favorites');
    } finally {
      setLoading(false);
    }
  }

  const sortedFavorites = [...favorites].sort((a, b) => {
    switch (sortBy) {
      case 'title-asc': return (a.title || '').localeCompare(b.title || '');
      case 'title-desc': return (b.title || '').localeCompare(a.title || '');
      case 'wokeness-desc': return (b.wokeScore || 0) - (a.wokeScore || 0);
      case 'wokeness-asc': return (a.wokeScore || 0) - (b.wokeScore || 0);
      default: return 0;
    }
  });

  // Convert favorites to ContentItem format
  const contentItems: ContentItem[] = sortedFavorites.map((fav) => ({
    id: fav.contentId,
    tmdbId: parseInt(fav.contentId),
    title: fav.title,
    overview: '',
    releaseDate: null,
    posterPath: fav.posterPath || null,
    backdropPath: null,
    contentType: fav.contentType as 'movie' | 'tv' | 'kids',
    genres: [],
    wokeScore: fav.wokeScore || 0,
    reviewCount: 0,
  }));

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#181824] via-[#232946] to-[#181824] py-16">
        <div className="container mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-12 bg-white/10 rounded w-64 mb-8"></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {[...Array(10)].map((_, i) => (
                <ClientContentCard key={i} loading />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#181824] via-[#232946] to-[#181824]">
      {/* Hero */}
      <section className="bg-[#1a1a2e] border-b border-white/10">
        <div className="max-w-5xl mx-auto px-6 py-10 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-3">My Favorites</h1>
          <p className="text-gray-400 text-lg">
            Your personal watchlist
            {favorites.length > 0 && (
              <span className="ml-2 inline-block bg-purple-900/40 border border-purple-700/40 text-purple-300 text-sm font-semibold rounded-full px-3 py-0.5">
                {favorites.length} {favorites.length === 1 ? 'item' : 'items'}
              </span>
            )}
          </p>
        </div>
      </section>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 pb-12">
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-900/20 border border-red-500/30 text-red-200 text-center">
            {error}
          </div>
        )}

        {!loading && favorites.length === 0 && (
          <div className="text-center py-16">
            <div className="inline-block p-6 rounded-full bg-white/10 mb-6">
              <svg className="w-16 h-16 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">No favorites yet</h2>
            <p className="text-blue-200 mb-6">
              Start adding movies and shows to your watchlist!
            </p>
            <div className="flex gap-4 justify-center">
              <a
                href="/movies"
                className="px-6 py-3 rounded-lg bg-gradient-to-r from-pink-500 to-blue-500 text-white font-semibold hover:from-blue-500 hover:to-pink-500 transition-all"
              >
                Browse Movies
              </a>
              <a
                href="/tv-shows"
                className="px-6 py-3 rounded-lg bg-white/10 border border-white/20 text-white font-semibold hover:bg-white/20 transition-all"
              >
                Browse TV Shows
              </a>
            </div>
          </div>
        )}

        {favorites.length > 0 && (
          <>
          <div className="mb-6 flex items-center gap-3">
            <label htmlFor="fav-sort" className="text-white font-bold text-sm">Sort by</label>
            <select
              id="fav-sort"
              className="px-3 py-1.5 rounded-md bg-[#181824] border border-blue-400 text-white text-sm font-bold focus:outline-none focus:ring-2 focus:ring-pink-400"
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
            >
              <option value="title-asc">Title A–Z</option>
              <option value="title-desc">Title Z–A</option>
              <option value="wokeness-desc">Most Woke</option>
              <option value="wokeness-asc">Least Woke</option>
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {contentItems.map((item) => (
              <ClientContentCard key={`${item.contentType}-${item.id}`} content={item} />
            ))}
          </div>
          </>
        )}
      </div>
    </div>
  );
}
