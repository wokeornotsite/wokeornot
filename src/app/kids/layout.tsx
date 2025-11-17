import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Kids & Family',
  description: 'Browse and rate the wokeness of family-friendly movies and TV shows. Find content suitable for kids with wokeness ratings.',
  openGraph: {
    title: 'Kids & Family | WokeOrNot',
    description: 'Browse and rate the wokeness of family-friendly movies and TV shows.',
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
