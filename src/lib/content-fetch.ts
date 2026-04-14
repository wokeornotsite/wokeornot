import { cache } from 'react';
import { prisma } from '@/lib/prisma';

// React cache() dedupes calls with identical args within a single request
// (server component tree render). Both generateMetadata and the page's default
// export run in the same request, so sharing these helpers collapses two
// Prisma lookups into one.

export const getMovieContent = cache(async (tmdbId: number) => {
  return prisma.content.findFirst({
    where: { tmdbId, contentType: 'MOVIE' },
  });
});

export const getTVShowContent = cache(async (tmdbId: number) => {
  return prisma.content.findFirst({
    where: { tmdbId, contentType: 'TV_SHOW' },
  });
});

export const getKidsContent = cache(async (tmdbId: number) => {
  return prisma.content.findFirst({
    where: { tmdbId, contentType: 'KIDS' },
  });
});
