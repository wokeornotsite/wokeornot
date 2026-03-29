'use client';
import React, { useState } from 'react';
import type { ContentItem } from '@/types';
import { ClientContentCard } from '@/components/ui/client-content-card';
import { ErrorMessage } from '@/components/ui/error-message';

async function searchContent(query: string, genre: string, year: string, wokeness: string, mediaType: string): Promise<ContentItem[]> {
  if (!query) return [];
  try {
    const params = new URLSearchParams({ query });
    if (genre) params.append('genre', genre);
    if (year) params.append('year', year);
    if (wokeness) params.append('wokeness', wokeness);
    if (mediaType) params.append('mediaType', mediaType);
    const res = await fetch(`/api/search?${params.toString()}`);
    const data = await res.json();
    if (res.ok) {
      return data.results as ContentItem[];
    } else {
      throw new Error(data.error || 'Failed to fetch results.');
    }
  } catch (err: any) {
    throw new Error(err?.message || 'Failed to fetch results.');
  }
}


export default function SearchPage() {
  const [genres, setGenres] = React.useState<{ id: number, name: string }[]>([]);
  React.useEffect(() => {
    async function fetchGenres() {
      try {
        const movieRes = await fetch('/api/genres?type=movie');
        const tvRes = await fetch('/api/genres?type=tv');
        const movieGenres = await movieRes.json();
        const tvGenres = await tvRes.json();
        // Merge and dedupe
        const all = [...movieGenres, ...tvGenres];
        const deduped = Array.from(new Map(all.map(g => [g.id, g])).values());
        setGenres([{ id: 0, name: 'All Genres' }, ...deduped]);
      } catch {}
    }
    fetchGenres();
  }, []);
  const [query, setQuery] = useState('');
  const [genre, setGenre] = useState('');
  const [year, setYear] = useState('');
  const [wokeness, setWokeness] = useState('');
  const [mediaType, setMediaType] = useState('');
  const [results, setResults] = useState<ContentItem[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Unified filter change handler
  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { id, value } = e.target;
    if (id === 'genre') setGenre(value);
    if (id === 'year') setYear(value);
    if (id === 'wokeness') setWokeness(value);
    if (id === 'mediaType') setMediaType(value);
  };

  // Instant search on filter change
  React.useEffect(() => {
    if (query) {
      setLoading(true);
      setError('');
      searchContent(query, genre, year, wokeness, mediaType)
        .then(res => setResults(res))
        .catch(err => setError(err.message || 'Failed to fetch results.'))
        .finally(() => setLoading(false));
    }
  }, [genre, year, wokeness, mediaType]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await searchContent(query, genre, year, wokeness, mediaType);
      setResults(res);
    } catch (err: any) {
      let message = 'Failed to fetch results.';
      if (typeof err === 'object' && err !== null && 'message' in err && typeof err.message === 'string') {
        message = err.message;
      }
      setError(message);
      // eslint-disable-next-line no-console
      console.error('TMDb Search Error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-[#181824] via-[#232946] to-[#181824]">
      {/* Hero */}
      <section className="bg-[#1a1a2e] border-b border-white/10">
        <div className="max-w-5xl mx-auto px-6 py-10 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-3">Search</h1>
          <p className="text-gray-400 text-lg">Find any movie, show, or kids content</p>
        </div>
      </section>

      {/* Search Bar and Filters */}
      <form onSubmit={handleSearch} className="mb-12 max-w-5xl mx-auto px-4">
        <div className="backdrop-blur-2xl bg-white/10 border border-white/20 rounded-2xl shadow-xl p-8 flex flex-col gap-6">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <input
              type="text"
              placeholder="Search for a title..."
              className="flex-1 px-5 py-3 rounded-xl bg-gray-900/70 border border-blue-400 text-white placeholder-white/80 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-400 transition-all duration-200 shadow-inner text-lg font-semibold"
              value={query}
              onChange={e => setQuery(e.target.value)}
              aria-label="Search for a title"
            />
            <select
              id="mediaType"
              className="px-3 py-2 rounded-lg bg-gray-900/70 border border-blue-400 text-white focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-400 transition-all duration-200 shadow-inner font-semibold"
              value={mediaType}
              onChange={e => setMediaType(e.target.value)}
              aria-label="Media Type"
            >
              <option value="">All Types</option>
              <option value="movie">Movies</option>
              <option value="tv">TV Shows</option>
              <option value="kids">Kids/Family</option>
            </select>
            <button
              type="submit"
              className="px-7 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-blue-500 text-white font-semibold text-lg shadow hover:from-blue-500 hover:to-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-400 transition-all duration-200"
              disabled={loading}
              aria-label="Search"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label htmlFor="genre" className="block text-sm font-semibold text-blue-200 mb-2">Genre</label>
              <select
                id="genre"
                className="w-full px-3 py-2 rounded-lg bg-gray-900/70 border border-blue-400 text-white placeholder-white/80 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-400 transition-all duration-200 shadow-inner font-semibold"
                value={genre}
                onChange={handleFilterChange}
              >
                {genres.map((g: { id: number, name: string }) => (
                  <option key={g.id} value={g.id === 0 ? '' : g.id}>{g.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="year" className="block text-sm font-semibold text-blue-200 mb-2">Release Year</label>
              <select
                id="year"
                className="w-full px-3 py-2 rounded-lg bg-gray-900/70 border border-blue-400 text-white placeholder-white/80 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-400 transition-all duration-200 shadow-inner font-semibold"
                value={year}
                onChange={e => setYear(e.target.value)}
              >
                <option value="">All Years</option>
                {Array.from({ length: 30 }, (_, i) => new Date().getFullYear() - i).map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="wokeness" className="block text-sm font-semibold text-blue-200 mb-2">Wokeness Level</label>
              <select
                id="wokeness"
                className="w-full px-3 py-2 rounded-lg bg-gray-900/70 border border-blue-400 text-white placeholder-white/80 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-400 transition-all duration-200 shadow-inner font-semibold"
                value={wokeness}
                onChange={handleFilterChange}
              >
                <option value="">All Levels</option>
                <option value="low">Not Woke (1-3)</option>
                <option value="medium">Moderately Woke (4-6)</option>
                <option value="high">Very Woke (7-10)</option>
              </select>
            </div>
          </div>
        </div>
      </form>

      {/* Results Grid */}
      <section className="max-w-5xl mx-auto px-4">
        {error && <ErrorMessage message={error} />}
        {results === null && !loading && (
          <div className="text-center text-blue-200 py-8 text-xl">
            Enter a title above to search movies, shows, and more.
          </div>
        )}
        {results && results.length === 0 && !loading && (
          <div className="text-center text-blue-200 py-8 text-xl">No results found. Try a different search.</div>
        )}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 py-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl bg-gray-800/70 h-72 animate-pulse shadow-lg flex flex-col">
                <div className="flex-1 bg-gray-700/60 rounded-t-2xl mb-4" />
                <div className="px-4 pb-4">
                  <div className="h-4 w-2/3 bg-gray-700/40 rounded mb-2" />
                  <div className="h-3 w-1/2 bg-gray-700/30 rounded mb-1" />
                  <div className="h-3 w-1/3 bg-gray-700/20 rounded" />
                </div>
              </div>
            ))}
          </div>
        )}
        {!loading && results && results.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 py-8">
            {results.map(item => (
              <ClientContentCard key={item.id} content={item} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
