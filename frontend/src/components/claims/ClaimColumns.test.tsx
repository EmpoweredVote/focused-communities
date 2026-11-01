import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { ClaimColumns } from './ClaimColumns'
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

describe('ClaimColumns', () => {
  it('keeps both column headers visible when stacked narrow', () => {
    const { container } = render(<ClaimColumns supports={[]} opposes={[]} onOpen={vi.fn()} />)
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
      <ClaimColumns supports={[claim({ id: 'test-claim-s1' })]} opposes={[]} onOpen={vi.fn()} />,
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
        supports={[claim({ id: 'test-claim-s1', side: 'supports', body: 'Demo for body.' })]}
        opposes={[claim({ id: 'test-claim-o1', side: 'opposes', body: 'Demo against body.' })]}
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
        supports={[]}
        opposes={[claim({ id: 'test-claim-o1', side: 'opposes' })]}
        onOpen={onOpen}
      />,
    )
    fireEvent.click(screen.getByRole('button'))
    expect(onOpen).toHaveBeenCalledWith('test-claim-o1')
  })

  it('carries the side colour in the heading rule, never in the heading text (R74, R76)', () => {
    render(<ClaimColumns supports={[]} opposes={[]} onOpen={vi.fn()} />)
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
    render(<ClaimColumns supports={[]} opposes={[]} onOpen={vi.fn()} />)
    expect(screen.getByRole('region', { name: 'Supports' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Opposes' })).toBeInTheDocument()
  })
})
