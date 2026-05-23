"use client";
import useSWR from 'swr';

export function useReviews(params?: {
  page?: number; // 0-based
  pageSize?: number;
  sortBy?: 'createdAt' | 'rating';
  sortOrder?: 'asc' | 'desc';
  q?: string;
  contentType?: string;
  minRating?: number;
  maxRating?: number;
  dateFrom?: string;
  dateTo?: string;
  ipHash?: string;
  guestOnly?: boolean;
}) {
  const query = new URLSearchParams();
  if (params?.page !== undefined) query.set('page', String(params.page));
  if (params?.pageSize !== undefined) query.set('pageSize', String(params.pageSize));
  if (params?.sortBy) query.set('sortBy', params.sortBy);
  if (params?.sortOrder) query.set('sortOrder', params.sortOrder);
  if (params?.q) query.set('q', params.q);
  if (params?.contentType) query.set('contentType', params.contentType);
  if (params?.minRating !== undefined) query.set('minRating', String(params.minRating));
  if (params?.maxRating !== undefined) query.set('maxRating', String(params.maxRating));
  if (params?.dateFrom) query.set('dateFrom', params.dateFrom);
  if (params?.dateTo) query.set('dateTo', params.dateTo);
  if (params?.ipHash) query.set('ipHash', params.ipHash);
  if (params?.guestOnly) query.set('guestOnly', '1');

  const key = `/api/admin/reviews${query.toString() ? `?${query.toString()}` : ''}`;
  const { data, error, mutate, isLoading } = useSWR(key, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  });
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
