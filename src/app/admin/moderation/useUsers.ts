import useSWR from 'swr';

export function useUsers() {
  const { data, error, mutate, isLoading } = useSWR('/api/admin/users', fetcher);
  return {
    users: data || [],
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
