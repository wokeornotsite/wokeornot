"use client";
import useSWR from 'swr';

export type StatSortField = 'reviewCount' | 'avgRating' | 'lastReview';
export type StandardSortField = 'email' | 'createdAt' | 'role';
export type SortField = StandardSortField | StatSortField;

export function useUsersWithStats(params?: {
  page?: number;
  pageSize?: number;
  sortBy?: SortField;
  sortOrder?: 'asc' | 'desc';
  q?: string;
}) {
  const query = new URLSearchParams();
  query.set('includeStats', 'true');
  if (params?.page !== undefined) query.set('page', String(params.page));
  if (params?.pageSize !== undefined) query.set('pageSize', String(params.pageSize));
  if (params?.sortBy) query.set('sortBy', params.sortBy);
  if (params?.sortOrder) query.set('sortOrder', params.sortOrder);
  if (params?.q) query.set('q', params.q);

  const key = `/api/admin/users?${query.toString()}`;
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
