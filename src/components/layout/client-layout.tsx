'use client';

import { SessionProvider } from 'next-auth/react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { ErrorBoundary, PageErrorFallback } from '@/components/error-boundary';
import { SkipLink } from '@/components/ui/skip-link';
import { PageViewTracker } from '@/components/analytics/page-view-tracker';
import { PostHogUserIdentifier } from '@/components/analytics/posthog-user-identifier';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ErrorBoundary>
        <PageViewTracker />
        <PostHogUserIdentifier />
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
