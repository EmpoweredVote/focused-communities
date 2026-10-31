import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { useEffect } from 'react'
import { MemoryRouter, Routes, Route, useLocation } from 'react-router'
import CommunityHubPage from './CommunityHubPage'
import { useSeasonList, useSeasonView } from '../hooks/useSeasons'
import type { SeasonView, SeasonSummary } from '../types'

vi.mock('../hooks/useSeasons', () => ({ useSeasonList: vi.fn(), useSeasonView: vi.fn() }))
vi.mock('../hooks/useCommunityBySlug', () => ({
  useCommunityBySlug: () => ({
    data: { id: 'c-test', slug: 'test-slug', name: 'Test Community', description: 'Test description' },
    isLoading: false,
    isError: false,
  }),
}))
vi.mock('../hooks/useThreads', () => ({
  useThreads: () => ({
    threads: [], isLoading: false, isError: false, refetch: vi.fn(),
    hasNextPage: false, isFetchingNextPage: false, fetchNextPage: vi.fn(),
  }),
}))
vi.mock('../components/Header', () => ({ Header: () => null }))

const lifecycle = vi.hoisted(() => ({ mounts: 0, unmounts: 0 }))
vi.mock('../components/ThreadCreateForm', () => ({
  ThreadCreateForm: () => {
    useEffect(() => {
      lifecycle.mounts++
      return () => { lifecycle.unmounts++ }
    }, [])
    return <div>forum-form</div>
  },
}))

const s1: SeasonSummary = { number: 1, name: 'Season One', status: 'closed', openedAt: null, closedAt: null }
const s2: SeasonSummary = { number: 2, name: 'Season Two', status: 'open', openedAt: null, closedAt: null }

function viewFor(season: SeasonSummary, over: Partial<SeasonView> = {}): SeasonView {
  return {
    season,
    questionText: `Question for ${season.name}`,
    changeClass: null,
    seasonNote: null,
    topicNote: null,
    rationale: null,
    isFallback: false,
    chairs: [
      { text: 'Chair with no description', description: null, supportingPoints: [], examplePerspectives: [], changeSince: null },
    ],
    ...over,
  }
}

function mockSeasons(list: { seasons: SeasonSummary[]; defaultSeason: number | null }) {
  vi.mocked(useSeasonList).mockReturnValue({
    data: list, isPending: false, isError: false, isSuccess: true, refetch: vi.fn(),
  } as unknown as ReturnType<typeof useSeasonList>)
  vi.mocked(useSeasonView).mockImplementation(((_id: string, n?: number) => {
    const season = list.seasons.find((s) => s.number === n)
    return {
      data: season ? viewFor(season) : undefined,
      isPending: !season, isError: false, refetch: vi.fn(),
    }
  }) as unknown as typeof useSeasonView)
}

function Probe() {
  const loc = useLocation()
  return <div data-testid="loc">{loc.pathname + loc.search}</div>
}

function renderPage(url = '/communities/test-slug') {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/communities/:slug" element={<><CommunityHubPage /><Probe /></>} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => { lifecycle.mounts = 0; lifecycle.unmounts = 0 })
afterEach(cleanup)

describe('CommunityHubPage seasons', () => {
  it('defaults to the default season and honours ?season=', () => {
    mockSeasons({ seasons: [s1, s2], defaultSeason: 2 })
    renderPage()
    expect(screen.getByText('Question for Season Two')).toBeInTheDocument()
    cleanup()
    renderPage('/communities/test-slug?season=1')
    expect(screen.getByText('Question for Season One')).toBeInTheDocument()
  })

  it('does not unmount the forum band when the season changes', () => {
    mockSeasons({ seasons: [s1, s2], defaultSeason: 2 })
    renderPage()
    const discussion = screen.getByText('Discussion')
    const form = screen.getByText('forum-form')
    expect(lifecycle.mounts).toBe(1)

    fireEvent.change(screen.getByLabelText('Season'), { target: { value: '1' } })

    expect(screen.getByText('Question for Season One')).toBeInTheDocument()
    expect(screen.getByTestId('loc')).toHaveTextContent('?season=1')
    expect(screen.getByText('Discussion')).toBe(discussion)
    expect(screen.getByText('forum-form')).toBe(form)
    expect(lifecycle.mounts).toBe(1)
    expect(lifecycle.unmounts).toBe(0)
  })

  it('renders a chair with no description as plain text, never "null"', () => {
    mockSeasons({ seasons: [s1, s2], defaultSeason: 2 })
    const { container } = renderPage()
    expect(screen.getByText('Chair with no description')).toBeInTheDocument()
    expect(container.textContent).not.toMatch(/null/)
  })

  it('still renders the forum when the topic has no seasons', () => {
    mockSeasons({ seasons: [], defaultSeason: null })
    renderPage()
    expect(screen.getByText(/no published question yet/)).toBeInTheDocument()
    expect(screen.getByText('Discussion')).toBeInTheDocument()
    expect(screen.getByText('forum-form')).toBeInTheDocument()
  })
})
