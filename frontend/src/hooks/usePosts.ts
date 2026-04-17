import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '../lib/apiFetch'
import type { Post } from '../types'

export function usePosts(threadId: string | undefined) {
  return useQuery({
    queryKey: ['posts', threadId],
    queryFn: async () => {
      const res = await apiFetch<{ data: Post[] }>(`/api/threads/${threadId}/posts`)
      if (!res.ok) throw new Error(res.error)
      return res.data.data
    },
    enabled: !!threadId,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
  })
}
