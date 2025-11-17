'use client';

import { SessionProvider } from 'next-auth/react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { ErrorBoundary, PageErrorFallback } from '@/components/error-boundary';
import { SkipLink } from '@/components/ui/skip-link';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ErrorBoundary>
        <SkipLink />
        <Navbar />
        <main id="main-content" className="flex-grow" role="main">
          <ErrorBoundary fallback={PageErrorFallback}>
            {children}
          </ErrorBoundary>
        </main>
        <Footer />
      </ErrorBoundary>
    </SessionProvider>
  );
}
