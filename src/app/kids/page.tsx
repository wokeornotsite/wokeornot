'use client';
import React, { useEffect, useState } from 'react';
import type { ContentItem } from '@/types';
import { ClientContentCard } from '@/components/ui/client-content-card';
import { ErrorMessage } from '@/components/ui/error-message';

export default function KidsPage() {
  const [allKids, setAllKids] = useState<ContentItem[]>([]);
  const [genres, setGenres] = useState<{ id: number; name: string }[]>([]);
  const [genre, setGenre] = useState('');
  const [year, setYear] = useState('');
  const [language, setLanguage] = useState('en'); // Default to English
  const [wokeness, setWokeness] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError('');
      try {
        const params = new URLSearchParams();
        if (genre) params.append('genre', genre);
        if (year) params.append('year', year);
        if (language) params.append('language', language);
        const [kidsRes, genresRes] = await Promise.all([
          fetch(`/api/kids?${params.toString()}`),
          fetch('/api/genres?type=movie'),
        ]);
        const kids = await kidsRes.json();
        const genres = await genresRes.json();
        setAllKids(kids);
        setGenres(genres);
      } catch {
        setError('Failed to load kids content.');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [genre, year, language]);

  const filteredKids = allKids.filter(content => {
    const matchesWokeness = !wokeness || 
      (wokeness === 'low' && content.wokeScore >= 1 && content.wokeScore <= 3) ||
      (wokeness === 'medium' && content.wokeScore >= 4 && content.wokeScore <= 6) ||
      (wokeness === 'high' && content.wokeScore >= 7 && content.wokeScore <= 10);
    return matchesWokeness;
  });

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-[#181824] via-[#232946] to-[#181824]">
      <section className="relative w-full flex flex-col items-center justify-center py-16 mb-10">
        <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-pink-900/60 via-blue-900/60 to-purple-900/60 blur-2xl animate-gradient-x z-0" aria-hidden="true" />
        <div className="relative z-10 max-w-3xl mx-auto px-6 py-12 rounded-3xl backdrop-blur-2xl bg-white/10 border border-white/20 shadow-2xl flex flex-col items-center text-center">
          <h1 className="text-5xl md:text-6xl font-extrabold bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 bg-clip-text text-transparent drop-shadow-lg mb-4 animate-fadeIn">Kids & Family</h1>
          <p className="text-lg md:text-xl text-blue-200 mb-3 animate-fadeIn delay-100">Discover family-friendly movies and shows through a new lens.</p>
          <div className="flex flex-wrap gap-2 items-center justify-center animate-fadeIn delay-200">
            <span className="px-3 py-1 rounded-full bg-gradient-to-r from-pink-500 to-blue-500 text-white text-xs font-bold shadow">Cinematic</span>
            <span className="px-3 py-1 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs font-bold shadow">Glassmorphism</span>
            <span className="px-3 py-1 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold shadow">Modern UI</span>
          </div>
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
          <button
            type="button"
            className="ml-2 px-3 py-1 rounded-md bg-gradient-to-r from-pink-500 to-blue-500 text-white text-xs font-bold shadow hover:from-blue-500 hover:to-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-400"
            onClick={() => { setGenre(''); setYear(''); setWokeness(''); }}
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
            {filteredKids.length === 0 ? (
              <div className="text-center text-blue-200 text-lg mt-8">No results found. Try a different filter.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {filteredKids.map(content => (
                  <ClientContentCard key={content.tmdbId} content={content} path="/kids" />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Pagination */}
      <div className="mt-8 flex justify-center">
        <nav className="inline-flex rounded-2xl shadow-xl backdrop-blur-xl bg-white/10 border border-white/20">
          <a
            href="#"
            className="px-5 py-3 rounded-l-2xl text-base font-semibold text-blue-200 hover:bg-gradient-to-r hover:from-pink-500 hover:to-blue-500 hover:text-white focus:outline-none focus:ring-2 focus:ring-pink-400 transition-all duration-200"
          >
            Previous
          </a>
          <a
            href="#"
            className="px-5 py-3 text-base font-semibold text-blue-200 hover:bg-gradient-to-r hover:from-pink-500 hover:to-blue-500 hover:text-white focus:outline-none focus:ring-2 focus:ring-pink-400 transition-all duration-200"
          >
            1
          </a>
          <a
            href="#"
            className="px-5 py-3 text-base font-semibold text-blue-200 hover:bg-gradient-to-r hover:from-pink-500 hover:to-blue-500 hover:text-white focus:outline-none focus:ring-2 focus:ring-pink-400 transition-all duration-200"
          >
            2
          </a>
          <a
            href="#"
            className="px-5 py-3 text-base font-semibold text-blue-200 hover:bg-gradient-to-r hover:from-pink-500 hover:to-blue-500 hover:text-white focus:outline-none focus:ring-2 focus:ring-pink-400 transition-all duration-200"
          >
            3
          </a>
          <span className="px-5 py-3 text-base font-semibold text-blue-200">...</span>
          <a
            href="#"
            className="px-5 py-3 rounded-r-2xl text-base font-semibold text-blue-200 hover:bg-gradient-to-r hover:from-pink-500 hover:to-blue-500 hover:text-white focus:outline-none focus:ring-2 focus:ring-pink-400 transition-all duration-200"
          >
            Next
          </a>
        </nav>
      </div>
    </div>
  );
}
