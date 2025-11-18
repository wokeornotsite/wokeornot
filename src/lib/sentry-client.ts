/**
 * Sentry Client-Side Configuration
 * 
 * To enable Sentry error tracking:
 * 1. npm install @sentry/nextjs
 * 2. Add NEXT_PUBLIC_SENTRY_DSN to .env.local
 * 3. Uncomment the code below
 */

/*
import * as Sentry from '@sentry/nextjs';

if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NODE_ENV,
    
    // Performance monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    
    // Session replay
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    
    // Filter out specific errors
    beforeSend(event, hint) {
      // Don't send auth errors to Sentry
      if (event.exception?.values?.[0]?.value?.includes('Unauthorized')) {
        return null;
      }
      return event;
    },
    
    // Additional context
    integrations: [
      new Sentry.BrowserTracing(),
      new Sentry.Replay({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
  });
}
*/

// Export a no-op function when Sentry is not configured
export const captureException = (error: Error) => {
  console.error('Error (Sentry not configured):', error);
};

export const captureMessage = (message: string) => {
  console.log('Message (Sentry not configured):', message);
};
