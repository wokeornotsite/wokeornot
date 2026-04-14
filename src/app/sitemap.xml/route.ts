import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Never pre-render at build time — the response is 37+ MB which exceeds
// Vercel's 19 MB ISR fallback limit. Instead, the CDN caches the response
// for 24 hours via Cache-Control, achieving the same cost reduction.
export const dynamic = 'force-dynamic';

const BASE_URL = 'https://wokeornot.net';
const STATIC_DATE = '2025-01-01';

function toXmlDate(d: Date | string | null | undefined): string {
  if (!d) return STATIC_DATE;
  const date = d instanceof Date ? d : new Date(d);
  return isNaN(date.getTime()) ? STATIC_DATE : date.toISOString().slice(0, 10);
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function urlEntry(url: string, lastMod: string, changeFreq: string, priority: string): string {
  return `  <url>\n    <loc>${escapeXml(url)}</loc>\n    <lastmod>${lastMod}</lastmod>\n    <changefreq>${changeFreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
}

export async function GET() {
  const today = new Date().toISOString().slice(0, 10);

  const staticEntries = [
    urlEntry(BASE_URL, today, 'daily', '1.0'),
    urlEntry(`${BASE_URL}/movies`, today, 'daily', '0.9'),
    urlEntry(`${BASE_URL}/tv-shows`, today, 'daily', '0.9'),
    urlEntry(`${BASE_URL}/kids`, today, 'daily', '0.8'),
    urlEntry(`${BASE_URL}/search`, STATIC_DATE, 'weekly', '0.7'),
    urlEntry(`${BASE_URL}/about`, STATIC_DATE, 'monthly', '0.5'),
    urlEntry(`${BASE_URL}/contact`, STATIC_DATE, 'monthly', '0.5'),
    urlEntry(`${BASE_URL}/privacy`, STATIC_DATE, 'monthly', '0.3'),
    urlEntry(`${BASE_URL}/terms`, STATIC_DATE, 'monthly', '0.3'),
    urlEntry(`${BASE_URL}/cookies`, STATIC_DATE, 'monthly', '0.3'),
  ];

  let contentEntries: string[] = [];
  try {
    const contents = await prisma.content.findMany({
      select: { tmdbId: true, contentType: true, updatedAt: true, reviewCount: true },
    });
    contentEntries = contents.map((c) => {
      const segment =
        c.contentType === 'TV_SHOW' ? 'tv-shows' :
        c.contentType === 'KIDS' ? 'kids' :
        'movies';
      const hasReviews = (c.reviewCount ?? 0) > 0;
      return urlEntry(
        `${BASE_URL}/${segment}/${c.tmdbId}`,
        toXmlDate(c.updatedAt),
        hasReviews ? 'weekly' : 'monthly',
        hasReviews ? '0.8' : '0.6',
      );
    });
  } catch {
    // If DB is unreachable, return static pages only
  }

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...staticEntries,
    ...contentEntries,
    '</urlset>',
  ].join('\n');

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=172800',
    },
  });
}
