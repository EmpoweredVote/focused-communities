import { useState } from 'react'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { apiFetch } from '../lib/apiFetch'
import { useAuth } from '../context/AuthContext'
import type {
  Claim,
  ClaimNode,
  ClaimNodeMeta,
  ClaimNodeResponse,
  ClaimSide,
  ColumnPage,
  ShapeMeta,
  ShapeNode,
  ShapeResponse,
} from '../types'

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
// Pages 2..N of one column of one claim. A separate key from CLAIM_KEY because
// page one arrives inside the node and the later pages do not; it carries the
// viewer in the same slot as the other two, because the Claims it holds carry
// myRating like any other.
export const CLAIM_COLUMN_KEY = 'claimColumn'

// The two request paths, exported so that a view reporting a failed request
// quotes the URL it actually asked for rather than a second copy of it that
// can drift. CLAUDE.md: "If a request fails, say so and stop. Report the URL
// and status."
export const claimNodePath = (claimId: string) => `/api/claims/${claimId}`
export const rootClaimPath = (communityId: string) =>
  `/api/communities/${communityId}/claims/root`

// Written out per side rather than built from a template, so a third side could
// never silently mint a parameter name the route does not read.
const CURSOR_PARAM: Record<ClaimSide, string> = {
  supports: 'supportsCursor',
  opposes: 'opposesCursor',
}

/**
 * One node path with ONE side's cursor on it.
 *
 * Both node routes take `supportsCursor` and `opposesCursor` independently, and
 * a request that names neither gets page one of both columns. That is why only
 * the side being advanced is sent: the other column in the response is page one
 * again, and the caller throws it away rather than appending it twice.
 */
export const columnPagePath = (basePath: string, side: ClaimSide, cursor: string) =>
  `${basePath}?${CURSOR_PARAM[side]}=${encodeURIComponent(cursor)}`

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

/** What a column needs to draw itself honestly, past its first page. */
export interface ClaimColumnPages {
  /** Pages 2..N, in order. Page one lives in the node and is not repeated here. */
  extra: Claim[]
  /** True while the server says this side has claims nobody has asked for yet. */
  hasMore: boolean
  /** Ask for the next page. A no-op while one is already in flight. */
  showMore: () => void
  isFetching: boolean
  /** The message and the URL of a failed page request, for the column to quote. */
  error: string | null
  requestPath: string | null
}

/**
 * The rest of one child column.
 *
 * ## Why this is not part of useClaimNode
 *
 * `ClaimNodeMeta` carries `{ cursor, hasMore }` for EACH side, and the route
 * takes a cursor per side, so the two columns advance independently: a single
 * next-page token could not say "page three of supports, page one of opposes".
 * React Query's `useInfiniteQuery` has exactly one forward direction per query,
 * so each side gets its own — keyed on the same viewer, in the same slot, as
 * the node queries, because the pages it holds are full Claims with `myRating`
 * on them.
 *
 * Page one is NOT refetched here: it already arrived inside the node, and
 * `extra` is appended to it by the caller. `getNextPageParam` is the same
 * sentence as `useCommunities` and `useThreads` — `hasMore ? cursor : undefined`
 * — read off this side's half of the meta.
 *
 * Nothing is fetched until the reader asks. The reader asking is also what the
 * column treats as consent to a longer list, so `openedFor` is compared against
 * the path: zooming into another claim collapses the expansion rather than
 * carrying it, and a stale cursor from a previous body of the node re-keys the
 * query rather than paging on from a row that has moved.
 */
export function useClaimColumn(
  basePath: string | undefined,
  side: ClaimSide,
  firstPage: ColumnPage | undefined,
): ClaimColumnPages {
  const { viewer, authReady } = useViewer()
  const [openedFor, setOpenedFor] = useState<string | null>(null)
  // A cursor is only a cursor when the server also said there is more behind it.
  const startCursor = firstPage?.hasMore ? firstPage.cursor : null
  const opened = !!basePath && openedFor === basePath

  const query = useInfiniteQuery<ClaimNodeResult>({
    queryKey: [CLAIM_COLUMN_KEY, viewer, basePath, side, startCursor],
    queryFn: ({ pageParam }) => fetchNode(columnPagePath(basePath!, side, pageParam as string)),
    initialPageParam: startCursor as string,
    getNextPageParam: (lastPage) =>
      lastPage.meta[side].hasMore ? (lastPage.meta[side].cursor ?? undefined) : undefined,
    enabled: authReady && opened && !!startCursor,
  })

  const pages = query.data?.pages ?? []
  const last = pages[pages.length - 1]
  // The cursor the failed request carried: the newest page's, or the node's if
  // no page has landed. Derived rather than remembered, so the URL the column
  // quotes is the one this hook would ask for again (CLAUDE.md: report the URL).
  const pendingCursor = last ? last.meta[side].cursor : startCursor

  return {
    extra: pages.flatMap((page) => page.node[side]),
    // What the newest page said, falling back to what the node said while
    // nothing further has been asked for. Never derived from a length.
    hasMore: last ? last.meta[side].hasMore : !!startCursor,
    showMore: () => {
      if (query.isFetching) return
      if (!opened) setOpenedFor(basePath ?? null)
      else query.fetchNextPage()
    },
    isFetching: query.isFetching,
    error: query.error ? query.error.message : null,
    requestPath:
      query.error && basePath && pendingCursor
        ? columnPagePath(basePath, side, pendingCursor)
        : null,
  }
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
