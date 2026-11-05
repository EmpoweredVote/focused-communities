import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor, cleanup, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { apiFetch, type ApiResult } from '../lib/apiFetch'
import { useAuth } from '../context/auth'
import {
  useClaimColumn,
  useClaimNode,
  useRootClaim,
  useTreeShape,
  type ClaimNodeResult,
} from './useClaims'
import { useCreateClaim, useEditClaim, useRateClaim } from './useClaimMutations'
import type { Claim, ClaimNode, ColumnPage } from '../types'

vi.mock('../lib/apiFetch', () => ({ apiFetch: vi.fn() }))
vi.mock('../context/auth', () => ({ useAuth: vi.fn() }))
vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }))

const mockFetch = vi.mocked(apiFetch)
const mockAuth = vi.mocked(useAuth)

function signedInAs(id: string) {
  mockAuth.mockReturnValue({
    auth: {
      state: 'connected',
      user: { id, tier: 'connected', account_standing: 'active', completed_onboarding: true, display_name: 'Demo' },
    },
    signIn: vi.fn(),
    signOut: vi.fn(),
  })
}

function authLoading() {
  mockAuth.mockReturnValue({ auth: { state: 'loading' }, signIn: vi.fn(), signOut: vi.fn() })
}

function signedOut() {
  mockAuth.mockReturnValue({ auth: { state: 'inform' }, signIn: vi.fn(), signOut: vi.fn() })
}

function newClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
}

function wrap(client: QueryClient) {
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
}

function wrapper() {
  return wrap(newClient())
}

function claimFor(id: string, over: Partial<Claim> = {}): Claim {
  return {
    id,
    side: 'supports',
    body: `body of ${id}`,
    authorPseudonym: 'Demo Heron',
    impact: 5,
    ratingCount: 0,
    childSupports: 0,
    childOpposes: 0,
    isHidden: false,
    mergedInto: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    myRating: null,
    ...over,
  }
}

function nodeFor(claim: Claim, children: { supports?: Claim[]; opposes?: Claim[] } = {}): ClaimNode {
  return {
    claim,
    breadcrumb: [],
    supports: children.supports ?? [],
    opposes: children.opposes ?? [],
  }
}

const emptyMeta = {
  supports: { cursor: null, hasMore: false },
  opposes: { cursor: null, hasMore: false },
}

const nodeResponse = (node: ClaimNode) => ({ ok: true as const, data: { data: node, meta: emptyMeta } })

/** A node response whose named side has another page behind it. */
const pagedResponse = (
  node: ClaimNode,
  pages: { supports?: { cursor: string | null; hasMore: boolean }; opposes?: { cursor: string | null; hasMore: boolean } },
) => ({
  ok: true as const,
  data: {
    data: node,
    meta: {
      supports: pages.supports ?? { cursor: null, hasMore: false },
      opposes: pages.opposes ?? { cursor: null, hasMore: false },
    },
  },
})

const shapeResponse = {
  ok: true as const,
  data: { data: [], meta: { truncated: false, completeThroughDepth: 0 } },
}

const never = () => new Promise<never>(() => {})

/** A deferred apiFetch result, so a test can inspect the cache mid-flight. */
function deferred() {
  let settle!: (value: ApiResult<unknown>) => void
  const promise = new Promise<ApiResult<unknown>>((resolve) => {
    settle = resolve
  })
  return { promise, settle }
}

/** How many GETs went to a path ending in `suffix` (writes are counted separately). */
const pathsEnding = (suffix: string) =>
  mockFetch.mock.calls.filter(
    ([path, options]) =>
      (options?.method ?? 'GET') === 'GET' && path.split('?')[0].endsWith(suffix),
  ).length

beforeEach(() => {
  mockFetch.mockReset()
  // The viewer key reads the token for a caller with no account object, so a
  // token left behind by one test would key the next one's cache entries.
  localStorage.clear()
  signedOut()
})

afterEach(cleanup)

describe('useClaimNode and useRootClaim', () => {
  it('fetches the root when no claim id is given', async () => {
    mockFetch.mockResolvedValue(nodeResponse(nodeFor(claimFor('root-1', { side: null, authorPseudonym: null }))))
    const { result } = renderHook(
      () => ({ node: useClaimNode(undefined), root: useRootClaim('c1') }),
      { wrapper: wrapper() },
    )
    await waitFor(() => expect(result.current.root.isSuccess).toBe(true))
    // The node query stays idle rather than requesting /api/claims/undefined.
    expect(result.current.node.fetchStatus).toBe('idle')
    expect(mockFetch).toHaveBeenCalledTimes(1)
    expect(mockFetch).toHaveBeenCalledWith('/api/communities/c1/claims/root')
    expect(result.current.root.data?.node.claim.id).toBe('root-1')
    expect(result.current.root.data?.meta.supports.hasMore).toBe(false)
  })

  it('refetches the node when the claim id changes', async () => {
    mockFetch.mockImplementation(async (path: string) =>
      nodeResponse(nodeFor(claimFor(path.split('/').pop()!))),
    )
    const { result, rerender } = renderHook(({ id }: { id: string }) => useClaimNode(id), {
      wrapper: wrapper(),
      initialProps: { id: 'cl-1' },
    })
    await waitFor(() => expect(result.current.data?.node.claim.id).toBe('cl-1'))
    rerender({ id: 'cl-2' })
    await waitFor(() => expect(result.current.data?.node.claim.id).toBe('cl-2'))
    expect(mockFetch).toHaveBeenCalledTimes(2)
    expect(mockFetch).toHaveBeenNthCalledWith(1, '/api/claims/cl-1')
    expect(mockFetch).toHaveBeenNthCalledWith(2, '/api/claims/cl-2')
  })

  it('reports a failed request instead of substituting anything', async () => {
    mockFetch.mockResolvedValue({ ok: false, error: 'Request failed (404)', status: 404 })
    const { result } = renderHook(() => useClaimNode('cl-1'), { wrapper: wrapper() })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error?.message).toBe('Request failed (404)')
    expect(result.current.data).toBeUndefined()
  })

  it('waits for auth to resolve before fetching a node', async () => {
    mockFetch.mockResolvedValue(nodeResponse(nodeFor(claimFor('cl-1'))))
    authLoading()
    const { result, rerender } = renderHook(() => useClaimNode('cl-1'), { wrapper: wrapper() })
    expect(result.current.fetchStatus).toBe('idle')
    expect(mockFetch).not.toHaveBeenCalled()
    signedInAs('u1')
    rerender()
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it('keys the node on the viewer so a different identity refetches', async () => {
    mockFetch.mockResolvedValue(nodeResponse(nodeFor(claimFor('cl-1'))))
    const { result, rerender } = renderHook(() => useClaimNode('cl-1'), { wrapper: wrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    signedInAs('u1')
    rerender()
    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(2))
    signedInAs('u2')
    rerender()
    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(3))
  })

  it('holds the previous claim on screen while another claim of the same viewer loads', async () => {
    mockFetch.mockResolvedValueOnce(nodeResponse(nodeFor(claimFor('cl-1'))))
    const { result, rerender } = renderHook(({ id }: { id: string }) => useClaimNode(id), {
      wrapper: wrapper(),
      initialProps: { id: 'cl-1' },
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    mockFetch.mockImplementationOnce(never)
    rerender({ id: 'cl-2' })
    expect(result.current.isPlaceholderData).toBe(true)
    expect(result.current.data?.node.claim.id).toBe('cl-1')
  })

  it('never shows a signed-out viewer the previous viewer’s myRating', async () => {
    signedInAs('u1')
    mockFetch.mockResolvedValueOnce(nodeResponse(nodeFor(claimFor('cl-1', { myRating: 9 }))))
    const { result, rerender } = renderHook(() => useClaimNode('cl-1'), { wrapper: wrapper() })
    await waitFor(() => expect(result.current.data?.node.claim.myRating).toBe(9))
    mockFetch.mockImplementationOnce(never)
    signedOut()
    rerender()
    expect(result.current.data).toBeUndefined()
    expect(result.current.isPlaceholderData).toBe(false)
  })

  it('never shows a signed-out viewer the previous viewer’s rating from the root', async () => {
    signedInAs('u1')
    mockFetch.mockResolvedValueOnce(
      nodeResponse(
        nodeFor(claimFor('root-1', { side: null, authorPseudonym: null }), {
          supports: [claimFor('cl-1', { myRating: 9 })],
        }),
      ),
    )
    const { result, rerender } = renderHook(() => useRootClaim('c1'), { wrapper: wrapper() })
    await waitFor(() => expect(result.current.data?.node.supports[0].myRating).toBe(9))
    mockFetch.mockImplementationOnce(never)
    signedOut()
    rerender()
    expect(result.current.data).toBeUndefined()
    expect(result.current.isPlaceholderData).toBe(false)
  })

  it('does not key two different inform-tier accounts alike (I3)', async () => {
    // detectUserState() returns a bare { state: 'inform' } for a signed-out
    // visitor AND for a signed-in account whose tier is inform — and apiFetch
    // sends the bearer token either way, so the body that comes back for the
    // second one is that account's, myRating included. Keying both as 'anon'
    // served one reader's ratings to the next with nothing to trigger a
    // refetch, because the key was identical.
    localStorage.setItem('ev_token', 'test-token-a')
    mockFetch.mockResolvedValueOnce(nodeResponse(nodeFor(claimFor('cl-1', { myRating: 9 }))))
    const { result, rerender } = renderHook(() => useClaimNode('cl-1'), { wrapper: wrapper() })
    await waitFor(() => expect(result.current.data?.node.claim.myRating).toBe(9))

    mockFetch.mockImplementationOnce(never)
    localStorage.setItem('ev_token', 'test-token-b')
    rerender()
    expect(result.current.data).toBeUndefined()
    expect(result.current.isPlaceholderData).toBe(false)
  })

  it('keys a visitor with no token apart from one with a token (I3)', async () => {
    localStorage.setItem('ev_token', 'test-token-a')
    mockFetch.mockResolvedValueOnce(nodeResponse(nodeFor(claimFor('cl-1', { myRating: 4 }))))
    const { result, rerender } = renderHook(() => useClaimNode('cl-1'), { wrapper: wrapper() })
    await waitFor(() => expect(result.current.data?.node.claim.myRating).toBe(4))

    mockFetch.mockImplementationOnce(never)
    localStorage.removeItem('ev_token')
    rerender()
    expect(result.current.data).toBeUndefined()
  })

  it('puts no bearer token in a query key', async () => {
    const client = newClient()
    localStorage.setItem('ev_token', 'test-token-a')
    mockFetch.mockResolvedValue(nodeResponse(nodeFor(claimFor('cl-1'))))
    const { result } = renderHook(() => useClaimNode('cl-1'), { wrapper: wrap(client) })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    const keys = JSON.stringify(client.getQueryCache().getAll().map((q) => q.queryKey))
    expect(keys).not.toContain('test-token-a')
    expect(keys).toContain('token:')
  })

  it('does not carry one community’s root into another', async () => {
    mockFetch.mockResolvedValueOnce(nodeResponse(nodeFor(claimFor('root-1'))))
    const { result, rerender } = renderHook(({ id }: { id: string }) => useRootClaim(id), {
      wrapper: wrapper(),
      initialProps: { id: 'c1' },
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    mockFetch.mockImplementationOnce(never)
    rerender({ id: 'c2' })
    expect(result.current.data).toBeUndefined()
  })
})

describe('useClaimColumn', () => {
  const firstPage: ColumnPage = { cursor: 'cur-s1', hasMore: true }

  function renderColumn(client = newClient(), page: ColumnPage = firstPage) {
    return renderHook(() => useClaimColumn('/api/claims/cl-1', 'supports', page), {
      wrapper: wrap(client),
    })
  }

  it('asks for nothing until the reader asks, and says the side is not whole', () => {
    const { result } = renderColumn()
    expect(mockFetch).not.toHaveBeenCalled()
    expect(result.current.extra).toEqual([])
    // The column is a prefix and the hook says so from the node's own meta,
    // before any extra page exists to count.
    expect(result.current.hasMore).toBe(true)
  })

  it('reports a side the node said was whole as whole, and never fetches it', async () => {
    const { result } = renderColumn(newClient(), { cursor: null, hasMore: false })
    await act(async () => {
      result.current.showMore()
    })
    expect(mockFetch).not.toHaveBeenCalled()
    expect(result.current.hasMore).toBe(false)
  })

  it('sends only the side being advanced and keeps only that side of the answer', async () => {
    mockFetch.mockResolvedValue(
      pagedResponse(
        nodeFor(claimFor('cl-1'), {
          supports: [claimFor('s-4')],
          // Page one of the other column, because the request named no
          // opposesCursor. Appending it would show these twice.
          opposes: [claimFor('o-1')],
        }),
        { supports: { cursor: null, hasMore: false } },
      ),
    )
    const { result } = renderColumn()
    await act(async () => {
      result.current.showMore()
    })
    await waitFor(() => expect(result.current.extra).toHaveLength(1))
    expect(mockFetch).toHaveBeenCalledTimes(1)
    expect(mockFetch).toHaveBeenCalledWith('/api/claims/cl-1?supportsCursor=cur-s1')
    expect(result.current.extra.map((c) => c.id)).toEqual(['s-4'])
    expect(result.current.hasMore).toBe(false)
  })

  it('walks on from the newest page’s own cursor, not the first one', async () => {
    mockFetch.mockResolvedValueOnce(
      pagedResponse(nodeFor(claimFor('cl-1'), { supports: [claimFor('s-4')] }), {
        supports: { cursor: 'cur-s2', hasMore: true },
      }),
    )
    const { result } = renderColumn()
    await act(async () => {
      result.current.showMore()
    })
    await waitFor(() => expect(result.current.extra).toHaveLength(1))
    expect(result.current.hasMore).toBe(true)

    mockFetch.mockResolvedValueOnce(
      pagedResponse(nodeFor(claimFor('cl-1'), { supports: [claimFor('s-5')] }), {
        supports: { cursor: null, hasMore: false },
      }),
    )
    await act(async () => {
      result.current.showMore()
    })
    await waitFor(() => expect(result.current.extra).toHaveLength(2))
    expect(mockFetch).toHaveBeenNthCalledWith(2, '/api/claims/cl-1?supportsCursor=cur-s2')
    expect(result.current.extra.map((c) => c.id)).toEqual(['s-4', 's-5'])
    expect(result.current.hasMore).toBe(false)
  })

  it('reports a failed page with the URL it asked for and does not call the side whole', async () => {
    mockFetch.mockResolvedValue({ ok: false, error: 'Request failed (500)', status: 500 })
    const { result } = renderColumn()
    await act(async () => {
      result.current.showMore()
    })
    await waitFor(() => expect(result.current.error).toBe('Request failed (500)'))
    expect(result.current.requestPath).toBe('/api/claims/cl-1?supportsCursor=cur-s1')
    expect(result.current.extra).toEqual([])
    expect(result.current.hasMore).toBe(true)
  })

  it('never hands one viewer’s paged ratings to the next (R71)', async () => {
    signedInAs('u1')
    mockFetch.mockResolvedValue(
      pagedResponse(nodeFor(claimFor('cl-1'), { supports: [claimFor('s-4', { myRating: 9 })] }), {
        supports: { cursor: null, hasMore: false },
      }),
    )
    const { result, rerender } = renderColumn()
    await act(async () => {
      result.current.showMore()
    })
    await waitFor(() => expect(result.current.extra[0]?.myRating).toBe(9))

    // Signing out re-keys the column exactly as it re-keys the node: page two
    // holds Claims, and a Claim carries myRating.
    signedOut()
    rerender()
    expect(result.current.extra).toEqual([])
  })
})

describe('useTreeShape', () => {
  it('requests the shape and returns its truncation meta', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      data: { data: [], meta: { truncated: true, completeThroughDepth: null } },
    })
    const { result } = renderHook(() => useTreeShape('c1'), { wrapper: wrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockFetch).toHaveBeenCalledWith('/api/communities/c1/claims/shape')
    expect(result.current.data?.meta).toEqual({ truncated: true, completeThroughDepth: null })
  })

  it('is deliberately not keyed on the viewer: a sign-in does not refetch it', async () => {
    mockFetch.mockResolvedValue(shapeResponse)
    const { result, rerender } = renderHook(() => useTreeShape('c1'), { wrapper: wrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    signedInAs('u1')
    rerender()
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })
})

describe('useRateClaim', () => {
  it('optimistically applies a rating and rolls back on error', async () => {
    const client = newClient()
    const w = wrap(client)
    mockFetch.mockResolvedValueOnce(
      nodeResponse(nodeFor(claimFor('cl-1'), { supports: [claimFor('child-1', { myRating: 2 })] })),
    )
    const node = renderHook(() => useClaimNode('cl-1'), { wrapper: w })
    await waitFor(() => expect(node.result.current.isSuccess).toBe(true))

    const rating = deferred()
    mockFetch.mockImplementationOnce(() => rating.promise)
    const rate = renderHook(() => useRateClaim(), { wrapper: w })
    act(() => {
      rate.result.current.mutate({ claimId: 'child-1', rating: 9 })
    })

    // A child in a column is rated in place, and only myRating moves.
    await waitFor(() => expect(node.result.current.data?.node.supports[0].myRating).toBe(9))
    expect(node.result.current.data?.node.supports[0].impact).toBe(5)
    expect(mockFetch).toHaveBeenNthCalledWith(2, '/api/claims/child-1/rating', {
      method: 'PUT',
      body: JSON.stringify({ rating: 9 }),
    })

    act(() => {
      rating.settle({ ok: false, error: 'boom', status: 500 })
    })
    await waitFor(() => expect(rate.result.current.isError).toBe(true))
    expect(node.result.current.data?.node.supports[0].myRating).toBe(2)
    expect(node.result.current.data?.node.claim.id).toBe('cl-1')
  })

  it('writes impact and ratingCount from the response rather than computing them', async () => {
    const client = newClient()
    const w = wrap(client)
    mockFetch.mockResolvedValueOnce(nodeResponse(nodeFor(claimFor('cl-1', { impact: 5, ratingCount: 0 }))))
    const node = renderHook(() => useClaimNode('cl-1'), { wrapper: w })
    await waitFor(() => expect(node.result.current.isSuccess).toBe(true))

    const rating = deferred()
    mockFetch.mockImplementationOnce(() => rating.promise)
    const rate = renderHook(() => useRateClaim(), { wrapper: w })
    act(() => {
      rate.result.current.mutate({ claimId: 'cl-1', rating: 1 })
    })

    // In flight: the rating shows, impact does not move. The client cannot
    // compute the Bayesian mean and must not try.
    await waitFor(() => expect(node.result.current.data?.node.claim.myRating).toBe(1))
    expect(node.result.current.data?.node.claim.impact).toBe(5)
    expect(node.result.current.data?.node.claim.ratingCount).toBe(0)

    // The server's numbers are taken verbatim: no arithmetic over (5, 0, 1)
    // produces these.
    act(() => {
      rating.settle({ ok: true, data: { data: { impact: 9.87, ratingCount: 7 } } })
    })
    await waitFor(() => expect(node.result.current.data?.node.claim.impact).toBe(9.87))
    expect(node.result.current.data?.node.claim.ratingCount).toBe(7)
    expect(node.result.current.data?.node.claim.myRating).toBe(1)
  })

  it('rates a claim that is only on a later page, and only for this viewer', async () => {
    const client = newClient()
    const w = wrap(client)
    // Another identity's copy of the same column, already in the cache.
    const otherKey = ['claimColumn', 'u-other', '/api/claims/cl-1', 'supports', 'cur-s1']
    client.setQueryData(otherKey, {
      pages: [{ node: nodeFor(claimFor('cl-1'), { supports: [claimFor('s-4', { myRating: null })] }), meta: emptyMeta }],
      pageParams: ['cur-s1'],
    })

    mockFetch.mockResolvedValueOnce(
      pagedResponse(nodeFor(claimFor('cl-1'), { supports: [claimFor('s-4')] }), {
        supports: { cursor: null, hasMore: false },
      }),
    )
    const column = renderHook(
      () => useClaimColumn('/api/claims/cl-1', 'supports', { cursor: 'cur-s1', hasMore: true }),
      { wrapper: w },
    )
    await act(async () => {
      column.result.current.showMore()
    })
    await waitFor(() => expect(column.result.current.extra).toHaveLength(1))

    mockFetch.mockResolvedValueOnce({ ok: true, data: { data: { impact: 6, ratingCount: 1 } } })
    const rate = renderHook(() => useRateClaim(), { wrapper: w })
    await act(async () => {
      await rate.result.current.mutateAsync({ claimId: 's-4', rating: 9 })
    })

    // The optimistic write reaches a claim that lives in a page, not in a node.
    await waitFor(() => expect(column.result.current.extra[0].myRating).toBe(9))
    expect(column.result.current.extra[0].impact).toBe(6)
    const other = client.getQueryData<{ pages: ClaimNodeResult[] }>(otherKey)
    expect(other?.pages[0].node.supports[0].myRating).toBeNull()
  })

  // The server stores the rating in one transaction and reads the aggregate back in a second
  // query, so it can answer 200 with `aggregateUnavailable: true` and nulls where the numbers
  // would be. Writing those nulls through would make `ratingCount > 0` false and the card would
  // say "Not yet rated" about a claim this reader has just rated — a false statement about
  // other people, held for the whole staleTime. The rating itself still has to land.
  it('keeps the last known aggregate when the server could not read it back', async () => {
    const client = newClient()
    const w = wrap(client)
    mockFetch.mockResolvedValueOnce(
      nodeResponse(nodeFor(claimFor('cl-1', { impact: 7.25, ratingCount: 12, myRating: null }))),
    )
    const node = renderHook(() => useClaimNode('cl-1'), { wrapper: w })
    await waitFor(() => expect(node.result.current.isSuccess).toBe(true))

    const rating = deferred()
    mockFetch.mockImplementationOnce(() => rating.promise)
    const rate = renderHook(() => useRateClaim(), { wrapper: w })
    act(() => {
      rate.result.current.mutate({ claimId: 'cl-1', rating: 8 })
    })
    act(() => {
      rating.settle({
        ok: true,
        data: { data: { impact: null, ratingCount: null, aggregateUnavailable: true } },
      })
    })
    await waitFor(() => expect(rate.result.current.isSuccess).toBe(true))

    // Asserted against the cache rather than through the hook, and not for convenience:
    // react-query v5 only re-renders an observer for result properties that observer has
    // already read, and this test never touches `.data` before the mutation, so the node
    // hook holds its first render throughout. The cache is what the next reader of this
    // claim will actually be handed. (The same reason is recorded on the viewer-leak test.)
    const cached = client.getQueryData<ClaimNodeResult>(['claim', 'anon', 'cl-1'])

    // The reader's own choice registers...
    expect(cached?.node.claim.myRating).toBe(8)
    // ...and the aggregate is stale by one rating rather than erased, so the card still
    // says how many people have rated this instead of "Not yet rated".
    expect(cached?.node.claim.ratingCount).toBe(12)
    expect(cached?.node.claim.impact).toBe(7.25)
  })

  it('does not write a rating into another viewer’s cached claim', async () => {
    const client = newClient()
    const w = wrap(client)
    const otherKey = ['claim', 'u-other', 'cl-1']
    client.setQueryData<ClaimNodeResult>(otherKey, {
      node: nodeFor(claimFor('cl-1', { myRating: null })),
      meta: emptyMeta,
    })
    mockFetch.mockResolvedValueOnce(nodeResponse(nodeFor(claimFor('cl-1'))))
    const node = renderHook(() => useClaimNode('cl-1'), { wrapper: w })
    await waitFor(() => expect(node.result.current.isSuccess).toBe(true))

    mockFetch.mockResolvedValueOnce({ ok: true, data: { data: { impact: 6, ratingCount: 1 } } })
    const rate = renderHook(() => useRateClaim(), { wrapper: w })
    await act(async () => {
      await rate.result.current.mutateAsync({ claimId: 'cl-1', rating: 9 })
    })

    // Read the cache directly: the rating landed on this viewer's entry and
    // nowhere near the other identity's, which is the whole point.
    const mine = ['claim', 'anon', 'cl-1']
    expect(client.getQueryData<ClaimNodeResult>(mine)?.node.claim.myRating).toBe(9)
    expect(client.getQueryData<ClaimNodeResult>(otherKey)?.node.claim.myRating).toBeNull()
  })
})

describe('useCreateClaim', () => {
  it('invalidates the shape query after creating a claim', async () => {
    const client = newClient()
    const w = wrap(client)
    mockFetch.mockImplementation(async (_path: string, options?: RequestInit) => {
      if (options?.method === 'POST') return { ok: true, data: { data: claimFor('new-1') } }
      return shapeResponse
    })
    const shape = renderHook(() => useTreeShape('c1'), { wrapper: w })
    await waitFor(() => expect(shape.result.current.isSuccess).toBe(true))
    expect(pathsEnding('/claims/shape')).toBe(1)

    const create = renderHook(() => useCreateClaim(), { wrapper: w })
    await act(async () => {
      await create.result.current.mutateAsync({ parentId: 'cl-1', side: 'supports', body: 'a new claim' })
    })

    expect(mockFetch).toHaveBeenCalledWith('/api/claims/cl-1/children', {
      method: 'POST',
      body: JSON.stringify({ side: 'supports', body: 'a new claim' }),
    })
    await waitFor(() => expect(pathsEnding('/claims/shape')).toBe(2))
  })

  it('refetches the parent node, whose columns and counts changed', async () => {
    const client = newClient()
    const w = wrap(client)
    mockFetch.mockImplementation(async (path: string, options?: RequestInit) => {
      if (options?.method === 'POST') return { ok: true, data: { data: claimFor('new-1') } }
      return nodeResponse(nodeFor(claimFor(path.split('/').pop()!)))
    })
    const parent = renderHook(() => useClaimNode('cl-1'), { wrapper: w })
    const other = renderHook(() => useClaimNode('cl-2'), { wrapper: w })
    await waitFor(() => expect(parent.result.current.isSuccess).toBe(true))
    await waitFor(() => expect(other.result.current.isSuccess).toBe(true))

    const create = renderHook(() => useCreateClaim(), { wrapper: w })
    await act(async () => {
      await create.result.current.mutateAsync({ parentId: 'cl-1', side: 'opposes', body: 'a rebuttal' })
    })

    await waitFor(() => expect(pathsEnding('/claims/cl-1')).toBe(2))
    expect(pathsEnding('/claims/cl-2')).toBe(1)
  })

  it('surfaces the API error and does not invalidate on failure', async () => {
    const client = newClient()
    const w = wrap(client)
    mockFetch.mockImplementation(async (_path: string, options?: RequestInit) => {
      if (options?.method === 'POST') return { ok: false, error: 'Request failed (404)', status: 404 }
      return shapeResponse
    })
    const shape = renderHook(() => useTreeShape('c1'), { wrapper: w })
    await waitFor(() => expect(shape.result.current.isSuccess).toBe(true))

    const create = renderHook(() => useCreateClaim(), { wrapper: w })
    await act(async () => {
      await create.result.current.mutateAsync({ parentId: 'cl-1', side: 'supports', body: 'x' }).catch(() => {})
    })
    await waitFor(() => expect(create.result.current.error?.message).toBe('Request failed (404)'))
    expect(pathsEnding('/claims/shape')).toBe(1)
  })

  it('carries the error code to the component that has to word the refusal', async () => {
    // Without this, ANCESTOR_NOT_VISIBLE and CLAIM_NOT_FOUND arrive at the
    // composer as the same 404 and it cannot say which happened.
    const client = newClient()
    const w = wrap(client)
    mockFetch.mockImplementation(async (_path: string, options?: RequestInit) => {
      if (options?.method === 'POST') {
        return {
          ok: false,
          error: 'The discussion above this point was removed',
          status: 404,
          code: 'ANCESTOR_NOT_VISIBLE',
        }
      }
      return shapeResponse
    })
    const shape = renderHook(() => useTreeShape('c1'), { wrapper: w })
    await waitFor(() => expect(shape.result.current.isSuccess).toBe(true))

    const create = renderHook(() => useCreateClaim(), { wrapper: w })
    await act(async () => {
      await create.result.current.mutateAsync({ parentId: 'cl-1', side: 'supports', body: 'x' }).catch(() => {})
    })
    await waitFor(() =>
      expect((create.result.current.error as { code?: string } | null)?.code).toBe(
        'ANCESTOR_NOT_VISIBLE',
      ),
    )
  })
})

describe('useEditClaim', () => {
  it('sends a PATCH and refetches the node queries that can show the body', async () => {
    const client = newClient()
    const w = wrap(client)
    mockFetch.mockImplementation(async (path: string, options?: RequestInit) => {
      if (options?.method === 'PATCH') return { ok: true, data: { data: claimFor('cl-1', { body: 'reworded' }) } }
      if (path.endsWith('/claims/shape')) return shapeResponse
      return nodeResponse(nodeFor(claimFor(path.split('/').pop()!)))
    })
    const node = renderHook(() => useClaimNode('cl-1'), { wrapper: w })
    const shape = renderHook(() => useTreeShape('c1'), { wrapper: w })
    await waitFor(() => expect(node.result.current.isSuccess).toBe(true))
    await waitFor(() => expect(shape.result.current.isSuccess).toBe(true))

    const edit = renderHook(() => useEditClaim(), { wrapper: w })
    await act(async () => {
      await edit.result.current.mutateAsync({ claimId: 'cl-1', body: 'reworded' })
    })

    expect(mockFetch).toHaveBeenCalledWith('/api/claims/cl-1', {
      method: 'PATCH',
      body: JSON.stringify({ body: 'reworded' }),
    })
    await waitFor(() => expect(pathsEnding('/claims/cl-1')).toBe(2))
    // The shape carries no body, so an edit leaves it alone.
    expect(pathsEnding('/claims/shape')).toBe(1)
  })
})
