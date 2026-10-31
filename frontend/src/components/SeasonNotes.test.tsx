import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { SeasonNotes } from './SeasonNotes'
import type { SeasonView } from '../types'

afterEach(cleanup)

function makeView(over: Partial<SeasonView> = {}): SeasonView {
  return {
    season: { number: 1, name: 'Test Season', status: 'open', openedAt: null, closedAt: null },
    questionText: 'Test question',
    changeClass: null,
    seasonNote: null,
    topicNote: null,
    rationale: null,
    isFallback: false,
    chairs: [],
    ...over,
  }
}

describe('SeasonNotes', () => {
  it('renders the season note above the topic note', () => {
    render(<SeasonNotes view={makeView({ seasonNote: 'SEASON-NOTE-X', topicNote: 'TOPIC-NOTE-X' })} />)
    const season = screen.getByText('SEASON-NOTE-X')
    const topic = screen.getByText('TOPIC-NOTE-X')
    expect(season.compareDocumentPosition(topic) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('renders nothing when both notes are absent', () => {
    const { container } = render(<SeasonNotes view={makeView()} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('labels a clarifying change differently from a substantive one', () => {
    const { container, rerender } = render(<SeasonNotes view={makeView({ changeClass: 'clarifying' })} />)
    const clarifying = container.textContent
    expect(clarifying).toMatch(/clarifying/i)
    rerender(<SeasonNotes view={makeView({ changeClass: 'substantive' })} />)
    const substantive = container.textContent
    expect(substantive).toMatch(/substantive/i)
    expect(substantive).not.toBe(clarifying)
  })

  it('labels all four change classes distinguishably', () => {
    const texts = (['editorial', 'clarifying', 'substantive'] as const).map((c) => {
      const { container, unmount } = render(<SeasonNotes view={makeView({ changeClass: c })} />)
      const t = container.textContent
      unmount()
      return t
    })
    expect(new Set(texts).size).toBe(3)
    const { container } = render(<SeasonNotes view={makeView({ changeClass: null, seasonNote: 'N' })} />)
    expect(container.textContent).not.toMatch(/editorial|clarifying|substantive/i)
  })

  it('shows the rationale only when present', () => {
    const { rerender } = render(<SeasonNotes view={makeView({ seasonNote: 'N' })} />)
    expect(screen.queryByText(/rationale/i)).not.toBeInTheDocument()
    rerender(<SeasonNotes view={makeView({ seasonNote: 'N', rationale: 'RATIONALE-X' })} />)
    expect(screen.getByText('RATIONALE-X')).toBeInTheDocument()
  })

  it('tells the reader when the shown season is a fallback', () => {
    const { rerender } = render(<SeasonNotes view={makeView({ seasonNote: 'N' })} />)
    expect(screen.queryByTestId('season-fallback')).not.toBeInTheDocument()
    rerender(<SeasonNotes view={makeView({ isFallback: true })} />)
    expect(screen.getByTestId('season-fallback')).toHaveTextContent(/not available.*Test Season/)
  })
})
