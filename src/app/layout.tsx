import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import ClientLayout from '@/components/layout/client-layout';
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col bg-background text-text font-sans text-base leading-relaxed`}
      >
        <AccessibilityAnnouncer />
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
