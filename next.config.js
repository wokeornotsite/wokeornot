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
    formats: ['image/webp'],
    minimumCacheTTL: 2678400,
    deviceSizes: [640, 828, 1080],
    imageSizes: [32, 64, 96],
  },
  output: 'standalone',
  staticPageGenerationTimeout: 1000,
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', 'wokeornot.net']
    }
  }
};

module.exports = nextConfig;
