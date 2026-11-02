/// <reference types="node" />
import { describe, it, expect, afterEach, vi } from 'vitest'
// tsconfig.app.json lists only vite/client, so node's types are pulled in here
// explicitly. This file reads the token sheet off disk: `?raw` would be cleaner
// but the Tailwind plugin owns .css and hands back an empty string.
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { ClaimCard } from './ClaimCard'
import type { Claim } from '../../types'

afterEach(cleanup)

// Synthetic throughout: ids start with "test-", every pseudonym is an obvious
// "Demo" one, and the timestamps are the epoch. Nothing here may look like a
// real person, a real quote or a real id.
const base: Claim = {
  id: 'test-claim-a',
  side: 'supports',
  body: 'Demo argument body standing in for a real one.',
  authorPseudonym: 'Demo Heron',
  impact: 5,
  ratingCount: 2,
  childSupports: 0,
  childOpposes: 0,
  isHidden: false,
  mergedInto: null,
  createdAt: new Date(0).toISOString(),
  updatedAt: new Date(0).toISOString(),
  myRating: null,
}

const claim = (over: Partial<Claim> = {}): Claim => ({ ...base, ...over })

describe('ClaimCard', () => {
  it('labels each side in text, not only colour', () => {
    const { container: sup } = render(<ClaimCard claim={claim({ side: 'supports' })} onOpen={vi.fn()} />)
    expect(screen.getByText('Supports')).toBeInTheDocument()
    const supCard = sup.querySelector('[data-side]')!
    expect(supCard.getAttribute('data-side')).toBe('supports')

    cleanup()

    const { container: opp } = render(<ClaimCard claim={claim({ side: 'opposes' })} onOpen={vi.fn()} />)
    expect(screen.getByText('Opposes')).toBeInTheDocument()
    const oppCard = opp.querySelector('[data-side]')!
    expect(oppCard.getAttribute('data-side')).toBe('opposes')

    // R77: the two sides must still differ with colour removed. The border
    // style is the non-colour carrier, so the two cards' border-left-style
    // must not be the same utility.
    expect(supCard.className).toContain('border-left-style:solid')
    expect(oppCard.className).toContain('border-left-style:dashed')
    expect(supCard.className).toContain('border-l-claim-supports')
    expect(oppCard.className).toContain('border-l-claim-opposes')
  })

  it('keeps the side colour out of text, and brand tokens out of the card (R74, R76)', () => {
    // #FF5740 is 3.14:1 on white: fine for a border, short of 4.5:1 for text.
    // And a card that reaches for --color-ev-teal is a card that goes dark at
    // 2.66:1 the moment someone turns dark mode on.
    for (const side of ['supports', 'opposes'] as const) {
      const { container } = render(<ClaimCard claim={claim({ side })} onOpen={vi.fn()} />)
      for (const el of container.querySelectorAll<HTMLElement>('*')) {
        expect(el.className).not.toMatch(/text-claim-/)
        expect(el.className).not.toMatch(/ev-teal|ev-coral/)
      }
      cleanup()
    }
  })

  it('shows the per-side child counts', () => {
    render(<ClaimCard claim={claim({ childSupports: 3, childOpposes: 1 })} onOpen={vi.fn()} />)
    expect(screen.getByText(/3 supporting/)).toBeInTheDocument()
    expect(screen.getByText(/1 opposing/)).toBeInTheDocument()
  })

  it('renders a tombstone for a hidden claim and keeps its counts', () => {
    render(
      <ClaimCard
        claim={claim({ isHidden: true, body: '', authorPseudonym: 'Demo Juniper', childSupports: 2, childOpposes: 4 })}
        onOpen={vi.fn()}
      />,
    )
    expect(screen.getByText('This claim was removed.')).toBeVisible()
    // The structure survives hiding even when the text does not. Visible, not
    // merely present: a `hidden` attribute on the counts would read the same to
    // toBeInTheDocument and show a reader nothing.
    expect(screen.getByText(/2 supporting/)).toBeVisible()
    expect(screen.getByText(/4 opposing/)).toBeVisible()
    // A removed claim carries no byline and no rating readout.
    expect(screen.queryByText('Demo Juniper')).not.toBeInTheDocument()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('never prints the impact figure (R78)', () => {
    const { container } = render(
      <ClaimCard
        claim={claim({ impact: 7.25, ratingCount: 3, childSupports: 0, childOpposes: 0 })}
        onOpen={vi.fn()}
      />,
    )
    // 7.25 and its parts must appear nowhere a reader can see them.
    expect(container.textContent).not.toMatch(/7/)
    expect(container.textContent).not.toMatch(/\.25/)
    const bar = screen.getByRole('img')
    expect(bar.getAttribute('aria-label')).toBe('Impact so far: high')
    expect(bar.getAttribute('aria-label')).not.toMatch(/\d/)
  })

  it('renders exactly one impact bar, and no control nested in its button', () => {
    // The card draws no bar of its own any more; it renders ImpactControl, and
    // there must be one of those and one bar inside it. A second readout of the
    // same quantity is the failure this pins.
    const { container } = render(<ClaimCard claim={claim({ ratingCount: 3 })} onOpen={vi.fn()} />)
    expect(container.querySelectorAll('[data-impact-control]')).toHaveLength(1)
    expect(container.querySelectorAll('[role="img"]')).toHaveLength(1)
    // A card is itself a <button>, so it may hold no interactive descendant.
    const card = screen.getByRole('button')
    expect(card.querySelectorAll('input, fieldset, button, a, select, textarea')).toHaveLength(0)
  })

  it('describes impact qualitatively across the band', () => {
    render(<ClaimCard claim={claim({ impact: 2, ratingCount: 1 })} onOpen={vi.fn()} />)
    expect(screen.getByRole('img').getAttribute('aria-label')).toBe('Impact so far: low')
    cleanup()
    render(<ClaimCard claim={claim({ impact: 5, ratingCount: 1 })} onOpen={vi.fn()} />)
    expect(screen.getByRole('img').getAttribute('aria-label')).toBe('Impact so far: moderate')
  })

  it('says nobody has rated it rather than drawing a neutral bar', () => {
    // impact is still 5 when ratingCount is 0, so a bar alone would read the
    // same as "opinion is split". It must not.
    render(<ClaimCard claim={claim({ impact: 5, ratingCount: 0 })} onOpen={vi.fn()} />)
    expect(screen.getByText('Not yet rated')).toBeInTheDocument()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()

    cleanup()
    render(<ClaimCard claim={claim({ impact: 5, ratingCount: 4 })} onOpen={vi.fn()} />)
    expect(screen.queryByText('Not yet rated')).not.toBeInTheDocument()
    expect(screen.getByRole('img')).toBeInTheDocument()
  })

  it('omits the byline when authorPseudonym is null rather than inventing one', () => {
    const { container } = render(<ClaimCard claim={claim({ authorPseudonym: null })} onOpen={vi.fn()} />)
    expect(container.querySelector('[data-byline]')).toBeNull()
    cleanup()
    // Same with something else in the byline row: a fallback name must not
    // appear just because the row has another reason to exist.
    const { container: merged } = render(
      <ClaimCard claim={claim({ authorPseudonym: null, mergedInto: 'test-claim-elsewhere' })} onOpen={vi.fn()} />,
    )
    expect(merged.querySelector('[data-byline]')).toBeNull()
    cleanup()
    const { container: named } = render(<ClaimCard claim={claim({ authorPseudonym: 'Demo Heron' })} onOpen={vi.fn()} />)
    expect(named.querySelector('[data-byline]')!.textContent).toBe('Demo Heron')
  })

  it('renders a root claim (side null) without a side label and without crashing', () => {
    const { container } = render(
      <ClaimCard claim={claim({ side: null, authorPseudonym: null })} onOpen={vi.fn()} />,
    )
    expect(container.querySelector('[data-side]')!.getAttribute('data-side')).toBe('none')
    expect(screen.queryByText('Supports')).not.toBeInTheDocument()
    expect(screen.queryByText('Opposes')).not.toBeInTheDocument()
  })

  it('renders a merged claim as an ordinary card, without following the merge', () => {
    render(<ClaimCard claim={claim({ mergedInto: 'test-claim-elsewhere' })} onOpen={vi.fn()} />)
    expect(screen.getByText('Demo argument body standing in for a real one.')).toBeInTheDocument()
    expect(screen.getByText('Merged into another claim')).toBeInTheDocument()
    // The target may not be on screen; never print the id.
    expect(screen.queryByText(/test-claim-elsewhere/)).not.toBeInTheDocument()
  })

  it('opens the claim by id on click and from the keyboard', () => {
    const onOpen = vi.fn()
    render(<ClaimCard claim={claim({ id: 'test-claim-b' })} onOpen={onOpen} />)
    const card = screen.getByRole('button')
    fireEvent.click(card)
    expect(onOpen).toHaveBeenCalledWith('test-claim-b')
    expect(card.tagName).toBe('BUTTON')
  })
})

describe('claim side tokens (R74, R75)', () => {
  // Vitest's root is `frontend/` — vitest.config.ts lives there.
  const css = readFileSync(resolve(process.cwd(), 'src/index.css'), 'utf8')

  it('defines semantic side tokens rather than using brand colours directly', () => {
    expect(css).toMatch(/--color-claim-supports:\s*var\(--color-ev-teal\)/)
    expect(css).toMatch(/--color-claim-opposes:\s*var\(--color-ev-coral\)/)
  })

  it('remaps supports in dark mode, where ev-teal is 2.66:1 on the card', () => {
    const dark = css.slice(css.indexOf('html.dark'))
    expect(dark).toMatch(/--color-claim-supports:\s*var\(--color-ev-teal-light\)/)
    expect(dark).not.toMatch(/--color-claim-supports:\s*var\(--color-ev-teal\)\s*;/)
  })
})
