'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import posthog from 'posthog-js';

export function PostHogUserIdentifier() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      const user = session.user as { id?: string; email?: string | null; name?: string | null };
      if (user.id) {
        posthog.identify(user.id, {
          email: user.email ?? undefined,
          name: user.name ?? undefined,
        });
      }
    } else if (status === 'unauthenticated') {
      posthog.reset();
    }
  }, [status, session]);

  return null;
}
