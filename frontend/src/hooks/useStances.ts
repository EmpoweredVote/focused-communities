import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '../lib/apiFetch'
import type { Stance } from '../types'

export type DisplayStance = Omit<Stance, 'position'>

export function useStances(communityId: string | undefined) {
  return useQuery({
    queryKey: ['stances', communityId],
    queryFn: async () => {
      const res = await apiFetch<{ data: Stance[] }>(`/api/communities/${communityId}/stances`)
      if (!res.ok) throw new Error(res.error)
      // Sort by position (1→5) then strip — position MUST NEVER reach rendering code
      return res.data.data
        .sort((a, b) => a.position - b.position)
        .map(({ position: _position, ...rest }): DisplayStance => rest)
    },
    staleTime: 30 * 60_000,
    enabled: !!communityId,
  })
}
