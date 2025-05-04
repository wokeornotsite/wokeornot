/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'image.tmdb.org',
        port: '',
        pathname: '/t/p/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Disable static optimization to fix useSearchParams Vercel build error
  output: 'standalone',
  staticPageGenerationTimeout: 1000,
  experimental: {
    // Explicitly disable static rendering for pages using client hooks like useSearchParams
    appDir: true,
    serverActions: true
  }
};

module.exports = nextConfig;
