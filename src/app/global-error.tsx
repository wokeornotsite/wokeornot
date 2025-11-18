'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Critical Error</h1>
            <p className="text-gray-600 mb-6">
              A critical error occurred. Please refresh the page.
            </p>
            <button
              onClick={reset}
              className="px-6 py-3 rounded-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
