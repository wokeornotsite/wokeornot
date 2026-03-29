'use client';
import React, { useEffect, useState } from 'react';
import type { ContentItem } from '@/types';
import { ClientContentCard } from '@/components/ui/client-content-card';
import { ErrorMessage } from '@/components/ui/error-message';
import { Pagination, PaginationInfo } from '@/components/ui/pagination';

const ITEMS_PER_PAGE = 20;

export default function MoviesPage() {
  const [allMovies, setAllMovies] = useState<ContentItem[]>([]);
  const [genres, setGenres] = useState<{ id: number; name: string }[]>([]);
  const [genre, setGenre] = useState('');
  const [year, setYear] = useState('');
  const [language, setLanguage] = useState('');
  const [wokeness, setWokeness] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState('wokeness-desc');

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError('');
      try {
        const params = new URLSearchParams();
        if (genre) params.append('genre', genre);
        if (year) params.append('year', year);
        if (language) params.append('language', language);
        const [moviesRes, genresRes] = await Promise.all([
          fetch(`/api/movies?${params.toString()}`),
          fetch('/api/genres?type=movie'),
        ]);
        const movies = await moviesRes.json();
        const genres = await genresRes.json();
        setAllMovies(movies);
        setGenres(genres);
      } catch {
        setError('Failed to load movies.');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [genre, year, language]);

  useEffect(() => {
    setCurrentPage(1);
  }, [genre, year, language, wokeness, sortBy]);

  const filteredMovies = allMovies.filter(movie => {
    const matchesWokeness = !wokeness ||
      (wokeness === 'low' && movie.wokeScore >= 1 && movie.wokeScore <= 3) ||
      (wokeness === 'medium' && movie.wokeScore >= 4 && movie.wokeScore <= 6) ||
      (wokeness === 'high' && movie.wokeScore >= 7 && movie.wokeScore <= 10);
    return matchesWokeness;
  });

  const sortedMovies = [...filteredMovies].sort((a, b) => {
    switch (sortBy) {
      case 'wokeness-desc': return (b.wokeScore || 0) - (a.wokeScore || 0);
      case 'wokeness-asc': return (a.wokeScore || 0) - (b.wokeScore || 0);
      case 'title-asc': return a.title.localeCompare(b.title);
      case 'title-desc': return b.title.localeCompare(a.title);
      case 'date-desc': return new Date(b.releaseDate || 0).getTime() - new Date(a.releaseDate || 0).getTime();
      case 'date-asc': return new Date(a.releaseDate || 0).getTime() - new Date(b.releaseDate || 0).getTime();
      case 'reviews-desc': return (b.reviewCount || 0) - (a.reviewCount || 0);
      default: return 0;
    }
  });

  const totalPages = Math.ceil(sortedMovies.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedMovies = sortedMovies.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-[#181824] via-[#232946] to-[#181824]">
      {/* Hero */}
      <section className="bg-[#1a1a2e] border-b border-white/10">
        <div className="max-w-5xl mx-auto px-6 py-10 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-3">Movies</h1>
          <p className="text-gray-400 text-lg">Rate and discover movies through a new lens</p>
        </div>
      </section>

      {/* Filter Bar */}
      <div className="mb-8 max-w-7xl mx-auto px-4">
        <form className="bg-[#232946]/80 border border-blue-600/30 rounded-xl shadow-lg px-5 py-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 items-end">
            <div className="flex flex-col gap-1">
              <label htmlFor="genre" className="text-blue-300 text-xs font-semibold uppercase tracking-wide">Genre</label>
              <select
                id="genre"
                className="w-full px-2 py-2 rounded-lg bg-[#181824] border border-blue-400/60 text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-pink-400"
                value={genre}
                onChange={e => setGenre(e.target.value)}
              >
                <option value="">All Genres</option>
                {genres.map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="year" className="text-blue-300 text-xs font-semibold uppercase tracking-wide">Year</label>
              <select
                id="year"
                className="w-full px-2 py-2 rounded-lg bg-[#181824] border border-blue-400/60 text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-pink-400"
                value={year}
                onChange={e => setYear(e.target.value)}
              >
                <option value="">All Years</option>
                {Array.from({ length: 30 }, (_, i) => new Date().getFullYear() - i).map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="language" className="text-blue-300 text-xs font-semibold uppercase tracking-wide">Language</label>
              <select
                id="language"
                className="w-full px-2 py-2 rounded-lg bg-[#181824] border border-blue-400/60 text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-pink-400"
                value={language}
                onChange={e => setLanguage(e.target.value)}
              >
                <option value="en">English</option>
                <option value="">All Languages</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
                <option value="ja">Japanese</option>
                <option value="ko">Korean</option>
                <option value="zh">Chinese</option>
                <option value="hi">Hindi</option>
                <option value="ru">Russian</option>
                <option value="it">Italian</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="wokeness" className="text-blue-300 text-xs font-semibold uppercase tracking-wide">Wokeness</label>
              <select
                id="wokeness"
                className="w-full px-2 py-2 rounded-lg bg-[#181824] border border-blue-400/60 text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-pink-400"
                value={wokeness}
                onChange={e => setWokeness(e.target.value)}
              >
                <option value="">All Levels</option>
                <option value="low">Not Woke (1-3)</option>
                <option value="medium">Moderately Woke (4-6)</option>
                <option value="high">Very Woke (7-10)</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="sort" className="text-blue-300 text-xs font-semibold uppercase tracking-wide">Sort By</label>
              <select
                id="sort"
                className="w-full px-2 py-2 rounded-lg bg-[#181824] border border-blue-400/60 text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-pink-400"
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
              >
                <option value="wokeness-desc">Most Woke</option>
                <option value="wokeness-asc">Least Woke</option>
                <option value="title-asc">Title A-Z</option>
                <option value="title-desc">Title Z-A</option>
                <option value="date-desc">Newest First</option>
                <option value="date-asc">Oldest First</option>
                <option value="reviews-desc">Most Reviews</option>
              </select>
            </div>
            <div className="flex flex-col gap-1 justify-end">
              <label className="text-transparent text-xs select-none">Reset</label>
              <button
                type="button"
                className="w-full px-3 py-2 rounded-lg bg-gradient-to-r from-pink-500 to-blue-500 text-white text-sm font-bold shadow hover:from-blue-500 hover:to-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-400 transition-all"
                onClick={() => { setGenre(''); setYear(''); setLanguage(''); setWokeness(''); setSortBy('wokeness-desc'); }}
              >
                Reset
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Movies Grid with glassy overlay */}
      <div className="relative max-w-7xl mx-auto px-4 pb-12">
        <div className="absolute inset-0 -z-10 pointer-events-none">
          <div className="w-full h-full bg-gradient-to-br from-pink-900/20 via-blue-900/20 to-purple-900/20 opacity-80 blur-2xl animate-gradient-x" aria-hidden="true" />
        </div>
        {error && <ErrorMessage message={error} className="mb-4" />}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {[...Array(10)].map((_, i) => (
              <ClientContentCard key={i} loading />
            ))}
          </div>
        ) : (
          <>
            {filteredMovies.length === 0 ? (
              <div className="text-center text-blue-200 text-lg mt-8">No results found. Try a different filter.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {paginatedMovies.map(movie => (
                  <ClientContentCard key={movie.id} content={movie} />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Pagination */}
      {sortedMovies.length > 0 && (
        <div className="mt-8 space-y-4">
          <PaginationInfo
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={sortedMovies.length}
            itemsPerPage={ITEMS_PER_PAGE}
            className="text-center"
          />
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );
}
