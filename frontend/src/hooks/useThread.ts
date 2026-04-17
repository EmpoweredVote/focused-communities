import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '../lib/apiFetch'
import type { Thread } from '../types'

export function useThread(threadId: string | undefined) {
  return useQuery({
    queryKey: ['thread', threadId],
    queryFn: async () => {
      const res = await apiFetch<{ data: Thread }>(`/api/threads/${threadId}`)
      if (!res.ok) throw new Error(res.error)
      return res.data.data
    },
    enabled: !!threadId,
    staleTime: 30_000,
  })
}
