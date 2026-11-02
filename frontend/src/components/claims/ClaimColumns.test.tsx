import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { ClaimColumns, type ColumnFeed } from './ClaimColumns'
import type { Claim } from '../../types'

afterEach(cleanup)

// Synthetic throughout — see the note in ClaimCard.test.tsx.
const base: Claim = {
  id: 'test-claim-a',
  side: 'supports',
  body: 'Demo supporting argument body.',
  authorPseudonym: 'Demo Heron',
  impact: 5,
  ratingCount: 0,
  childSupports: 0,
  childOpposes: 0,
  isHidden: false,
  mergedInto: null,
  createdAt: new Date(0).toISOString(),
  updatedAt: new Date(0).toISOString(),
  myRating: null,
}

const claim = (over: Partial<Claim> = {}): Claim => ({ ...base, ...over })

// A column that came back whole: what it holds is all there is. Every test that
// wants a partial column says so explicitly, which is the distinction the
// component now has to keep.
const feed = (over: Partial<ColumnFeed> = {}): ColumnFeed => ({
  claims: [],
  total: 0,
  hasMore: false,
  isFetching: false,
  error: null,
  requestPath: null,
  onShowMore: vi.fn(),
  ...over,
})

describe('ClaimColumns', () => {
  it('keeps both column headers visible when stacked narrow', () => {
    const { container } = render(<ClaimColumns supports={feed()} opposes={feed()} onOpen={vi.fn()} />)
    const headings = screen.getAllByRole('heading')
    expect(headings.map((h) => h.textContent)).toEqual(['Supports', 'Opposes'])
    // Neither heading may be hidden at any width: no responsive hide utility,
    // and no aria-hidden standing in for one.
    for (const h of headings) {
      expect(h).toBeVisible()
      expect(h.className).not.toMatch(/\bhidden\b|:hidden\b/)
      expect(h.getAttribute('aria-hidden')).toBeNull()
    }
    // The split itself stacks rather than disappearing.
    const grid = container.querySelector('[data-claim-columns]')!
    expect(grid.className).toContain('grid-cols-1')
    expect(grid.className).toContain('sm:grid-cols-2')
  })

  it('renders an empty column without collapsing the split', () => {
    const { container } = render(
      <ClaimColumns supports={feed({ claims: [claim({ id: 'test-claim-s1' })], total: 1 })} opposes={feed()} onOpen={vi.fn()} />,
    )
    expect(container.querySelectorAll('[data-column]')).toHaveLength(2)
    for (const column of container.querySelectorAll('[data-column]')) expect(column).toBeVisible()
    expect(screen.getByText('Opposes')).toBeVisible()
    expect(screen.getByText('No opposing arguments yet.')).toBeVisible()
    expect(screen.queryByText('No supporting arguments yet.')).not.toBeInTheDocument()
  })

  it('puts each claim in the column for its side', () => {
    const { container } = render(
      <ClaimColumns
        supports={feed({ claims: [claim({ id: 'test-claim-s1', side: 'supports', body: 'Demo for body.' })], total: 1 })}
        opposes={feed({ claims: [claim({ id: 'test-claim-o1', side: 'opposes', body: 'Demo against body.' })], total: 1 })}
        onOpen={vi.fn()}
      />,
    )
    const supports = container.querySelector('[data-column="supports"]')!
    const opposes = container.querySelector('[data-column="opposes"]')!
    expect(supports.textContent).toContain('Demo for body.')
    expect(supports.textContent).not.toContain('Demo against body.')
    expect(opposes.textContent).toContain('Demo against body.')
    expect(opposes.textContent).not.toContain('Demo for body.')
  })

  it('passes the clicked claim id up', () => {
    const onOpen = vi.fn()
    render(
      <ClaimColumns
        supports={feed()}
        opposes={feed({ claims: [claim({ id: 'test-claim-o1', side: 'opposes' })], total: 1 })}
        onOpen={onOpen}
      />,
    )
    fireEvent.click(screen.getByRole('button'))
    expect(onOpen).toHaveBeenCalledWith('test-claim-o1')
  })

  it('carries the side colour in the heading rule, never in the heading text (R74, R76)', () => {
    render(<ClaimColumns supports={feed()} opposes={feed()} onOpen={vi.fn()} />)
    const [supports, opposes] = screen.getAllByRole('heading')
    expect(supports.className).toContain('border-claim-supports')
    expect(opposes.className).toContain('border-claim-opposes')
    for (const h of [supports, opposes]) {
      // Opposes reads at 3.14:1 on white — a rule, not a text colour.
      expect(h.className).not.toMatch(/text-claim-/)
      expect(h.className).not.toMatch(/ev-teal|ev-coral/)
    }
  })

  it('names each column region in text for assistive technology', () => {
    render(<ClaimColumns supports={feed()} opposes={feed()} onOpen={vi.fn()} />)
    expect(screen.getByRole('region', { name: 'Supports' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Opposes' })).toBeInTheDocument()
  })
})

describe('ClaimColumns — a column that is only part of its side (C2)', () => {
  it('offers a way to the rest instead of drawing a prefix as the whole side', () => {
    const onShowMore = vi.fn()
    render(
      <ClaimColumns
        supports={feed({ claims: [claim({ id: 'test-claim-s1' })], total: 23, hasMore: true, onShowMore })}
        opposes={feed()}
        onOpen={vi.fn()}
      />,
    )
    const more = screen.getByRole('button', { name: 'Show more supporting arguments' })
    expect(more).toBeEnabled()
    fireEvent.click(more)
    expect(onShowMore).toHaveBeenCalledTimes(1)
    // The side that came back whole gets no control at all: an invitation to
    // load more of nothing is its own small falsehood.
    expect(screen.queryByRole('button', { name: /more opposing/ })).not.toBeInTheDocument()
  })

  it('says nothing is there only when nothing is there', () => {
    // An empty page under a non-zero count is the contradiction the old code
    // printed as "No supporting arguments yet." two lines under "23
    // supporting". It is still an empty column; what it may not do is assert
    // the absence.
    render(
      <ClaimColumns
        supports={feed({ claims: [], total: 23 })}
        opposes={feed({ claims: [], total: 0 })}
        onOpen={vi.fn()}
      />,
    )
    expect(screen.queryByText('No supporting arguments yet.')).not.toBeInTheDocument()
    expect(screen.getByText(/counted as having 23 supporting arguments/)).toBeVisible()
    expect(screen.getByText('No opposing arguments yet.')).toBeVisible()
  })

  it('does not call a column empty while there is a cursor behind it', () => {
    render(
      <ClaimColumns
        supports={feed({ claims: [], total: 0, hasMore: true })}
        opposes={feed()}
        onOpen={vi.fn()}
      />,
    )
    expect(screen.queryByText('No supporting arguments yet.')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Show more supporting arguments' })).toBeInTheDocument()
  })

  it('refuses a second request while one is in flight, and says it is loading', () => {
    const onShowMore = vi.fn()
    render(
      <ClaimColumns
        supports={feed({ claims: [claim()], total: 9, hasMore: true, isFetching: true, onShowMore })}
        opposes={feed()}
        onOpen={vi.fn()}
      />,
    )
    const more = screen.getByRole('button', { name: 'Loading more supporting arguments…' })
    expect(more).toBeDisabled()
    fireEvent.click(more)
    expect(onShowMore).not.toHaveBeenCalled()
  })

  it('reports a failed page with its URL and keeps the way back open', () => {
    render(
      <ClaimColumns
        supports={feed({
          claims: [claim()],
          total: 9,
          hasMore: true,
          error: 'Request failed (500)',
          requestPath: '/api/claims/test-claim-a?supportsCursor=test-cursor',
        })}
        opposes={feed()}
        onOpen={vi.fn()}
      />,
    )
    const alert = screen.getByRole('alert')
    expect(alert.textContent).toMatch(/only part of what is there/)
    expect(alert.textContent).toContain('/api/claims/test-claim-a?supportsCursor=test-cursor')
    expect(alert.textContent).toContain('Request failed (500)')
    // A failure is not a reason to drop the control that would retry it.
    expect(screen.getByRole('button', { name: 'Show more supporting arguments' })).toBeInTheDocument()
  })
})
