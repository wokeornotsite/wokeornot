import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Favorites',
  description: 'View and manage your personal watchlist of movies and TV shows with wokeness ratings.',
  openGraph: {
    title: 'My Favorites | WokeOrNot',
    description: 'Your personal watchlist of movies and TV shows.',
    url: 'https://wokeornot.net/favorites',
  },
  alternates: {
    canonical: 'https://wokeornot.net/favorites',
  },
  robots: {
    index: false, // Don't index personal pages
    follow: true,
  },
};

export default function FavoritesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
