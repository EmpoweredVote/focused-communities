import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '../lib/apiFetch'
import { useAuth } from '../context/AuthContext'
import type {
  SeasonDetailResponse,
  SeasonListResponse,
  SeasonSummary,
  SeasonView,
} from '../types'

// The seasons API varies by caller (drafts and rationale for a maven, a fallback
// view for everyone else), so the viewer is part of the cache key. 'loading' and
// 'inform' carry no user and are requested as anonymous.
function useViewerKey(): string {
  const { auth } = useAuth()
  return 'user' in auth ? auth.user.id : 'anon'
}

// Matches the server's TTL.SEASONS; a longer client window only widens staleness.
const STALE_MS = 5 * 60_000

export interface SeasonList {
  seasons: SeasonSummary[]
  // null when the topic has no seasons
  defaultSeason: number | null
}

export function useSeasonList(communityId?: string) {
  const viewer = useViewerKey()
  return useQuery<SeasonList>({
    queryKey: ['seasons', viewer, communityId],
    queryFn: async () => {
      const res = await apiFetch<SeasonListResponse>(`/api/communities/${communityId}/seasons`)
      if (!res.ok) throw new Error(res.error)
      return { seasons: res.data.data, defaultSeason: res.data.meta.defaultSeason }
    },
    staleTime: STALE_MS,
    enabled: !!communityId,
  })
}

export function useSeasonView(communityId?: string, seasonNumber?: number) {
  const viewer = useViewerKey()
  return useQuery<SeasonView>({
    queryKey: ['season', viewer, communityId, seasonNumber],
    queryFn: async () => {
      const res = await apiFetch<SeasonDetailResponse>(
        `/api/communities/${communityId}/seasons/${seasonNumber}`,
      )
      if (!res.ok) throw new Error(res.error)
      return res.data.data
    },
    staleTime: STALE_MS,
    enabled: !!communityId && seasonNumber !== undefined,
  })
}
