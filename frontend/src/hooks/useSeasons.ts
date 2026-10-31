import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '../lib/apiFetch'
import type {
  SeasonDetailResponse,
  SeasonListResponse,
  SeasonSummary,
  SeasonView,
} from '../types'

export interface SeasonList {
  seasons: SeasonSummary[]
  // null when the topic has no seasons
  defaultSeason: number | null
}

export function useSeasonList(communityId?: string) {
  return useQuery<SeasonList>({
    queryKey: ['seasons', communityId],
    queryFn: async () => {
      const res = await apiFetch<SeasonListResponse>(`/api/communities/${communityId}/seasons`)
      if (!res.ok) throw new Error(res.error)
      return { seasons: res.data.data, defaultSeason: res.data.meta.defaultSeason }
    },
    staleTime: 30 * 60_000,
    enabled: !!communityId,
  })
}

export function useSeasonView(communityId?: string, seasonNumber?: number) {
  return useQuery<SeasonView>({
    queryKey: ['season', communityId, seasonNumber],
    queryFn: async () => {
      const res = await apiFetch<SeasonDetailResponse>(
        `/api/communities/${communityId}/seasons/${seasonNumber}`,
      )
      if (!res.ok) throw new Error(res.error)
      return res.data.data
    },
    staleTime: 30 * 60_000,
    enabled: !!communityId && seasonNumber !== undefined,
  })
}
