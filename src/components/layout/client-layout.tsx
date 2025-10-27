'use client';

import { SessionProvider } from 'next-auth/react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { ErrorBoundary, PageErrorFallback } from '@/components/error-boundary';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ErrorBoundary>
        <Navbar />
        <main className="flex-grow">
          <ErrorBoundary fallback={PageErrorFallback}>
            {children}
          </ErrorBoundary>
        </main>
        <Footer />
      </ErrorBoundary>
    </SessionProvider>
  );
}
