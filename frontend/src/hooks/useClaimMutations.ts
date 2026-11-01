import { useMutation, useQueryClient, type Query, type QueryClient, type QueryKey } from '@tanstack/react-query'
import { toast } from 'sonner'
import { apiFetch } from '../lib/apiFetch'
import type { Claim, ClaimSide } from '../types'
import {
  CLAIM_COLUMN_KEY,
  CLAIM_KEY,
  CLAIM_ROOT_KEY,
  CLAIM_SHAPE_KEY,
  useViewer,
  type ClaimNodeResult,
} from './useClaims'

type ApiError = Error & { status?: number; reason?: string }

function apiError(res: { error: string; status: number; reason?: string }): ApiError {
  return Object.assign(new Error(res.error), { status: res.status, reason: res.reason })
}

function reportFailure(err: ApiError, fallback: string) {
  if (err.status === 429) {
    toast.error('Too many requests. Please wait a few minutes.')
  } else if (err.status === 403 && err.reason === 'suspended') {
    toast.error('Your account is suspended and cannot do that.')
  } else {
    toast.error(fallback)
  }
}

// Every cached claim body for ONE viewer: the focused-claim query, the root
// query and a column's later pages all hold Claims, and a claim can sit in any
// of them as the focus or as a card. Filtering on the viewer matters as much
// here as in the query keys — writing a rating into another identity's cache
// entry is the same leak from the other end. All three keys carry the viewer in
// the same slot, which is what makes one predicate enough.
const CLAIM_CACHES: unknown[] = [CLAIM_KEY, CLAIM_ROOT_KEY, CLAIM_COLUMN_KEY]

function viewerNodes(viewer: string) {
  return {
    predicate: (q: Query) =>
      CLAIM_CACHES.includes(q.queryKey[0]) && q.queryKey[1] === viewer,
  }
}

type ClaimPatch = Partial<Pick<Claim, 'myRating' | 'impact' | 'ratingCount'>>

const patched = (c: Claim, claimId: string, patch: ClaimPatch): Claim =>
  c.id === claimId ? { ...c, ...patch } : c

/** One `{ node, meta }` result with the rating written through it. */
function patchResult(old: ClaimNodeResult, claimId: string, patch: ClaimPatch): ClaimNodeResult {
  return {
    ...old,
    node: {
      ...old.node,
      claim: patched(old.node.claim, claimId, patch),
      supports: old.node.supports.map((c) => patched(c, claimId, patch)),
      opposes: old.node.opposes.map((c) => patched(c, claimId, patch)),
    },
  }
}

type InfinitePages = { pages: ClaimNodeResult[]; pageParams: unknown[] }

const isPaged = (old: unknown): old is InfinitePages =>
  typeof old === 'object' && old !== null && Array.isArray((old as InfinitePages).pages)

// Writes into the exact shapes the queries return: `{ node, meta }` from
// useClaimNode/useRootClaim, and `{ pages, pageParams }` from useClaimColumn.
// If this diverged from a query function's shape, a rollback would hand the UI
// a cache entry it cannot read — so the paged branch is a shape check rather
// than a guess from the key, and both branches go through patchResult.
function patchCachedClaim(qc: QueryClient, viewer: string, claimId: string, patch: ClaimPatch) {
  qc.setQueriesData<unknown>(viewerNodes(viewer), (old: unknown) => {
    if (!old) return old
    if (isPaged(old)) {
      return { ...old, pages: old.pages.map((page) => patchResult(page, claimId, patch)) }
    }
    return patchResult(old as ClaimNodeResult, claimId, patch)
  })
}

export interface RateClaimVars {
  claimId: string
  rating: number
}

export interface RatingResult {
  impact: number
  ratingCount: number
}

/**
 * PUT /api/claims/:claimId/rating
 *
 * The optimistic write sets myRating and NOTHING else. The client cannot
 * compute the new impact: it is a Bayesian mean whose prior weight is a literal
 * inside a Postgres generated column, and a second copy of that constant here
 * would drift the day it changes. impact and ratingCount are written from the
 * server's response. The cost is that the impact bar lags the rating by one
 * round trip; the reader's own choice — the part they are watching — registers
 * at once.
 */
export function useRateClaim() {
  const qc = useQueryClient()
  const { viewer } = useViewer()

  // The snapshot is shape-agnostic on purpose: it is only ever handed back to
  // setQueryData verbatim, and the viewer's caches now hold two shapes.
  return useMutation<RatingResult, ApiError, RateClaimVars, { previous: [QueryKey, unknown][] }>({
    mutationFn: async ({ claimId, rating }) => {
      const res = await apiFetch<{ data: RatingResult }>(`/api/claims/${claimId}/rating`, {
        method: 'PUT',
        body: JSON.stringify({ rating }),
      })
      if (!res.ok) throw apiError(res)
      return res.data.data
    },
    onMutate: async ({ claimId, rating }) => {
      await qc.cancelQueries(viewerNodes(viewer))
      const previous = qc.getQueriesData<unknown>(viewerNodes(viewer))
      patchCachedClaim(qc, viewer, claimId, { myRating: rating })
      return { previous }
    },
    onError: (err, _vars, context) => {
      for (const [key, data] of context?.previous ?? []) {
        qc.setQueryData(key, data)
      }
      reportFailure(err, "Couldn't save your rating. Try again.")
    },
    onSuccess: (result, { claimId, rating }) => {
      // impact and ratingCount come from the response, never from arithmetic.
      patchCachedClaim(qc, viewer, claimId, {
        myRating: rating,
        impact: result.impact,
        ratingCount: result.ratingCount,
      })
      // Deliberately no invalidation: a refetch would resort the column under
      // the reader's cursor the instant they rate. The shape query carries
      // impact too and refreshes on its own cadence.
    },
  })
}

export interface CreateClaimVars {
  parentId: string
  side: ClaimSide
  body: string
}

/** POST /api/claims/:parentId/children */
export function useCreateClaim() {
  const qc = useQueryClient()

  return useMutation<Claim, ApiError, CreateClaimVars>({
    mutationFn: async ({ parentId, side, body }) => {
      const res = await apiFetch<{ data: Claim }>(`/api/claims/${parentId}/children`, {
        method: 'POST',
        body: JSON.stringify({ side, body }),
      })
      if (!res.ok) throw apiError(res)
      return res.data.data
    },
    onSuccess: (_claim, { parentId }) => {
      // The tree gained a node, so the minimap is stale everywhere.
      qc.invalidateQueries({ queryKey: [CLAIM_SHAPE_KEY] })
      // The parent's column and its childSupports/childOpposes changed.
      qc.invalidateQueries({
        predicate: (q: Query) => q.queryKey[0] === CLAIM_KEY && q.queryKey[2] === parentId,
      })
      // A column's later pages are keyed by request path, not by claim id, and
      // a new child shifts every keyset page after it. Deliberately broad: a
      // stale page two is a column showing one claim twice, or missing one.
      qc.invalidateQueries({ queryKey: [CLAIM_COLUMN_KEY] })
      // The parent may be the root, and a parentId does not tell us which
      // community's root that is, so every cached root is marked stale.
      qc.invalidateQueries({ queryKey: [CLAIM_ROOT_KEY] })
    },
    onError: (err) => reportFailure(err, "Couldn't add that claim. Try again."),
  })
}

export interface EditClaimVars {
  claimId: string
  body: string
}

/** PATCH /api/claims/:claimId */
export function useEditClaim() {
  const qc = useQueryClient()

  return useMutation<Claim, ApiError, EditClaimVars>({
    mutationFn: async ({ claimId, body }) => {
      const res = await apiFetch<{ data: Claim }>(`/api/claims/${claimId}`, {
        method: 'PATCH',
        body: JSON.stringify({ body }),
      })
      if (!res.ok) throw apiError(res)
      return res.data.data
    },
    onSuccess: () => {
      // An edited body can appear as a focused claim, as a card in someone
      // else's column, or in a breadcrumb, so every node query is stale. The
      // shape carries no body and is left alone.
      qc.invalidateQueries({ queryKey: [CLAIM_KEY] })
      qc.invalidateQueries({ queryKey: [CLAIM_ROOT_KEY] })
      qc.invalidateQueries({ queryKey: [CLAIM_COLUMN_KEY] })
    },
    onError: (err) => reportFailure(err, "Couldn't save that edit. Try again."),
  })
}
