import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '../lib/apiFetch'
import type { Stance } from '../types'

export function useStances(communityId: string | undefined) {
  return useQuery({
    queryKey: ['stances', communityId],
    queryFn: async () => {
      const res = await apiFetch<{ data: Stance[] }>(`/api/communities/${communityId}/stances`)
      if (!res.ok) throw new Error(res.error)
      return res.data.data
    },
    staleTime: 30 * 60_000,
    enabled: !!communityId,
  })
}
