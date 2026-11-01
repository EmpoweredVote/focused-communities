import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { useEffect } from 'react'
import { MemoryRouter, Routes, Route, useLocation, useNavigate } from 'react-router'
import CommunityHubPage from './CommunityHubPage'
import { useSeasonList, useSeasonView } from '../hooks/useSeasons'
import type { SeasonView, SeasonSummary, Chair } from '../types'

vi.mock('../hooks/useSeasons', () => ({ useSeasonList: vi.fn(), useSeasonView: vi.fn() }))

const communityState = vi.hoisted(() => ({ slug: 'test-slug' }))
vi.mock('../hooks/useCommunityBySlug', () => ({
  useCommunityBySlug: () => ({
    data: { id: 'c-test', slug: communityState.slug, name: 'Test Community', description: 'Test description' },
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
// Band 3 is exercised against this page, with its real hooks and its real
// children, in src/components/claims/ArgumentTree.test.tsx. Here it is a stub:
// this file's harness has neither a QueryClientProvider nor an AuthProvider,
// and giving it both to test the seasons bands would couple twenty tests to
// the claims API for nothing.
vi.mock('../components/claims/ArgumentTree', () => ({
  ArgumentTree: () => <div>argument-tree</div>,
}))

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

const plainChair: Chair = {
  text: 'Chair with no description', description: null, supportingPoints: [], examplePerspectives: [], changeSince: null,
}

function viewFor(season: SeasonSummary, over: Partial<SeasonView> = {}): SeasonView {
  return {
    season,
    questionText: `Question for ${season.name}`,
    changeClass: null,
    seasonNote: null,
    topicNote: null,
    rationale: null,
    isFallback: false,
    chairs: [plainChair],
    ...over,
  }
}

let chairs: Chair[] = [plainChair]
let stale = false

// Mirrors the API: an unknown season resolves to the default with isFallback.
function mockSeasons(list: { seasons: SeasonSummary[]; defaultSeason: number | null }) {
  vi.mocked(useSeasonList).mockReturnValue({
    data: list, isPending: false, isError: false, isSuccess: true, refetch: vi.fn(),
  } as unknown as ReturnType<typeof useSeasonList>)
  vi.mocked(useSeasonView).mockImplementation(((_id: string, n?: number) => {
    if (n === undefined) {
      return { data: undefined, isPending: false, isError: false, isPlaceholderData: false, refetch: vi.fn() }
    }
    if (stale) {
      return { data: viewFor(s2, { chairs }), isPending: false, isError: false, isPlaceholderData: true, refetch: vi.fn() }
    }
    const found = list.seasons.find((s) => s.number === n)
    const season = found ?? list.seasons.find((s) => s.number === list.defaultSeason)!
    return {
      data: viewFor(season, { chairs, isFallback: !found }),
      isPending: false, isError: false, isPlaceholderData: false, refetch: vi.fn(),
    }
  }) as unknown as typeof useSeasonView)
}

function Probe() {
  const loc = useLocation()
  const nav = useNavigate()
  return (
    <div>
      <div data-testid="loc">{loc.pathname + loc.search}</div>
      <button onClick={() => nav(-1)}>go-back</button>
    </div>
  )
}

function renderPage(url = '/communities/test-slug', entries: string[] = []) {
  return render(
    <MemoryRouter initialEntries={[...entries, url]} initialIndex={entries.length}>
      <Routes>
        <Route path="/communities/:slug" element={<><CommunityHubPage /><Probe /></>} />
        <Route path="/earlier" element={<Probe />} />
      </Routes>
    </MemoryRouter>,
  )
}

function requestedSeasons(): unknown[] {
  return vi.mocked(useSeasonView).mock.calls.map((c) => c[1])
}

beforeEach(() => {
  lifecycle.mounts = 0
  lifecycle.unmounts = 0
  chairs = [plainChair]
  stale = false
  communityState.slug = 'test-slug'
  Element.prototype.scrollIntoView = vi.fn()
})
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.clearAllMocks()
})

describe('CommunityHubPage seasons', () => {
  it('defaults to the default season and honours ?season=', () => {
    mockSeasons({ seasons: [s1, s2], defaultSeason: 2 })
    renderPage()
    expect(screen.getByText('Question for Season Two')).toBeInTheDocument()
    cleanup()
    renderPage('/communities/test-slug?season=1')
    expect(screen.getByText('Question for Season One')).toBeInTheDocument()
  })

  it.each(['abc', '-1', '0', '1.5'])('never requests ?season=%s and says the requested season was not available', (bad) => {
    mockSeasons({ seasons: [s1, s2], defaultSeason: 2 })
    renderPage(`/communities/test-slug?season=${bad}`)
    expect(new Set(requestedSeasons())).toEqual(new Set([2]))
    expect(screen.getByText('Question for Season Two')).toBeInTheDocument()
    const notice = screen.getByTestId('season-fallback')
    expect(notice).toHaveTextContent('The season you asked for is not available. You are reading Season Two instead.')
    const question = screen.getByText('Question for Season Two')
    expect(notice.compareDocumentPosition(question) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('treats a bare ?season= as absent and shows no notice', () => {
    mockSeasons({ seasons: [s1, s2], defaultSeason: 2 })
    renderPage('/communities/test-slug?season=')
    expect(new Set(requestedSeasons())).toEqual(new Set([2]))
    expect(screen.queryByTestId('season-fallback')).not.toBeInTheDocument()
  })

  it('shows no notice for a valid or absent ?season=', () => {
    mockSeasons({ seasons: [s1, s2], defaultSeason: 2 })
    renderPage('/communities/test-slug?season=1')
    expect(screen.queryByTestId('season-fallback')).not.toBeInTheDocument()
    cleanup()
    renderPage()
    expect(screen.queryByTestId('season-fallback')).not.toBeInTheDocument()
  })

  it('passes an unknown positive season to the API and shows what is on screen', () => {
    mockSeasons({ seasons: [s1, s2], defaultSeason: 2 })
    renderPage('/communities/test-slug?season=999')
    expect(requestedSeasons()).toContain(999)
    // Selector follows the season actually shown, not the one requested.
    expect(screen.getByLabelText('Season')).toHaveValue('2')
    // The fallback notice precedes the question.
    const notice = screen.getByTestId('season-fallback')
    const question = screen.getByText('Question for Season Two')
    expect(notice.compareDocumentPosition(question) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('updates ?season= with replace, so back skips season changes', () => {
    mockSeasons({ seasons: [s1, s2], defaultSeason: 2 })
    renderPage('/communities/test-slug', ['/earlier'])
    fireEvent.change(screen.getByLabelText('Season'), { target: { value: '1' } })
    expect(screen.getByTestId('loc')).toHaveTextContent('?season=1')
    fireEvent.click(screen.getByText('go-back'))
    expect(screen.getByTestId('loc')).toHaveTextContent(/^\/earlier$/)
  })

  it('keeps ?season= when a renamed slug is redirected to the canonical one', () => {
    mockSeasons({ seasons: [s1, s2], defaultSeason: 2 })
    renderPage('/communities/old-slug?season=1')
    expect(screen.getByTestId('loc')).toHaveTextContent('/communities/test-slug?season=1')
  })

  it('replaces rather than pushes history on the slug redirect', () => {
    mockSeasons({ seasons: [s1, s2], defaultSeason: 2 })
    renderPage('/communities/old-slug?season=1', ['/earlier'])
    expect(screen.getByTestId('loc')).toHaveTextContent('/communities/test-slug?season=1')
    fireEvent.click(screen.getByText('go-back'))
    expect(screen.getByTestId('loc')).toHaveTextContent("/earlier")
  })

  it('does not mark fresh content as stale', () => {
    mockSeasons({ seasons: [s1, s2], defaultSeason: 2 })
    const { container } = renderPage()
    expect(screen.getByText('Question for Season Two')).toBeInTheDocument()
    expect(container.querySelectorAll('[aria-busy="true"]')).toHaveLength(0)
    expect(container.querySelectorAll('.opacity-50')).toHaveLength(0)
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

  it('marks the previous season stale while the next one loads', () => {
    mockSeasons({ seasons: [s1, s2], defaultSeason: 2 })
    stale = true
    const { container } = renderPage('/communities/test-slug?season=1')
    // Old content stays visible but is marked busy; the selector shows the request.
    expect(screen.getByText('Question for Season Two')).toBeInTheDocument()
    expect(screen.getByLabelText('Season')).toHaveValue('1')
    const busy = container.querySelectorAll('[aria-busy="true"]')
    expect(busy.length).toBeGreaterThanOrEqual(2)
    busy.forEach((el) => expect(el.className).toMatch(/opacity-50/))
  })

  it('renders a chair with no description as plain text and opens no empty panel', () => {
    mockSeasons({ seasons: [s1, s2], defaultSeason: 2 })
    const { container } = renderPage()
    fireEvent.click(screen.getByText('Chair with no description'))
    expect(screen.getByText('Chair with no description')).toBeInTheDocument()
    expect(container.textContent).not.toMatch(/null|▼|▲|Example Perspectives/)
  })

  it.each([[0.9, ['Chair A', 'Chair B', 'Chair C']], [0.1, ['Chair C', 'Chair B', 'Chair A']]])(
    'with Math.random()=%s lists the ladder in one of its two orders, then reverses on Invert',
    (rand, expected) => {
      vi.spyOn(Math, 'random').mockReturnValue(rand)
      chairs = ['Chair A', 'Chair B', 'Chair C'].map((text) => ({ ...plainChair, text }))
      mockSeasons({ seasons: [s1, s2], defaultSeason: 2 })
      renderPage()
      const shown = () => screen.getAllByText(/^Chair [ABC]$/).map((e) => e.textContent)
      expect(shown()).toEqual(expected)
      fireEvent.click(screen.getByText('Invert'))
      expect(shown()).toEqual([...expected].reverse())
    },
  )

  it.each([0.1, 0.9])('shows the Invert button inactive on a fresh mount whichever way the seed landed (%s)', (rand) => {
    vi.spyOn(Math, 'random').mockReturnValue(rand)
    chairs = ['Chair A', 'Chair B'].map((text) => ({ ...plainChair, text }))
    mockSeasons({ seasons: [s1, s2], defaultSeason: 2 })
    renderPage()
    const btn = screen.getByRole('button', { name: /Invert/ })
    expect(btn).toHaveAttribute('aria-pressed', 'false')
    expect(btn.className).not.toMatch(/bg-ev-teal/)
    expect(btn).toHaveAttribute('title', 'Flip the order')
    fireEvent.click(btn)
    expect(btn).toHaveAttribute('aria-pressed', 'true')
    expect(btn.className).toMatch(/bg-ev-teal/)
    expect(btn).toHaveAttribute('title', 'Restore the order shown')
    expect(btn.getAttribute('title')).not.toMatch(/regular/i)
  })

  it('offers no Invert button for a single chair', () => {
    mockSeasons({ seasons: [s1, s2], defaultSeason: 2 })
    renderPage()
    expect(screen.queryByText('Invert')).not.toBeInTheDocument()
  })

  it('keeps an expanded card on its own chair when Invert reorders the list', () => {
    chairs = [
      { ...plainChair, text: 'Chair A', description: 'Detail A' },
      { ...plainChair, text: 'Chair B', description: 'Detail B' },
    ]
    mockSeasons({ seasons: [s1, s2], defaultSeason: 2 })
    renderPage()
    fireEvent.click(screen.getByText('Chair A'))
    expect(screen.getByText('Detail A')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Invert'))
    // The expanded card moved with its chair: Detail A sits directly under Chair A.
    const a = screen.getByText('Chair A').closest('div[class*="border"]')!
    expect(a).toContainElement(screen.getByText('Detail A'))
    expect(screen.queryByText('Detail B')).not.toBeInTheDocument()
  })

  it('still renders the forum when the topic has no seasons', () => {
    mockSeasons({ seasons: [], defaultSeason: null })
    renderPage('/communities/test-slug?season=3')
    expect(screen.getByText(/no published question yet/)).toBeInTheDocument()
    expect(screen.getByText('Discussion')).toBeInTheDocument()
    expect(screen.getByText('forum-form')).toBeInTheDocument()
  })

  it('renders each change marker beside its own chair, including after Invert', () => {
    chairs = [
      { ...plainChair, text: 'Chair A', changeSince: 'carried' },
      { ...plainChair, text: 'Chair B', changeSince: 'reworded' },
      { ...plainChair, text: 'Chair C', changeSince: null },
    ]
    mockSeasons({ seasons: [s1, s2], defaultSeason: 2 })
    renderPage()
    const check = () => {
      const card = (t: string) => screen.getByText(t).closest('div[class*="border"]') as HTMLElement
      expect(card('Chair A')).toHaveTextContent('Carried from the previous season')
      expect(card('Chair B')).toHaveTextContent('Reworded since the previous season')
      expect(card('Chair C')).not.toHaveTextContent('previous season')
    }
    check()
    fireEvent.click(screen.getByText('Invert'))
    check()
  })

  it('says so when a loaded season has no chairs', () => {
    chairs = []
    mockSeasons({ seasons: [s1, s2], defaultSeason: 2 })
    renderPage()
    expect(screen.getByText('No perspectives were recorded for this season.')).toBeInTheDocument()
    expect(screen.queryByText(/No perspectives have been published for this topic yet/)).not.toBeInTheDocument()
    expect(screen.queryByText('Failed to load perspectives')).not.toBeInTheDocument()
  })

  it('does not show the error block above chairs when only the season list failed', () => {
    chairs = [{ ...plainChair, text: 'Chair A' }]
    mockSeasons({ seasons: [s1, s2], defaultSeason: 2 })
    vi.mocked(useSeasonList).mockReturnValue({
      data: undefined, isPending: false, isError: true, isSuccess: false, refetch: vi.fn(),
    } as unknown as ReturnType<typeof useSeasonList>)
    renderPage('/communities/test-slug?season=2')
    expect(screen.getByText('Chair A')).toBeInTheDocument()
    expect(screen.queryByText('Failed to load perspectives')).not.toBeInTheDocument()
    expect(screen.queryByText('No perspectives were recorded for this season.')).not.toBeInTheDocument()
  })

  it('shows the skeleton, not the empty-season copy, while switching away from an empty season', () => {
    chairs = []
    stale = true
    mockSeasons({ seasons: [s1, s2], defaultSeason: 2 })
    const { container } = renderPage('/communities/test-slug?season=1')
    expect(screen.queryByText('No perspectives were recorded for this season.')).not.toBeInTheDocument()
    expect(container.querySelectorAll('.react-loading-skeleton').length).toBeGreaterThan(0)
  })

  it('does not show the error block above the skeleton while the detail request is in flight', () => {
    mockSeasons({ seasons: [s1, s2], defaultSeason: 2 })
    vi.mocked(useSeasonList).mockReturnValue({
      data: undefined, isPending: false, isError: true, isSuccess: false, refetch: vi.fn(),
    } as unknown as ReturnType<typeof useSeasonList>)
    vi.mocked(useSeasonView).mockReturnValue({
      data: undefined, isPending: true, isError: false, isPlaceholderData: false, refetch: vi.fn(),
    } as unknown as ReturnType<typeof useSeasonView>)
    const { container } = renderPage('/communities/test-slug?season=2')
    expect(screen.queryByText('Failed to load perspectives')).not.toBeInTheDocument()
    expect(container.querySelectorAll('.react-loading-skeleton').length).toBeGreaterThan(0)
  })

})
