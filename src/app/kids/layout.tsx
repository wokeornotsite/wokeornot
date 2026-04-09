import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Is Kids Content Safe? Wokeness Ratings for Children\'s Movies & Shows | WokeOrNot',
  description: 'Find out which kids movies and shows are woke. Community ratings help parents make informed choices about children\'s entertainment. Filter by wokeness level.',
  openGraph: {
    title: 'Is Kids Content Safe? Wokeness Ratings for Children\'s Movies & Shows | WokeOrNot',
    description: 'Find out which kids movies and shows are woke. Community ratings help parents make informed choices about children\'s entertainment.',
    url: 'https://wokeornot.net/kids',
  },
  alternates: {
    canonical: 'https://wokeornot.net/kids',
  },
};

export default function KidsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
