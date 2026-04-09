import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Non-Woke & Woke TV Shows Rated by the Community | WokeOrNot',
  description: 'Browse TV shows rated for wokeness by real viewers. Find the least woke series, most woke shows, and everything in between. Filter by genre and woke level.',
  openGraph: {
    title: 'Non-Woke & Woke TV Shows Rated by the Community | WokeOrNot',
    description: 'Browse TV shows rated for wokeness by real viewers. Find the least woke series, most woke shows, and everything in between.',
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
