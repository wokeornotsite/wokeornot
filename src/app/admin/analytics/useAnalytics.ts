"use client";
import useSWR from 'swr';

export function useAnalytics() {
  const { data, error, isLoading } = useSWR('/api/admin/analytics', fetcher);
  return {
    analytics: data || {},
    isLoading,
    error,
  };
}

async function fetcher(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
}
