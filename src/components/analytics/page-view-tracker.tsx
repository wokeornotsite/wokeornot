'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { trackPageView } from '@/lib/analytics';

/**
 * PageViewTracker Component
 * 
 * Automatically tracks page views when the route changes
 * Add this component to your root layout
 */
export function PageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (pathname) {
      const url = searchParams?.toString() 
        ? `${pathname}?${searchParams.toString()}`
        : pathname;
      
      trackPageView(url);
    }
  }, [pathname, searchParams]);

  return null;
}
