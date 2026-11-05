import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, cleanup } from '@testing-library/react'
import { useDraft } from './useDraft'

// This hook had no test while it was the one place a half-written reply or
// claim survives a navigation. It is covered now because the key-change path
// moved out of an effect and into the render, and that path is the one with
// something to get wrong: the key changes WITHOUT a remount, so nothing else
// resets the state.

beforeEach(() => {
  localStorage.clear()
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
  cleanup()
})

describe('useDraft', () => {
  it('starts from what localStorage already holds', () => {
    localStorage.setItem('draft-a', 'saved earlier')
    const { result } = renderHook(() => useDraft('draft-a'))
    expect(result.current[0]).toBe('saved earlier')
  })

  it('starts empty when there is no draft', () => {
    const { result } = renderHook(() => useDraft('draft-a'))
    expect(result.current[0]).toBe('')
  })

  it('writes after the debounce, not before', () => {
    const { result } = renderHook(() => useDraft('draft-a'))
    act(() => result.current[1]('typing'))

    act(() => void vi.advanceTimersByTime(499))
    expect(localStorage.getItem('draft-a')).toBeNull()

    act(() => void vi.advanceTimersByTime(1))
    expect(localStorage.getItem('draft-a')).toBe('typing')
  })

  it('swaps in the new key\'s draft when the key changes without a remount', () => {
    localStorage.setItem('draft-a', 'the A draft')
    localStorage.setItem('draft-b', 'the B draft')

    const { result, rerender } = renderHook(({ k }) => useDraft(k), {
      initialProps: { k: 'draft-a' },
    })
    expect(result.current[0]).toBe('the A draft')

    rerender({ k: 'draft-b' })
    expect(result.current[0]).toBe('the B draft')
  })

  it('clears to empty when the new key has no draft', () => {
    localStorage.setItem('draft-a', 'the A draft')
    const { result, rerender } = renderHook(({ k }) => useDraft(k), {
      initialProps: { k: 'draft-a' },
    })
    rerender({ k: 'draft-b' })
    expect(result.current[0]).toBe('')
  })

  it('does not write one key\'s text under another key', () => {
    // The regression this guards: on a key change the hook rendered the
    // PREVIOUS key's text for a frame. Had the debounce not cancelled the
    // timer first, that text would have been saved under the new key,
    // overwriting a draft the reader had not touched.
    localStorage.setItem('draft-a', 'the A draft')
    localStorage.setItem('draft-b', 'the B draft')

    const { rerender } = renderHook(({ k }) => useDraft(k), {
      initialProps: { k: 'draft-a' },
    })
    rerender({ k: 'draft-b' })
    act(() => void vi.advanceTimersByTime(1000))

    expect(localStorage.getItem('draft-b')).toBe('the B draft')
    expect(localStorage.getItem('draft-a')).toBe('the A draft')
  })

  it('removes the entry when the draft is emptied', () => {
    localStorage.setItem('draft-a', 'something')
    const { result } = renderHook(() => useDraft('draft-a'))
    act(() => result.current[1](''))
    act(() => void vi.advanceTimersByTime(500))
    expect(localStorage.getItem('draft-a')).toBeNull()
  })

  it('clearDraft empties the value and drops the entry', () => {
    localStorage.setItem('draft-a', 'something')
    const { result } = renderHook(() => useDraft('draft-a'))
    act(() => result.current[2]())
    expect(result.current[0]).toBe('')
    expect(localStorage.getItem('draft-a')).toBeNull()
  })
})
