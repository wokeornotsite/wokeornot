import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Search Wokeness Ratings — Look Up Any Movie or TV Show | WokeOrNot',
  description: 'Search for any movie or TV show to see its wokeness rating and community reviews. Find out if your next watch is woke or not.',
  openGraph: {
    title: 'Search Wokeness Ratings — Look Up Any Movie or TV Show | WokeOrNot',
    description: 'Search for any movie or TV show to see its wokeness rating and community reviews.',
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
