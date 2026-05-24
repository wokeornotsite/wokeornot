"use client";
import useSWR from 'swr';

export function useComments(params?: {
  page?: number;
  pageSize?: number;
  sortOrder?: 'asc' | 'desc';
  q?: string;
  contentType?: string;
  deleted?: 'true' | 'false' | 'all';
}) {
  const query = new URLSearchParams();
  if (params?.page !== undefined) query.set('page', String(params.page));
  if (params?.pageSize !== undefined) query.set('pageSize', String(params.pageSize));
  if (params?.sortOrder) query.set('sortOrder', params.sortOrder);
  if (params?.q) query.set('q', params.q);
  if (params?.contentType) query.set('contentType', params.contentType);
  if (params?.deleted) query.set('deleted', params.deleted);

  const key = `/api/admin/comments${query.toString() ? `?${query.toString()}` : ''}`;
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
