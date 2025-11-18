import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Search',
  description: 'Search for movies and TV shows to discover their wokeness ratings and reviews from the community.',
  openGraph: {
    title: 'Search | WokeOrNot',
    description: 'Search for movies and TV shows to discover their wokeness ratings.',
    url: 'https://wokeornot.net/search',
  },
  alternates: {
    canonical: 'https://wokeornot.net/search',
  },
};

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
