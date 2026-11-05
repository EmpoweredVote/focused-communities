import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor, cleanup } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { apiFetch } from '../lib/apiFetch'
import { useAuth } from '../context/auth'
import { useSeasonList, useSeasonView } from './useSeasons'
import type { SeasonView } from '../types'

vi.mock('../lib/apiFetch', () => ({ apiFetch: vi.fn() }))
vi.mock('../context/auth', () => ({ useAuth: vi.fn() }))
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

function wrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
}

function viewFor(n: number): SeasonView {
  return {
    season: { number: n, name: `Season ${n}`, status: 'open', openedAt: null, closedAt: null },
    questionText: 'question text',
    changeClass: null,
    seasonNote: null,
    topicNote: null,
    rationale: null,
    isFallback: false,
    chairs: [],
  }
}

beforeEach(() => {
  mockFetch.mockReset()
  signedOut()
})

afterEach(cleanup)

const emptyList = { ok: true as const, data: { data: [], meta: { defaultSeason: null } } }

describe('useSeasonList', () => {
  it('requests the default season list and surfaces defaultSeason', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      data: {
        data: [{ number: 1, name: 'Season 1', status: 'open', openedAt: null, closedAt: null }],
        meta: { defaultSeason: 1 },
      },
    })
    const { result } = renderHook(() => useSeasonList('c1'), { wrapper: wrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockFetch).toHaveBeenCalledWith('/api/communities/c1/seasons')
    expect(result.current.data?.defaultSeason).toBe(1)
    expect(result.current.data?.seasons).toHaveLength(1)
  })

  it('passes a null defaultSeason through for an empty topic', async () => {
    mockFetch.mockResolvedValue({ ok: true, data: { data: [], meta: { defaultSeason: null } } })
    const { result } = renderHook(() => useSeasonList('c1'), { wrapper: wrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual({ seasons: [], defaultSeason: null })
  })

  it('stays disabled until the community id resolves', () => {
    const { result } = renderHook(() => useSeasonList(undefined), { wrapper: wrapper() })
    expect(result.current.fetchStatus).toBe('idle')
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('throws the apiFetch error message on failure', async () => {
    mockFetch.mockResolvedValue({ ok: false, error: 'boom', status: 500 })
    const { result } = renderHook(() => useSeasonList('c1'), { wrapper: wrapper() })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error?.message).toBe('boom')
  })

  it('keys the query on the community id so switching refetches', async () => {
    mockFetch.mockResolvedValue(emptyList)
    const { result, rerender } = renderHook(
      ({ id }: { id: string }) => useSeasonList(id),
      { wrapper: wrapper(), initialProps: { id: 'c1' } },
    )
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    rerender({ id: 'c2' })
    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(2))
    expect(mockFetch).toHaveBeenNthCalledWith(2, '/api/communities/c2/seasons')
  })

  it('keys the query on the viewer so a different identity refetches', async () => {
    mockFetch.mockResolvedValue(emptyList)
    const { result, rerender } = renderHook(() => useSeasonList('c1'), { wrapper: wrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    signedInAs('u1')
    rerender()
    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(2))
    signedInAs('u2')
    rerender()
    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(3))
  })
})

describe('auth gating', () => {
  it('useSeasonList fetches nothing while auth is loading, then once it resolves', async () => {
    mockFetch.mockResolvedValue(emptyList)
    authLoading()
    const { result, rerender } = renderHook(() => useSeasonList('c1'), { wrapper: wrapper() })
    expect(result.current.fetchStatus).toBe('idle')
    expect(mockFetch).not.toHaveBeenCalled()
    signedInAs('u1')
    rerender()
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it('useSeasonView fetches nothing while auth is loading, then once it resolves', async () => {
    mockFetch.mockResolvedValue({ ok: true, data: { data: viewFor(2) } })
    authLoading()
    const { result, rerender } = renderHook(() => useSeasonView('c1', 2), { wrapper: wrapper() })
    expect(result.current.fetchStatus).toBe('idle')
    expect(mockFetch).not.toHaveBeenCalled()
    signedInAs('u1')
    rerender()
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })
})

describe('useSeasonView', () => {
  it('fetches season 0 rather than treating it as missing', async () => {
    mockFetch.mockResolvedValue({ ok: true, data: { data: viewFor(0) } })
    const { result } = renderHook(() => useSeasonView('c1', 0), { wrapper: wrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockFetch).toHaveBeenCalledWith('/api/communities/c1/seasons/0')
  })

  it('keys the query on the community id so switching refetches', async () => {
    mockFetch.mockResolvedValue({ ok: true, data: { data: viewFor(2) } })
    const { result, rerender } = renderHook(
      ({ id }: { id: string }) => useSeasonView(id, 2),
      { wrapper: wrapper(), initialProps: { id: 'c1' } },
    )
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    rerender({ id: 'c2' })
    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(2))
    expect(mockFetch).toHaveBeenNthCalledWith(2, '/api/communities/c2/seasons/2')
  })

  it('keys the query on the viewer so sign-in and sign-out refetch', async () => {
    mockFetch.mockResolvedValue({ ok: true, data: { data: viewFor(2) } })
    const { result, rerender } = renderHook(() => useSeasonView('c1', 2), { wrapper: wrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    signedInAs('u1')
    rerender()
    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(2))
    signedInAs('u2')
    rerender()
    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(3))
  })

  it('requests the season by number and returns the view', async () => {
    mockFetch.mockResolvedValue({ ok: true, data: { data: viewFor(2) } })
    const { result } = renderHook(() => useSeasonView('c1', 2), { wrapper: wrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockFetch).toHaveBeenCalledWith('/api/communities/c1/seasons/2')
    expect(result.current.data?.season.number).toBe(2)
  })

  it('stays disabled until both the community id and season number are defined', () => {
    const a = renderHook(() => useSeasonView(undefined, 2), { wrapper: wrapper() })
    const b = renderHook(() => useSeasonView('c1', undefined), { wrapper: wrapper() })
    expect(a.result.current.fetchStatus).toBe('idle')
    expect(b.result.current.fetchStatus).toBe('idle')
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('keys the query on the season number so switching refetches', async () => {
    mockFetch.mockImplementation(async (path: string) => {
      const n = Number(path.split('/').pop())
      return { ok: true, data: { data: viewFor(n) } }
    })
    const { result, rerender } = renderHook(
      ({ n }: { n: number }) => useSeasonView('c1', n),
      { wrapper: wrapper(), initialProps: { n: 2 } },
    )
    await waitFor(() => expect(result.current.data?.season.number).toBe(2))
    rerender({ n: 3 })
    await waitFor(() => expect(result.current.data?.season.number).toBe(3))
    expect(mockFetch).toHaveBeenCalledTimes(2)
    expect(mockFetch).toHaveBeenNthCalledWith(1, '/api/communities/c1/seasons/2')
    expect(mockFetch).toHaveBeenNthCalledWith(2, '/api/communities/c1/seasons/3')
  })

  it('throws the apiFetch error message on failure', async () => {
    mockFetch.mockResolvedValue({ ok: false, error: 'boom', status: 500 })
    const { result } = renderHook(() => useSeasonView('c1', 2), { wrapper: wrapper() })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error?.message).toBe('boom')
  })
})

describe('useSeasonView placeholder data', () => {
  const never = () => new Promise<never>(() => {})
  const withRationale = (n: number): SeasonView => ({ ...viewFor(n), rationale: 'INTERNAL-RATIONALE' })

  it('shows the previous season while another season of the same community loads', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, data: { data: viewFor(1) } })
    const { result, rerender } = renderHook(
      ({ n }: { n: number }) => useSeasonView('c1', n),
      { wrapper: wrapper(), initialProps: { n: 1 } },
    )
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    mockFetch.mockImplementationOnce(never)
    rerender({ n: 2 })
    expect(result.current.isPlaceholderData).toBe(true)
    expect(result.current.data?.season.number).toBe(1)
  })

  it('does not carry the previous viewer view across a viewer change', async () => {
    signedInAs('maven')
    mockFetch.mockResolvedValueOnce({ ok: true, data: { data: withRationale(1) } })
    const { result, rerender } = renderHook(() => useSeasonView('c1', 1), { wrapper: wrapper() })
    await waitFor(() => expect(result.current.data?.rationale).toBe('INTERNAL-RATIONALE'))
    mockFetch.mockImplementationOnce(never)
    signedOut()
    rerender()
    expect(result.current.data).toBeUndefined()
    expect(result.current.isPlaceholderData).toBe(false)
  })

  it('does not carry another community view across a community change', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, data: { data: viewFor(1) } })
    const { result, rerender } = renderHook(
      ({ id }: { id: string }) => useSeasonView(id, 1),
      { wrapper: wrapper(), initialProps: { id: 'c1' } },
    )
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    mockFetch.mockImplementationOnce(never)
    rerender({ id: 'c2' })
    expect(result.current.data).toBeUndefined()
  })

  it('shows nothing for a community with no seasons (query disabled)', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, data: { data: viewFor(1) } })
    const { result, rerender } = renderHook(
      ({ id, n }: { id: string; n?: number }) => useSeasonView(id, n),
      { wrapper: wrapper(), initialProps: { id: 'c1', n: 1 } as { id: string; n?: number } },
    )
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    rerender({ id: 'c2', n: undefined })
    expect(result.current.fetchStatus).toBe('idle')
    expect(result.current.data).toBeUndefined()
  })
})
