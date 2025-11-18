"use client";
import useSWR from 'swr';

export function useMovies() {
  const { data, error, mutate, isLoading } = useSWR('/api/admin/movies', fetcher);
  return {
    movies: (data?.data as any[]) || [],
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
