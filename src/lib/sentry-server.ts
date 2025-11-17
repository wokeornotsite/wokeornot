/**
 * Sentry Server-Side Configuration
 * 
 * To enable Sentry error tracking:
 * 1. npm install @sentry/nextjs
 * 2. Add SENTRY_DSN to .env.local
 * 3. Uncomment the code below
 */

/*
import * as Sentry from '@sentry/nextjs';

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    
    // Performance monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    
    // Filter out specific errors
    beforeSend(event, hint) {
      // Don't send database connection errors in development
      if (process.env.NODE_ENV === 'development' && 
          event.exception?.values?.[0]?.value?.includes('ECONNREFUSED')) {
        return null;
      }
      return event;
    },
  });
}
*/

// Export no-op functions when Sentry is not configured
export const captureException = (error: Error, context?: Record<string, any>) => {
  console.error('Server Error (Sentry not configured):', error, context);
};

export const captureMessage = (message: string, level?: 'info' | 'warning' | 'error') => {
  console.log(`Server ${level || 'info'} (Sentry not configured):`, message);
};
