import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor, cleanup, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { apiFetch, type ApiResult } from '../lib/apiFetch'
import { useAuth } from '../context/AuthContext'
import { useClaimNode, useRootClaim, useTreeShape, type ClaimNodeResult } from './useClaims'
import { useCreateClaim, useEditClaim, useRateClaim } from './useClaimMutations'
import type { Claim, ClaimNode } from '../types'

vi.mock('../lib/apiFetch', () => ({ apiFetch: vi.fn() }))
vi.mock('../context/AuthContext', () => ({ useAuth: vi.fn() }))
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
