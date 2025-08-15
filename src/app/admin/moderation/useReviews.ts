"use client";
import useSWR from 'swr';

export function useReviews(params?: {
  page?: number; // 0-based
  pageSize?: number;
  sortBy?: 'createdAt' | 'rating';
  sortOrder?: 'asc' | 'desc';
  q?: string;
  contentType?: string;
}) {
  const query = new URLSearchParams();
  if (params?.page !== undefined) query.set('page', String(params.page));
  if (params?.pageSize !== undefined) query.set('pageSize', String(params.pageSize));
  if (params?.sortBy) query.set('sortBy', params.sortBy);
  if (params?.sortOrder) query.set('sortOrder', params.sortOrder);
  if (params?.q) query.set('q', params.q);
  if (params?.contentType) query.set('contentType', params.contentType);

  const key = `/api/admin/reviews${query.toString() ? `?${query.toString()}` : ''}`;
  const { data, error, mutate, isLoading } = useSWR(key, fetcher);
  return {
    rows: (data?.data as any[]) || [],
    total: (data?.total as number) || 0,
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
