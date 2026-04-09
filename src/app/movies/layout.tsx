import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Non-Woke & Woke Movies Rated by the Community | WokeOrNot',
  description: 'Browse thousands of movies rated for wokeness by real viewers. Find the least woke movies, most woke films, and everything in between. Filter by genre, year, and woke level.',
  openGraph: {
    title: 'Non-Woke & Woke Movies Rated by the Community | WokeOrNot',
    description: 'Browse thousands of movies rated for wokeness by real viewers. Find the least woke movies, most woke films, and everything in between.',
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
