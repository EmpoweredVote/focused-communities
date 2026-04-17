import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '../lib/apiFetch'
import type { Community } from '../types'

export function useCommunityBySlug(slug: string | undefined) {
  return useQuery({
    queryKey: ['community', 'slug', slug],
    queryFn: async () => {
      const res = await apiFetch<{ data: Community }>(`/api/communities/by-slug/${slug}`)
      if (!res.ok) throw new Error(res.error)
      return res.data.data
    },
    staleTime: 5 * 60_000,
    enabled: !!slug,
  })
}
