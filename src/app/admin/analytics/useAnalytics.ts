"use client";
import useSWR from 'swr';

export function useAnalytics(days?: number, startDate?: string, endDate?: string) {
  let key: string;
  if (startDate && endDate) {
    key = `/api/admin/analytics?startDate=${startDate}&endDate=${endDate}`;
  } else if (days && days !== 30) {
    key = `/api/admin/analytics?days=${days}`;
  } else {
    key = '/api/admin/analytics';
  }
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
