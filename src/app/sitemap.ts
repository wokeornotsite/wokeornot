import { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';

// Rebuild the sitemap at most once per day — legitimate crawlers (Google, Bing) hit
// this frequently and each render runs a full prisma.content.findMany scan.
export const revalidate = 86400;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://wokeornot.net';

  // Static legal/info pages use a fixed date so Google doesn't think they change daily
  const STATIC_DATE = new Date('2025-01-01');

  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}/movies`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/tv-shows`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/kids`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/search`, lastModified: STATIC_DATE, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/about`, lastModified: STATIC_DATE, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/contact`, lastModified: STATIC_DATE, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/privacy`, lastModified: STATIC_DATE, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${baseUrl}/terms`, lastModified: STATIC_DATE, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${baseUrl}/cookies`, lastModified: STATIC_DATE, changeFrequency: 'monthly', priority: 0.3 },
  ];

  let contentPages: MetadataRoute.Sitemap = [];
  try {
    const contents = await prisma.content.findMany({
      select: { tmdbId: true, contentType: true, updatedAt: true, reviewCount: true },
    });
    contentPages = contents.map((c) => {
      const segment =
        c.contentType === 'TV_SHOW' ? 'tv-shows' :
        c.contentType === 'KIDS' ? 'kids' :
        'movies';
      const hasReviews = (c.reviewCount ?? 0) > 0;
      return {
        url: `${baseUrl}/${segment}/${c.tmdbId}`,
        lastModified: c.updatedAt ?? new Date(),
        changeFrequency: (hasReviews ? 'weekly' : 'monthly') as const,
        priority: hasReviews ? 0.8 : 0.6,
      };
    });
  } catch {
    // If DB is unreachable, fall back to static pages only
  }

  return [...staticPages, ...contentPages];
}
