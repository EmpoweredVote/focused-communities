import { useInfiniteQuery } from '@tanstack/react-query'
import { apiFetch } from '../lib/apiFetch'
import type { ThreadSummary, PaginatedResponse } from '../types'

export function useThreads(communityId: string | undefined, sort: 'active' | 'newest' = 'active') {
  const result = useInfiniteQuery({
    queryKey: ['threads', communityId, sort],
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams()
      params.set('sort', sort)
      if (pageParam) params.set('cursor', pageParam)
      const res = await apiFetch<PaginatedResponse<ThreadSummary>>(
        `/api/communities/${communityId}/threads?${params.toString()}`
      )
      if (!res.ok) throw new Error(res.error)
      return res.data
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) =>
      lastPage.meta.hasMore ? lastPage.meta.cursor : undefined,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
    enabled: !!communityId,
  })

  const threads = result.data?.pages.flatMap(p => p.data) ?? []
  return { ...result, threads }
}
