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
  title: "WokeOrNot - Rate the Wokeness of Movies and TV Shows",
  description: "Discover and rate the wokeness level of your favorite movies and TV shows. Join our community to share your opinions and see what others think.",
};


import Analytics from './analytics';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta property="og:title" content="WokeOrNot - Rate the Wokeness of Movies and TV Shows" />
        <meta property="og:description" content="Discover and rate the wokeness level of your favorite movies and TV shows. Join our community to share your opinions and see what others think." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://wokeornot.net/" />
        <meta property="og:image" content="https://wokeornot.net/og-image.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="WokeOrNot - Rate the Wokeness of Movies and TV Shows" />
        <meta name="twitter:description" content="Discover and rate the wokeness level of your favorite movies and TV shows. Join our community to share your opinions and see what others think." />
        <meta name="twitter:image" content="https://wokeornot.net/og-image.png" />
        <link rel="canonical" href="https://wokeornot.net/" />
      </head>
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
