"use client";
import React from "react";
import TrendingCarousel from "@/components/ui/trending-carousel";

export default function TrendingSection() {
  const [trendingMovies, setTrendingMovies] = React.useState<any[]>([]);
  const [trendingTV, setTrendingTV] = React.useState<any[]>([]);

  React.useEffect(() => {
    async function fetchTrending() {
      const moviesRes = await fetch('/api/trending?type=movie');
      const tvRes = await fetch('/api/trending?type=tv');
      const movies = await moviesRes.json();
      const tv = await tvRes.json();
      setTrendingMovies(movies.results);
      setTrendingTV(tv.results);
    }
    fetchTrending();
  }, []);

  return (
    <section className="py-10 bg-[#0f0f1a]">
      <div className="container mx-auto px-4">
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
      </div>
    </section>
  );
}
