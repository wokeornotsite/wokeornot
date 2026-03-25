"use client";
import useSWR from 'swr';

export function useAnalytics(days?: number) {
  const key = days && days !== 30 ? `/api/admin/analytics?days=${days}` : '/api/admin/analytics';
  const { data, error, isLoading, mutate } = useSWR(key, fetcher);
  return {
    analytics: data || {},
    isLoading,
    error,
    mutate,
  };
}

async function fetcher(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
}
