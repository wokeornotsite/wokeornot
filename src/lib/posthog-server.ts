import { PostHog } from 'posthog-node';

let posthogClient: PostHog | null = null;

const noop = new Proxy({} as PostHog, { get: () => () => {} });

export function getPostHogClient(): PostHog {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return noop;
  if (!posthogClient) {
    posthogClient = new PostHog(key, {
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
      flushAt: 1,
      flushInterval: 0,
    });
  }
  return posthogClient;
}
