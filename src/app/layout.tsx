import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import ClientLayout from '@/components/layout/client-layout';
import MUIProvider from '@/components/theme/MUIProvider';
import "./globals.css";
import { AccessibilityAnnouncer } from '@/components/ui/accessibility-announcer';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://wokeornot.net'),
  title: {
    default: 'WokeOrNot - Rate the Wokeness of Movies and TV Shows',
    template: '%s | WokeOrNot',
  },
  description:
    'Discover and rate the wokeness level of your favorite movies and TV shows. Join our community to share your opinions and see what others think.',
  keywords: [
    'woke',
    'wokeness',
    'movies',
    'tv shows',
    'ratings',
    'reviews',
    'family',
    'kids',
  ],
  openGraph: {
    type: 'website',
    url: 'https://wokeornot.net/',
    siteName: 'WokeOrNot',
    title: 'WokeOrNot - Rate the Wokeness of Movies and TV Shows',
    description:
      'Discover and rate the wokeness level of your favorite movies and TV shows. Join our community to share your opinions and see what others think.',
    images: [
      {
        url: 'https://wokeornot.net/og-image.png',
        width: 1200,
        height: 630,
        alt: 'WokeOrNot',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'WokeOrNot - Rate the Wokeness of Movies and TV Shows',
    description:
      'Discover and rate the wokeness level of your favorite movies and TV shows. Join our community to share your opinions and see what others think.',
    images: ['https://wokeornot.net/og-image.png'],
  },
  alternates: {
    canonical: 'https://wokeornot.net/',
  },
  robots: {
    index: true,
    follow: true,
  },
};


import Analytics from './analytics';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head />
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col bg-background text-text font-sans text-base leading-relaxed`}
      >
        <AccessibilityAnnouncer />
        <MUIProvider>
          <ClientLayout>{children}</ClientLayout>
        </MUIProvider>
        <Analytics />
      </body>
    </html>
  );
}
