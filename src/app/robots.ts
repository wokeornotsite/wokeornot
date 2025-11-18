import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/admin/', '/favorites/'],
      },
    ],
    sitemap: 'https://wokeornot.net/sitemap.xml',
  };
}
