import { useInfiniteQuery } from '@tanstack/react-query'
import { apiFetch } from '../lib/apiFetch'
import type { Community, PaginatedResponse } from '../types'

export function useCommunities(q?: string, sort = 'newest') {
  const result = useInfiniteQuery({
    queryKey: ['communities', { q, sort }],
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams()
      if (q) params.set('q', q)
      if (sort) params.set('sort', sort)
      if (pageParam) params.set('cursor', pageParam)
      const url = `/api/communities${params.toString() ? '?' + params.toString() : ''}`
      const res = await apiFetch<PaginatedResponse<Community>>(url)
      if (!res.ok) throw new Error(res.error)
      return res.data
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) =>
      lastPage.meta.hasMore ? lastPage.meta.cursor : undefined,
  })

  const communities = result.data?.pages.flatMap(p => p.data) ?? []
  return { ...result, communities }
}
