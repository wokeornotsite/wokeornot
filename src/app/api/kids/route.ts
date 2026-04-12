import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getKidsContent } from '@/lib/tmdb';

// Cache for 30 minutes (1800 seconds)
export const revalidate = 1800;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1', 10);

  const data = await getKidsContent(page);

  // Merge real wokeScore and reviewCount from DB (contentType: 'KIDS')
  const tmdbIds = data.results.map((movie: any) => movie.id);
  const dbContents = await prisma.content.findMany({
    where: { tmdbId: { in: tmdbIds }, contentType: 'KIDS' },
    select: { tmdbId: true, wokeScore: true, reviewCount: true }
  });
  const dbMap = Object.fromEntries(dbContents.map((c: any) => [c.tmdbId, c]));

  const results = data.results.map((movie: any) => {
    const db = dbMap[movie.id];
    return {
      ...movie,
      contentType: 'KIDS',
      tmdbId: movie.id,
      wokeScore: db?.wokeScore ?? 0,
      reviewCount: db?.reviewCount ?? 0,
      posterPath: movie.poster_path || null,
      backdropPath: movie.backdrop_path || null
    };
  });
  return NextResponse.json(results, {
    headers: { 'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600' },
  });
}
