import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '../lib/apiFetch'
import { useAuth } from '../context/AuthContext'
import type { ClaimNode, ClaimNodeMeta, ClaimNodeResponse, ShapeMeta, ShapeNode, ShapeResponse } from '../types'

// Same viewer rule as useSeasons: a claim body carries myRating, the one
// per-caller field, so every key that can hold one carries the viewer. Without
// it a reader who signs out keeps the previous reader's ratings until staleTime
// expires, with no invalidation to fix it. 'inform' carries no user and keys as
// 'anon'. Queries also wait for auth to resolve: fetching while the viewer is
// unknown shows a signed-in reader the anonymous ratings first and then swaps
// them under them.
export function useViewer(): { viewer: string; authReady: boolean } {
  const { auth } = useAuth()
  return {
    viewer: 'user' in auth ? auth.user.id : 'anon',
    authReady: auth.state !== 'loading',
  }
}

export interface ClaimNodeResult {
  node: ClaimNode
  meta: ClaimNodeMeta
}

export interface TreeShape {
  nodes: ShapeNode[]
  meta: ShapeMeta
}

// Key prefixes. The mutations in useClaimMutations.ts match on these, so they
// live here next to the queries that write them.
export const CLAIM_KEY = 'claim'
export const CLAIM_ROOT_KEY = 'claimRoot'
export const CLAIM_SHAPE_KEY = 'claimShape'

// The two request paths, exported so that a view reporting a failed request
// quotes the URL it actually asked for rather than a second copy of it that
// can drift. CLAUDE.md: "If a request fails, say so and stop. Report the URL
// and status."
export const claimNodePath = (claimId: string) => `/api/claims/${claimId}`
export const rootClaimPath = (communityId: string) =>
  `/api/communities/${communityId}/claims/root`

async function fetchNode(path: string): Promise<ClaimNodeResult> {
  const res = await apiFetch<ClaimNodeResponse>(path)
  // A failed request is reported as a failure. The claims routes are not on the
  // deployed API yet, so today this surfaces as a real 404 — which is the
  // honest answer, not a reason to substitute invented data.
  if (!res.ok) throw new Error(res.error)
  return { node: res.data.data, meta: res.data.meta }
}

/** One claim with its breadcrumb and both child columns. */
export function useClaimNode(claimId?: string) {
  const { viewer, authReady } = useViewer()
  return useQuery<ClaimNodeResult>({
    queryKey: [CLAIM_KEY, viewer, claimId],
    queryFn: () => fetchNode(claimNodePath(claimId!)),
    // Hold the previous claim on screen while the next one loads so a reader
    // walking the tree keeps their place; callers must mark it stale
    // (isPlaceholderData) rather than present it as the new claim. Reuse only
    // within the same viewer: a bare keepPreviousData reuses ANY key, which
    // would carry one reader's myRating across a sign-out.
    // Key order: [CLAIM_KEY, viewer, claimId].
    placeholderData: (prev, q) => (q && q.queryKey[1] === viewer ? prev : undefined),
    enabled: authReady && !!claimId,
  })
}

/** The community's root claim, for when no claim id is given. */
export function useRootClaim(communityId?: string) {
  const { viewer, authReady } = useViewer()
  return useQuery<ClaimNodeResult>({
    queryKey: [CLAIM_ROOT_KEY, viewer, communityId],
    queryFn: () => fetchNode(rootClaimPath(communityId!)),
    // Same narrowing as useClaimNode, plus the community: a root holds child
    // claims with myRating on them, and one community's root must not stand in
    // for another's. Key order: [CLAIM_ROOT_KEY, viewer, communityId].
    placeholderData: (prev, q) =>
      q && q.queryKey[1] === viewer && q.queryKey[2] === communityId ? prev : undefined,
    enabled: authReady && !!communityId,
  })
}

/**
 * The whole tree's shape for the minimap.
 *
 * Deliberately NOT keyed on the viewer and deliberately not gated on auth: a
 * ShapeNode has no per-caller field and the API serves this route without auth
 * at all. Adding the viewer "for consistency" would fragment the cache and make
 * every sign-in refetch the whole shape for nothing.
 */
export function useTreeShape(communityId?: string) {
  return useQuery<TreeShape>({
    queryKey: [CLAIM_SHAPE_KEY, communityId],
    queryFn: async () => {
      const res = await apiFetch<ShapeResponse>(`/api/communities/${communityId}/claims/shape`)
      if (!res.ok) throw new Error(res.error)
      return { nodes: res.data.data, meta: res.data.meta }
    },
    enabled: !!communityId,
  })
}
