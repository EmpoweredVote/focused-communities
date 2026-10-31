import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { StanceCard } from './StanceCard'

beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn()
})
afterEach(cleanup)

const base = {
  text: 'Test chair text',
  description: null as string | null,
  supportingPoints: [] as string[],
  examplePerspectives: [] as string[],
}

describe('StanceCard', () => {
  it('stays a plain card when the description is null: click opens nothing', () => {
    const { container } = render(<StanceCard stance={base} isHighlighted={false} />)
    fireEvent.click(screen.getByText('Test chair text'))
    expect(screen.getByText('Test chair text')).toBeInTheDocument()
    expect(container.textContent).not.toMatch(/null|▼|▲|Example Perspectives/)
    expect(container.firstElementChild!.className).not.toMatch(/cursor-pointer|hover:/)
    expect(container.querySelectorAll('p')).toHaveLength(1)
  })

  it('offers no expand affordance at all when there is no detail', () => {
    const { container } = render(<StanceCard stance={base} isHighlighted={false} />)
    const before = container.innerHTML
    fireEvent.click(screen.getByText('Test chair text'))
    expect(container.innerHTML).toBe(before)
    expect(container.querySelector('.mt-3')).toBeNull()
    expect(container.textContent).not.toMatch(/▼|▲/)
  })

  it('treats a whitespace-only description as absent', () => {
    const { container } = render(<StanceCard stance={{ ...base, description: '   ' }} isHighlighted={false} />)
    fireEvent.click(screen.getByText('Test chair text'))
    expect(container.querySelectorAll('p')).toHaveLength(1)
    expect(container.textContent).not.toMatch(/▼|▲/)
  })

  it('expands to show a description when there is one', () => {
    render(<StanceCard stance={{ ...base, description: 'Test deep dive' }} isHighlighted={false} />)
    expect(screen.queryByText('Test deep dive')).not.toBeInTheDocument()
    fireEvent.click(screen.getByText('Test chair text'))
    expect(screen.getByText('Test deep dive')).toBeInTheDocument()
  })

  it('is expandable with only supporting points and shows them as an unordered list', () => {
    const { container } = render(
      <StanceCard stance={{ ...base, supportingPoints: ['Point one', 'Point two'] }} isHighlighted={false} />,
    )
    expect(screen.queryByText('Point one')).not.toBeInTheDocument()
    fireEvent.click(screen.getByText('Test chair text'))
    expect(screen.getByText('Supporting Points')).toBeInTheDocument()
    expect(screen.getByText('Point one')).toBeInTheDocument()
    expect(screen.getByText('Point two')).toBeInTheDocument()
    expect(container.querySelector('ol')).toBeNull()
    expect(container.querySelectorAll('ul > li')).toHaveLength(2)
  })

  it('shows description, supporting points, then example perspectives in that order', () => {
    const { container } = render(
      <StanceCard
        stance={{ ...base, description: 'Desc text', supportingPoints: ['Point text'], examplePerspectives: ['Example text'] }}
        isHighlighted={false}
      />,
    )
    fireEvent.click(screen.getByText('Test chair text'))
    const text = container.textContent!
    const order = ['Desc text', 'Supporting Points', 'Point text', 'Example Perspectives', 'Example text'].map((t) =>
      text.indexOf(t),
    )
    expect(order.every((i) => i >= 0)).toBe(true)
    expect(order).toEqual([...order].sort((a, b) => a - b))
  })

  it('renders no headed section for empty or whitespace-only arrays', () => {
    const { container } = render(
      <StanceCard
        stance={{ ...base, supportingPoints: ['', '  '], examplePerspectives: [' '] }}
        isHighlighted={false}
      />,
    )
    fireEvent.click(screen.getByText('Test chair text'))
    expect(container.textContent).not.toMatch(/Supporting Points|Example Perspectives|▼|▲/)
    expect(container.querySelector('ul')).toBeNull()
  })
})
