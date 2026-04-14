'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import posthog from 'posthog-js';
import type { ContentItem } from '@/types';
import { ClientContentCard } from '@/components/ui/client-content-card';
import { ErrorMessage } from '@/components/ui/error-message';

interface Suggestion {
  tmdbId: number;
  title: string;
  year: string;
  type: 'movie' | 'tv';
  posterPath: string | null;
}

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
      const results = data.results as ContentItem[];
      try {
        posthog.capture('content_searched', {
          query,
          media_type: mediaType || 'all',
          genre_filter: genre || undefined,
          year_filter: year || undefined,
          wokeness_filter: wokeness || undefined,
          result_count: results.length,
        });
      } catch {}
      return results;
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
    async function fetchFilters() {
      try {
        const [movieRes, tvRes] = await Promise.all([
          fetch('/api/genres?type=movie'),
          fetch('/api/genres?type=tv'),
        ]);
        const movieGenres = await movieRes.json();
        const tvGenres = await tvRes.json();
        const all = [...movieGenres, ...tvGenres];
        const deduped = Array.from(new Map(all.map((g: any) => [g.id, g])).values());
        setGenres([{ id: 0, name: 'All Genres' }, ...deduped]);
      } catch {}
    }
    fetchFilters();
  }, []);

  const [query, setQuery] = useState('');
  const [genre, setGenre] = useState('');
  const [year, setYear] = useState('');
  const [wokeness, setWokeness] = useState('');
  const [mediaType, setMediaType] = useState('');
  const [results, setResults] = useState<ContentItem[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Autocomplete state
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch suggestions with debounce
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search/suggestions?query=${encodeURIComponent(query)}`);
        const data = await res.json();
        setSuggestions(data.suggestions || []);
        setShowSuggestions((data.suggestions || []).length > 0);
        setHighlightedIndex(-1);
      } catch {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  // Close suggestions on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const runSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery) return;
    setLoading(true);
    setError('');
    setShowSuggestions(false);
    try {
      const res = await searchContent(searchQuery, genre, year, wokeness, mediaType);
      setResults(res);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch results.');
    } finally {
      setLoading(false);
    }
  }, [genre, year, wokeness, mediaType]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    await runSearch(query);
  };

  const handleSuggestionSelect = (suggestion: Suggestion) => {
    setQuery(suggestion.title);
    setShowSuggestions(false);
    runSearch(suggestion.title);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(i => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(i => Math.max(i - 1, -1));
    } else if (e.key === 'Enter' && highlightedIndex >= 0) {
      e.preventDefault();
      handleSuggestionSelect(suggestions[highlightedIndex]);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setHighlightedIndex(-1);
    }
  };

  const displayedResults = results;

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
            {/* Search input with autocomplete */}
            <div className="flex-1 relative" ref={containerRef}>
              <input
                type="text"
                placeholder="Search for a title..."
                className="w-full px-5 py-3 rounded-xl bg-gray-900/70 border border-blue-400 text-white placeholder-white/80 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-400 transition-all duration-200 shadow-inner text-lg font-semibold"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                aria-label="Search for a title"
                autoComplete="off"
              />
              {/* Suggestions dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <ul className="absolute left-0 right-0 top-full mt-1 bg-[#1a1a2e] border border-blue-500/40 rounded-xl shadow-2xl z-50 overflow-hidden">
                  {suggestions.map((s, idx) => (
                    <li
                      key={`${s.type}-${s.tmdbId}`}
                      className={`flex items-center gap-3 px-4 py-2 cursor-pointer transition-colors ${idx === highlightedIndex ? 'bg-blue-800/60' : 'hover:bg-white/10'}`}
                      onMouseDown={() => handleSuggestionSelect(s)}
                      onMouseEnter={() => setHighlightedIndex(idx)}
                    >
                      {s.posterPath ? (
                        <Image
                          src={`https://image.tmdb.org/t/p/w92${s.posterPath}`}
                          alt={s.title}
                          width={32}
                          height={48}
                          className="rounded object-cover flex-shrink-0"
                          unoptimized
                        />
                      ) : (
                        <div className="w-8 h-12 rounded bg-gray-700 flex-shrink-0" />
                      )}
                      <div className="flex flex-col min-w-0">
                        <span className="text-white font-semibold text-sm truncate">{s.title}</span>
                        <span className="text-gray-400 text-xs">{s.year}</span>
                      </div>
                      <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${s.type === 'movie' ? 'bg-blue-700/60 text-blue-200' : 'bg-purple-700/60 text-purple-200'}`}>
                        {s.type === 'movie' ? 'Movie' : 'TV'}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
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
        {displayedResults && displayedResults.length === 0 && !loading && (
          <div className="text-center text-blue-200 py-8 text-xl">
            No results found. Check your spelling or try a different search.
          </div>
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
        {!loading && displayedResults && displayedResults.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 py-8">
            {displayedResults.map(item => (
              <ClientContentCard key={item.id} content={item} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
