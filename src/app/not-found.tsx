import React from 'react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0f0f1a] flex flex-col items-center justify-center text-white px-6">
      <div className="text-center max-w-lg">
        <h1 className="text-8xl md:text-9xl font-extrabold bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent drop-shadow-lg mb-4">
          404
        </h1>
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
          Page Not Found
        </h2>
        <p className="text-gray-400 mb-10 text-lg">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="px-6 py-3 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-semibold shadow-lg hover:shadow-purple-500/20 transition-all duration-300 hover:-translate-y-0.5"
          >
            Go Home
          </Link>
          <Link
            href="/movies"
            className="px-6 py-3 rounded-lg bg-white/10 border border-white/20 text-white font-semibold hover:bg-white/20 transition-all duration-300 hover:-translate-y-0.5"
          >
            Browse Movies
          </Link>
          <Link
            href="/tv-shows"
            className="px-6 py-3 rounded-lg bg-white/10 border border-white/20 text-white font-semibold hover:bg-white/20 transition-all duration-300 hover:-translate-y-0.5"
          >
            Browse TV Shows
          </Link>
        </div>
      </div>
    </div>
  );
}
