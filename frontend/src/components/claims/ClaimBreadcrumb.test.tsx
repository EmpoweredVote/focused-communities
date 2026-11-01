import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { ClaimBreadcrumb, ClaimParamNotice } from './ClaimBreadcrumb'
import type { BreadcrumbItem } from '../../types'

afterEach(cleanup)

// Synthetic throughout: ids start with "test-" and every body is obvious filler.
// Nothing here may look like a real claim, a real person or a real id.
const step = (n: number, over: Partial<BreadcrumbItem> = {}): BreadcrumbItem => ({
  id: `test-step-${n}`,
  body: `Demo step ${n} body.`,
  side: n === 0 ? null : n % 2 === 0 ? 'supports' : 'opposes',
  ...over,
})

const trailOf = (n: number): BreadcrumbItem[] => Array.from({ length: n }, (_, i) => step(i))

function stepButtons(): HTMLElement[] {
  return Array.from(
    screen.getByRole('navigation').querySelectorAll<HTMLElement>('button[data-step]'),
  )
}

describe('ClaimBreadcrumb', () => {
  it('renders the trail root-first', () => {
    render(<ClaimBreadcrumb trail={trailOf(3)} onJump={vi.fn()} />)
    // The API sends the trail root-first already (ordered by array_position on
    // the path). Rendering it in any other order is the bug this pins.
    const buttons = stepButtons()
    expect(buttons.map((b) => b.getAttribute('data-step'))).toEqual([
      'test-step-0',
      'test-step-1',
      'test-step-2',
    ])
    expect(buttons.map((b) => b.textContent)).toEqual([
      expect.stringContaining('Demo step 0 body.'),
      expect.stringContaining('Demo step 1 body.'),
      expect.stringContaining('Demo step 2 body.'),
    ])
  })

  it('claims nothing about how complete the trail is', () => {
    // The trail truncates at the deep end and nothing in the payload says so,
    // so no step may be introduced to the reader as the root or the parent.
    render(<ClaimBreadcrumb trail={trailOf(3)} onJump={vi.fn()} />)
    const nav = screen.getByRole('navigation')
    expect(nav.textContent).not.toMatch(/parent|root|top of|full|whole|complete/i)
    expect(nav.getAttribute('aria-label')).not.toMatch(/parent|root|full|complete/i)
  })

  it('jumps to an ancestor when one is clicked', () => {
    const onJump = vi.fn()
    render(<ClaimBreadcrumb trail={trailOf(3)} onJump={onJump} />)
    fireEvent.click(screen.getByText('Demo step 1 body.'))
    expect(onJump).toHaveBeenCalledTimes(1)
    expect(onJump).toHaveBeenCalledWith('test-step-1')

    fireEvent.click(screen.getByText('Demo step 0 body.'))
    expect(onJump).toHaveBeenLastCalledWith('test-step-0')
  })

  it('collapses the middle of a deep trail but keeps the first and last steps', () => {
    render(<ClaimBreadcrumb trail={trailOf(6)} onJump={vi.fn()} />)
    expect(screen.getByText('Demo step 0 body.')).toBeInTheDocument()
    expect(screen.getByText('Demo step 5 body.')).toBeInTheDocument()
    expect(screen.queryByText('Demo step 1 body.')).not.toBeInTheDocument()
    expect(screen.queryByText('Demo step 2 body.')).not.toBeInTheDocument()
    expect(screen.queryByText('Demo step 3 body.')).not.toBeInTheDocument()
    // Folding three steps out must say three, not merely that something is missing.
    expect(screen.getByRole('button', { name: /3 more steps/ })).toBeInTheDocument()
  })

  it('leaves a short trail whole', () => {
    render(<ClaimBreadcrumb trail={trailOf(4)} onJump={vi.fn()} />)
    expect(stepButtons()).toHaveLength(4)
    expect(screen.queryByRole('button', { name: /more step/ })).not.toBeInTheDocument()
  })

  it('unfolds the middle so every ancestor stays reachable', () => {
    const onJump = vi.fn()
    render(<ClaimBreadcrumb trail={trailOf(6)} onJump={onJump} />)
    fireEvent.click(screen.getByRole('button', { name: /3 more steps/ }))
    expect(stepButtons().map((b) => b.getAttribute('data-step'))).toEqual([
      'test-step-0',
      'test-step-1',
      'test-step-2',
      'test-step-3',
      'test-step-4',
      'test-step-5',
    ])
    fireEvent.click(screen.getByText('Demo step 2 body.'))
    expect(onJump).toHaveBeenCalledWith('test-step-2')
  })

  it('renders an empty-bodied step as a removed one and keeps it clickable', () => {
    // A hidden ancestor arrives as body: '' — the server never sends the text.
    // The step stays in the trail: dropping it would silently shorten the
    // reader's sense of how deep they are.
    const onJump = vi.fn()
    const trail = [step(0), step(1, { body: '' }), step(2)]
    render(<ClaimBreadcrumb trail={trail} onJump={onJump} />)
    expect(stepButtons()).toHaveLength(3)
    const removed = screen.getByText('Removed claim')
    expect(removed).toBeVisible()
    fireEvent.click(removed)
    expect(onJump).toHaveBeenCalledWith('test-step-1')
  })

  it('labels each side in text, not only colour', () => {
    render(<ClaimBreadcrumb trail={trailOf(3)} onJump={vi.fn()} />)
    const [root, first, second] = stepButtons()
    expect(root.getAttribute('data-side')).toBe('none')
    // A root has no side, so it gets no side word and no mark.
    expect(root.textContent).toBe('Demo step 0 body.')
    expect(first.getAttribute('data-side')).toBe('opposes')
    expect(first.textContent).toContain('Opposes:')
    expect(second.getAttribute('data-side')).toBe('supports')
    expect(second.textContent).toContain('Supports:')
  })

  it('renders nothing for a root claim, whose trail is empty', () => {
    const { container } = render(<ClaimBreadcrumb trail={[]} onJump={vi.fn()} />)
    expect(container).toBeEmptyDOMElement()
  })
})

describe('ClaimParamNotice', () => {
  it('tells a reader who followed a mangled link rather than quietly showing the root', () => {
    render(<ClaimParamNotice rejected />)
    expect(screen.getByTestId('claim-param-rejected')).toHaveTextContent(
      'The claim you asked for is not available. You are reading the top of this argument instead.',
    )
  })

  it('says nothing when the link named a usable claim', () => {
    const { container } = render(<ClaimParamNotice rejected={false} />)
    expect(container).toBeEmptyDOMElement()
  })
})
