"use client";
import React from "react";
import TrendingCarousel from "@/components/ui/trending-carousel";

export default function TrendingSection() {
  const [trendingMovies, setTrendingMovies] = React.useState<any[]>([]);
  const [trendingTV, setTrendingTV] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function fetchTrending() {
      try {
        setLoading(true);
        setError(null);
        
        const [moviesRes, tvRes] = await Promise.all([
          fetch('/api/trending?type=movie'),
          fetch('/api/trending?type=tv')
        ]);
        
        if (!moviesRes.ok || !tvRes.ok) {
          throw new Error('Failed to fetch trending content');
        }
        
        const movies = await moviesRes.json();
        const tv = await tvRes.json();
        
        setTrendingMovies(movies.results || []);
        setTrendingTV(tv.results || []);
      } catch (err) {
        console.error('Error fetching trending content:', err);
        setError('Unable to load trending content. Please try again later.');
      } finally {
        setLoading(false);
      }
    }
    fetchTrending();
  }, []);

  if (error) {
    return (
      <section className="py-10 bg-[#0f0f1a]">
        <div className="container mx-auto px-4">
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6 text-center">
            <h3 className="text-xl font-semibold text-red-400 mb-2">Error Loading Trending Content</h3>
            <p className="text-red-200">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </section>
    );
  }

  if (loading) {
    return (
      <section className="py-10 bg-[#0f0f1a]">
        <div className="container mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-white/10 rounded w-48 mb-4"></div>
            <div className="h-64 bg-white/5 rounded"></div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-10 bg-[#0f0f1a]">
      <div className="container mx-auto px-4">
        {trendingMovies.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">Trending Movies</h2>
            <div className="w-full">
              <TrendingCarousel 
                items={trendingMovies}
                type="movie"
                wokeScores={Object.fromEntries(trendingMovies.filter((item: any) => typeof item.wokeScore === 'number').map((item: any) => [item.id, item.wokeScore]))}
              />
            </div>
          </div>
        )}
        {trendingTV.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Trending TV Shows</h2>
            <div className="w-full">
              <TrendingCarousel 
                items={trendingTV}
                type="tv"
                wokeScores={Object.fromEntries(trendingTV.filter((item: any) => typeof item.wokeScore === 'number').map((item: any) => [item.id, item.wokeScore]))}
              />
            </div>
          </div>
        )}
        {trendingMovies.length === 0 && trendingTV.length === 0 && (
          <div className="text-center text-gray-400 py-8">
            <p>No trending content available at the moment.</p>
          </div>
        )}
      </div>
    </section>
  );
}
