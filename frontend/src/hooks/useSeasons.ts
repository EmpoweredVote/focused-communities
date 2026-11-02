import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '../lib/apiFetch'
import { useAuth } from '../context/AuthContext'
import type {
  SeasonDetailResponse,
  SeasonListResponse,
  SeasonSummary,
  SeasonView,
} from '../types'

// The seasons API returns different data depending on who is asking: a maven
// sees draft seasons and the rationale field, everyone else gets the default
// season as a fallback. The cache must therefore be keyed on the viewer, or a
// visitor who signs in (or a maven who signs out) would keep the other
// identity's response until staleTime expires, with no invalidation to fix it.
// 'inform' carries no user and is keyed as 'anon'.
//
// Queries also wait for auth to resolve. While auth is 'loading' the viewer is
// unknown; fetching then would show a signed-in maven the anonymous view first
// and silently swap it once their id arrives. A brief skeleton beats content
// that is wrong for the viewer and then changes under them.
function useViewer(): { viewer: string; authReady: boolean } {
  const { auth } = useAuth()
  return {
    viewer: 'user' in auth ? auth.user.id : 'anon',
    authReady: auth.state !== 'loading',
  }
}

// Matches the server's TTL.SEASONS; a longer client window only widens staleness.
const STALE_MS = 5 * 60_000

export interface SeasonList {
  seasons: SeasonSummary[]
  // null when the topic has no seasons
  defaultSeason: number | null
}

export function useSeasonList(communityId?: string) {
  const { viewer, authReady } = useViewer()
  return useQuery<SeasonList>({
    queryKey: ['seasons', viewer, communityId],
    queryFn: async () => {
      const res = await apiFetch<SeasonListResponse>(`/api/communities/${communityId}/seasons`)
      if (!res.ok) throw new Error(res.error)
      return { seasons: res.data.data, defaultSeason: res.data.meta.defaultSeason }
    },
    staleTime: STALE_MS,
    enabled: authReady && !!communityId,
  })
}

export function useSeasonView(communityId?: string, seasonNumber?: number) {
  const { viewer, authReady } = useViewer()
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
    // Hold the previous season on screen while the next loads, so a reader
    // comparing wording keeps their place. Callers must mark it stale
    // (isPlaceholderData) rather than present it as the new season.
    // Reuse only within the same viewer and community: a bare keepPreviousData
    // would carry a maven's rationale across a sign-out, or one community's
    // content under another's title. Key order: ['season', viewer, community, n].
    placeholderData: (prev, q) =>
      q && q.queryKey[1] === viewer && q.queryKey[2] === communityId ? prev : undefined,
    enabled: authReady && !!communityId && seasonNumber !== undefined,
  })
}
