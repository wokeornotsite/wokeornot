'use client';
import React, { useEffect, useState } from 'react';
import type { ContentItem } from '@/types';
import { ClientContentCard } from '@/components/ui/client-content-card';
import { ErrorMessage } from '@/components/ui/error-message';
import { Pagination, PaginationInfo } from '@/components/ui/pagination';

const ITEMS_PER_PAGE = 20;

export default function KidsPage() {
  const [allKids, setAllKids] = useState<ContentItem[]>([]);
  const [genres, setGenres] = useState<{ id: number; name: string }[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [genre, setGenre] = useState('');
  const [year, setYear] = useState('');
  const [language, setLanguage] = useState('');
  const [wokeness, setWokeness] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [categoryTmdbIds, setCategoryTmdbIds] = useState<number[] | null>(null);
  const [sortBy, setSortBy] = useState('wokeness-desc');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError('');
      try {
        const params = new URLSearchParams();
        if (genre) params.append('genre', genre);
        if (year) params.append('year', year);
        if (language) params.append('language', language);
        const [kidsRes, genresRes, catsRes] = await Promise.all([
          fetch(`/api/kids?${params.toString()}`),
          fetch('/api/genres?type=movie'),
          fetch('/api/categories'),
        ]);
        const kids = await kidsRes.json();
        const genres = await genresRes.json();
        const cats = await catsRes.json();
        setAllKids(kids);
        setGenres(genres);
        setCategories(Array.isArray(cats) ? cats : []);
      } catch {
        setError('Failed to load kids content.');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [genre, year, language]);

  // Fetch tmdbIds for selected woke category
  useEffect(() => {
    if (!categoryId) { setCategoryTmdbIds(null); return; }
    fetch(`/api/categories/content?categoryId=${encodeURIComponent(categoryId)}&contentType=KIDS`)
      .then(r => r.json())
      .then(data => setCategoryTmdbIds(Array.isArray(data) ? data : null))
      .catch(() => setCategoryTmdbIds(null));
  }, [categoryId]);

  useEffect(() => {
    setCurrentPage(1);
  }, [genre, year, language, wokeness, sortBy, categoryId]);

  const filteredKidsContent = allKids.filter(content => {
    const matchesWokeness = !wokeness ||
      (wokeness === 'low' && content.wokeScore >= 1 && content.wokeScore <= 3) ||
      (wokeness === 'medium' && content.wokeScore >= 4 && content.wokeScore <= 6) ||
      (wokeness === 'high' && content.wokeScore >= 7 && content.wokeScore <= 10);
    const matchesCategory = !categoryTmdbIds || categoryTmdbIds.includes(content.tmdbId);
    return matchesWokeness && matchesCategory;
  });

  const sortedContent = [...filteredKidsContent].sort((a, b) => {
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

  const totalPages = Math.ceil(sortedContent.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedContent = sortedContent.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-[#181824] via-[#232946] to-[#181824]">
      {/* Hero */}
      <section className="bg-[#1a1a2e] border-b border-white/10">
        <div className="max-w-5xl mx-auto px-6 py-10 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-3">Kids & Family</h1>
          <p className="text-gray-400 text-lg">Safe viewing starts with informed choices</p>
        </div>
      </section>

      {/* Elegant Filter Bar */}
      <div className="mb-8 max-w-5xl mx-auto px-2">
        <form className="flex flex-col md:flex-row items-center gap-2 md:gap-4 bg-[#232946]/80 border border-blue-600/30 rounded-xl shadow-lg px-4 py-3">
          <label htmlFor="genre" className="text-white font-bold text-base mr-1">Genre</label>
          <select
            id="genre"
            className="min-w-[120px] px-2 py-1 rounded-md bg-[#181824] border border-blue-400 text-white text-sm font-bold focus:outline-none focus:ring-2 focus:ring-pink-400"
            value={genre}
            onChange={e => setGenre(e.target.value)}
          >
            <option value="">All Genres</option>
            {genres.map((g: { id: number; name: string }) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
          <label htmlFor="year" className="text-white font-bold text-base mr-1">Year</label>
          <select
            id="year"
            className="min-w-[100px] px-2 py-1 rounded-md bg-[#181824] border border-blue-400 text-white text-sm font-bold focus:outline-none focus:ring-2 focus:ring-pink-400"
            value={year}
            onChange={e => setYear(e.target.value)}
          >
            <option value="">All Years</option>
            {Array.from({ length: 30 }, (_, i) => new Date().getFullYear() - i).map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
          <label htmlFor="language" className="text-white font-bold text-base mr-1">Language</label>
          <select
            id="language"
            className="min-w-[120px] px-2 py-1 rounded-md bg-[#181824] border border-blue-400 text-white text-sm font-bold focus:outline-none focus:ring-2 focus:ring-pink-400"
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
          <label htmlFor="wokeness" className="text-white font-bold text-base mr-1">Wokeness</label>
          <select
            id="wokeness"
            className="min-w-[120px] px-2 py-1 rounded-md bg-[#181824] border border-blue-400 text-white text-sm font-bold focus:outline-none focus:ring-2 focus:ring-pink-400"
            value={wokeness}
            onChange={e => setWokeness(e.target.value)}
          >
            <option value="">All Levels</option>
            <option value="low">Not Woke (1-3)</option>
            <option value="medium">Moderately Woke (4-6)</option>
            <option value="high">Very Woke (7-10)</option>
          </select>
          <label htmlFor="sort" className="sr-only">Sort By</label>
          <select
            id="sort"
            className="min-w-[140px] px-2 py-1 rounded-md bg-[#181824] border border-blue-400 text-white text-sm font-bold focus:outline-none focus:ring-2 focus:ring-pink-400"
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
          <label htmlFor="category" className="text-white font-bold text-base mr-1">Woke Reason</label>
          <select
            id="category"
            className="min-w-[140px] px-2 py-1 rounded-md bg-[#181824] border border-blue-400 text-white text-sm font-bold focus:outline-none focus:ring-2 focus:ring-pink-400"
            value={categoryId}
            onChange={e => setCategoryId(e.target.value)}
          >
            <option value="">All Reasons</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <button
            type="button"
            className="ml-2 px-3 py-1 rounded-md bg-gradient-to-r from-pink-500 to-blue-500 text-white text-xs font-bold shadow hover:from-blue-500 hover:to-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-400"
            onClick={() => { setGenre(''); setYear(''); setWokeness(''); setSortBy('wokeness-desc'); setCategoryId(''); }}
          >
            Reset Filters
          </button>
        </form>
      </div>

      {/* Kids Grid with glassy overlay */}
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
            {sortedContent.length === 0 ? (
              <div className="text-center text-blue-200 text-lg mt-8">No results found. Try a different filter.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {paginatedContent.map(content => (
                  <ClientContentCard key={content.id} content={content} />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Pagination */}
      {sortedContent.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 pb-12">
          <div className="mt-8 space-y-4">
            <PaginationInfo
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={sortedContent.length}
              itemsPerPage={ITEMS_PER_PAGE}
              className="text-center"
            />
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        </div>
      )}
    </div>
  );
}
