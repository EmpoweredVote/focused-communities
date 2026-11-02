import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup, renderHook, act } from '@testing-library/react'
import { useLadderDirection } from './useLadderDirection'

const LADDER = ['A', 'B', 'C', 'D', 'E']

function Ladder() {
  const { flipped, toggle } = useLadderDirection(LADDER.length)
  const shown = flipped ? [...LADDER].reverse() : LADDER
  return (
    <div>
      <button onClick={toggle}>toggle</button>
      <p data-testid="order">{shown.join('')}</p>
    </div>
  )
}
const order = () => screen.getByTestId('order').textContent

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('useLadderDirection', () => {
  it('presents the ladder in one of exactly two orders', () => {
    for (const r of [0, 0.25, 0.49, 0.5, 0.75, 0.99]) {
      vi.spyOn(Math, 'random').mockReturnValue(r)
      render(<Ladder />)
      expect(['ABCDE', 'EDCBA']).toContain(order())
      cleanup()
    }
  })

  it('is flipped below 0.5 and not flipped from 0.5 up', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.49)
    expect(renderHook(() => useLadderDirection(5)).result.current.flipped).toBe(true)
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
    expect(renderHook(() => useLadderDirection(5)).result.current.flipped).toBe(false)
  })

  it('preserves adjacency when flipped: reversed, never shuffled', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.9)
    render(<Ladder />)
    const regular = order()!
    fireEvent.click(screen.getByText('toggle'))
    expect(order()).toBe([...regular].reverse().join(''))
  })

  it('toggle flips the current direction', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.1)
    render(<Ladder />)
    expect(order()).toBe('EDCBA')
    fireEvent.click(screen.getByText('toggle'))
    expect(order()).toBe('ABCDE')
    fireEvent.click(screen.getByText('toggle'))
    expect(order()).toBe('EDCBA')
  })

  it('decides once per mount: re-renders do not re-roll', () => {
    const rand = vi.spyOn(Math, 'random').mockReturnValue(0.1)
    const { result, rerender } = renderHook(() => useLadderDirection(5))
    rand.mockReturnValue(0.9)
    rerender()
    rerender()
    expect(result.current.flipped).toBe(true)
    act(() => result.current.toggle())
    expect(result.current.flipped).toBe(false)
  })

  it('holds its direction when the chair count changes (a season switch)', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.1)
    const { result, rerender } = renderHook(({ n }) => useLadderDirection(n), { initialProps: { n: 5 } })
    expect(result.current.flipped).toBe(true)
    vi.spyOn(Math, 'random').mockReturnValue(0.9)
    rerender({ n: 4 })
    expect(result.current.flipped).toBe(true)
    rerender({ n: 5 })
    expect(result.current.flipped).toBe(true)
  })

  it('reports changed only when the reader flipped it away from the mount direction', () => {
    for (const r of [0.1, 0.9]) {
      vi.spyOn(Math, 'random').mockReturnValue(r)
      const { result, unmount } = renderHook(() => useLadderDirection(5))
      expect(result.current.changed).toBe(false)
      act(() => result.current.toggle())
      expect(result.current.changed).toBe(true)
      act(() => result.current.toggle())
      expect(result.current.changed).toBe(false)
      unmount()
    }
  })

  it('keeps no hidden state when there is nothing to flip', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.9)
    const { result, rerender } = renderHook(({ n }) => useLadderDirection(n), { initialProps: { n: 1 } })
    act(() => result.current.toggle())
    act(() => result.current.toggle())
    act(() => result.current.toggle())
    expect(result.current.flipped).toBe(false)
    expect(result.current.changed).toBe(false)
    rerender({ n: 5 })
    expect(result.current.flipped).toBe(false)
  })
})
