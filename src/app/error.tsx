'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('App error:', error);
    }
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#181824] via-[#232946] to-[#181824] p-4">
      <div className="max-w-md w-full bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-8 text-center">
        <div className="mb-6">
          <svg
            className="mx-auto h-16 w-16 text-red-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-white mb-4">Something went wrong!</h1>
        <p className="text-blue-200 mb-6">
          {process.env.NODE_ENV === 'development'
            ? error.message
            : 'An unexpected error occurred. Please try again.'}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="px-6 py-3 rounded-lg font-semibold text-white bg-gradient-to-r from-pink-500 to-blue-500 hover:from-blue-500 hover:to-pink-500 transition-all duration-200 shadow-lg"
          >
            Try Again
          </button>
          <a
            href="/"
            className="px-6 py-3 rounded-lg font-semibold text-white bg-white/20 hover:bg-white/30 transition-all duration-200 border border-white/20"
          >
            Go Home
          </a>
        </div>
      </div>
    </div>
  );
}
