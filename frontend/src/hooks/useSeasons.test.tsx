import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { apiFetch } from '../lib/apiFetch'
import { useSeasonList, useSeasonView } from './useSeasons'
import type { SeasonView } from '../types'

vi.mock('../lib/apiFetch', () => ({ apiFetch: vi.fn() }))
const mockFetch = vi.mocked(apiFetch)

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
})

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
})

describe('useSeasonView', () => {
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
