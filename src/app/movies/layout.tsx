import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Movies',
  description: 'Browse and rate the wokeness of the latest and most popular movies. Filter by genre, year, language, and wokeness level.',
  openGraph: {
    title: 'Movies | WokeOrNot',
    description: 'Browse and rate the wokeness of the latest and most popular movies.',
    url: 'https://wokeornot.net/movies',
  },
  alternates: {
    canonical: 'https://wokeornot.net/movies',
  },
};

export default function MoviesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
