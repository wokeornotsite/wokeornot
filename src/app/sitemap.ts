import { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';

// Force dynamic so Vercel doesn't try to pre-render and cache this as an ISR page
// (the full content list easily exceeds the 19MB ISR size limit)
export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://wokeornot.net';

  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}/movies`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/tv-shows`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/kids`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/search`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/privacy`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${baseUrl}/terms`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${baseUrl}/cookies`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
  ];

  let contentPages: MetadataRoute.Sitemap = [];
  try {
    // Only include content that has been rated — keeps the sitemap lean
    // and ensures search engines only index pages with real community data
    const contents = await prisma.content.findMany({
      where: { reviewCount: { gt: 0 } },
      select: { tmdbId: true, contentType: true, updatedAt: true },
    });
    contentPages = contents.map((c) => {
      const segment =
        c.contentType === 'TV_SHOW' ? 'tv-shows' :
        c.contentType === 'KIDS' ? 'kids' :
        'movies';
      return {
        url: `${baseUrl}/${segment}/${c.tmdbId}`,
        lastModified: c.updatedAt ?? new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      };
    });
  } catch {
    // If DB is unreachable, fall back to static pages only
  }

  return [...staticPages, ...contentPages];
}
