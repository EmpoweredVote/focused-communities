import { useState } from 'react'

/**
 * Which end of the ladder is on top.
 *
 * A ladder is a spectrum: a chair is legible only by contrast with its neighbours, so the
 * order is never shuffled. What is randomized is the direction, decided once per mount, so
 * the same side is not always first and the presentation does not bias the reader.
 * Neither direction is "regular". `changed` reports whether the reader has flipped it since mount.
 * With fewer than two chairs there is no direction to flip, so toggle does nothing and no hidden
 * state builds up for the next season.
 */
export function useLadderDirection(length: number): { flipped: boolean; changed: boolean; toggle: () => void } {
  const [initial] = useState(() => Math.random() < 0.5)
  const [flipped, setFlipped] = useState(initial)
  return {
    flipped,
    changed: flipped !== initial,
    toggle: () => {
      if (length > 1) setFlipped((prev) => !prev)
    },
  }
}
