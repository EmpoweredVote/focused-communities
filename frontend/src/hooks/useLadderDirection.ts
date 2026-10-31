import { useState } from 'react'

/**
 * Which end of the ladder is on top.
 *
 * A ladder is a spectrum: a chair is legible only by contrast with its neighbours, so the
 * order is never shuffled. What is randomized is the direction, decided once per mount, so
 * the same side is not always first and the presentation does not bias the reader.
 * With fewer than two chairs there is no direction to speak of.
 */
export function useLadderDirection(length: number): { flipped: boolean; toggle: () => void } {
  const [flipped, setFlipped] = useState(() => Math.random() < 0.5)
  return {
    flipped: length > 1 && flipped,
    toggle: () => setFlipped((prev) => !prev),
  }
}
