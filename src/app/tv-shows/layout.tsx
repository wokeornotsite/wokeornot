import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'TV Shows',
  description: 'Browse and rate the wokeness of the latest and most popular TV shows. Filter by genre, year, language, and wokeness level.',
  openGraph: {
    title: 'TV Shows | WokeOrNot',
    description: 'Browse and rate the wokeness of the latest and most popular TV shows.',
    url: 'https://wokeornot.net/tv-shows',
  },
  alternates: {
    canonical: 'https://wokeornot.net/tv-shows',
  },
};

export default function TVShowsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
