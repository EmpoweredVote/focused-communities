import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '../lib/apiFetch'
import type { Stance } from '../types'

export type DisplayStance = Omit<Stance, 'position'>

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function useStances(communityId: string | undefined) {
  return useQuery({
    queryKey: ['stances', communityId],
    queryFn: async () => {
      const res = await apiFetch<{ data: Stance[] }>(`/api/communities/${communityId}/stances`)
      if (!res.ok) throw new Error(res.error)
      // Strip position field and shuffle — position MUST NEVER reach rendering code
      const shuffled = shuffle(res.data.data)
      return shuffled.map(({ position: _position, ...rest }): DisplayStance => rest)
    },
    staleTime: 30 * 60_000,
    enabled: !!communityId,
  })
}
