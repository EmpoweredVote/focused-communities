import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * The contrast floors, measured from the tokens as they are written in
 * index.css rather than from numbers copied into a comment.
 *
 * Three of the findings in the final UI review were ratios nobody had written
 * down: a no-side fill at 1.30:1 inside its track, a fill/track boundary at
 * 2.20:1 in dark mode, a link at 2.31:1 on the page background. Every ratio
 * that HAD been written down was arithmetically correct. So the gap this
 * closes is not "someone did the sum wrong", it is "nobody did the sum" — and
 * a comment beside a token cannot fail when the token changes under it.
 *
 * WCAG relative luminance, the same formula the comments in index.css quote.
 */
function luminance(hex: string): number {
  const h = hex.replace('#', '')
  const channels = [0, 2, 4]
    .map((i) => parseInt(h.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)))
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]
}

function ratio(a: string, b: string): number {
  const [la, lb] = [luminance(a), luminance(b)]
  const [hi, lo] = la > lb ? [la, lb] : [lb, la]
  return (hi + 0.05) / (lo + 0.05)
}

// Read from disk rather than imported: what is being measured is the file a
// build will ship, not a module graph's idea of it.
const css = readFileSync(join(process.cwd(), 'src/index.css'), 'utf8')

/**
 * The tokens as one mode sees them: the `@theme` block, then the `html.dark`
 * overrides on top for the dark mode. `var(--color-x)` references are
 * resolved, so a token defined in terms of another is measured as what it
 * actually paints.
 */
function tokens(mode: 'light' | 'dark'): Record<string, string> {
  const block = (re: RegExp) => css.match(re)?.[1] ?? ''
  const theme = block(/@theme \{([\s\S]*?)\n\}/)
  const dark = block(/html\.dark \{([\s\S]*?)\n\}/)
  expect(theme).not.toBe('')
  expect(dark).not.toBe('')

  const out: Record<string, string> = {}
  for (const source of mode === 'dark' ? [theme, dark] : [theme]) {
    for (const [, name, value] of source.matchAll(/(--color-[a-z0-9-]+):\s*([^;]+);/g)) {
      out[name] = value.trim()
    }
  }
  // Resolve var() chains. Bounded: a cycle would otherwise spin here.
  for (const name of Object.keys(out)) {
    let value = out[name]
    for (let hop = 0; hop < 8 && value.startsWith('var('); hop++) {
      value = out[value.slice(4, -1).trim()] ?? value
    }
    expect(value, `${name} in ${mode} mode did not resolve to a hex colour`).toMatch(
      /^#[0-9A-Fa-f]{6}$/,
    )
    out[name] = value
  }
  return out
}

/** Non-text parts (a bar, an outline, a rule, a dot) need 3:1; text needs 4.5:1. */
const PART = 3
const TEXT = 4.5

interface Pair {
  what: string
  fg: string
  bg: string
  floor: number
}

// Every pair a reader actually has to tell apart on the argument band, named
// as the thing it decides rather than as two token names.
const PAIRS: Pair[] = [
  // The impact bar: the fill against the bar's interior (the card), and the
  // outline that says how long the bar is (I5, I6).
  { what: 'impact fill, supporting, against the bar interior', fg: '--color-claim-supports', bg: '--color-surface-card', floor: PART },
  { what: 'impact fill, opposing, against the bar interior', fg: '--color-claim-opposes', bg: '--color-surface-card', floor: PART },
  { what: 'impact fill, no side, against the bar interior', fg: '--color-claim-neutral', bg: '--color-surface-card', floor: PART },
  { what: 'the impact bar outline against the card', fg: '--color-impact-track', bg: '--color-surface-card', floor: PART },
  // The chosen rating step against an unchosen one, which is the card.
  { what: 'the chosen rating step, no side', fg: '--color-claim-neutral', bg: '--color-surface-card', floor: PART },
  // Links, on both surfaces a link can sit on (I9).
  { what: 'a link on a card', fg: '--color-link', bg: '--color-surface-card', floor: TEXT },
  { what: 'a link on the page background', fg: '--color-link', bg: '--color-surface-secondary', floor: TEXT },
  { what: 'a hovered link on a card', fg: '--color-link-hover', bg: '--color-surface-card', floor: TEXT },
  { what: 'a hovered link on the page background', fg: '--color-link-hover', bg: '--color-surface-secondary', floor: TEXT },
  // The side rules and the minimap ramp, which were measured before and are
  // kept measured: a token moves, this notices.
  { what: 'the supporting rule under a column heading', fg: '--color-claim-supports', bg: '--color-surface-card', floor: PART },
  { what: 'the opposing rule under a column heading', fg: '--color-claim-opposes', bg: '--color-surface-card', floor: PART },
  { what: 'a low-impact minimap dot', fg: '--color-minimap-impact-low', bg: '--color-surface-card', floor: PART },
  { what: 'a moderate-impact minimap dot', fg: '--color-minimap-impact-moderate', bg: '--color-surface-card', floor: PART },
  { what: 'a high-impact minimap dot', fg: '--color-minimap-impact-high', bg: '--color-surface-card', floor: PART },
  // Body text, the thing the whole band is made of.
  { what: 'body text on a card', fg: '--color-text-body', bg: '--color-surface-card', floor: TEXT },
  { what: 'secondary text on a card', fg: '--color-text-secondary', bg: '--color-surface-card', floor: TEXT },
]

describe.each(['light', 'dark'] as const)('contrast in %s mode', (mode) => {
  const resolved = tokens(mode)

  it.each(PAIRS)('$what clears its floor', ({ fg, bg, floor }) => {
    const value = ratio(resolved[fg], resolved[bg])
    expect(
      Number(value.toFixed(2)),
      `${fg} (${resolved[fg]}) on ${bg} (${resolved[bg]}) is ${value.toFixed(2)}:1`,
    ).toBeGreaterThanOrEqual(floor)
  })
})

describe('shortfalls this branch did not introduce and did not fix', () => {
  // Recorded rather than asserted as a floor, so they are visible and so a
  // change to either token is noticed. --color-text-muted is a repo-wide token
  // older than the argument band; raising it touches every page, which is its
  // own change. Nothing in the claims band depends on muted text to say
  // something a reader must read.
  const light = tokens('light')
  it('--color-text-muted is under 4.5:1 in light mode', () => {
    expect(ratio(light['--color-text-muted'], light['--color-surface-card']).toFixed(2)).toBe('4.02')
    expect(ratio(light['--color-text-muted'], light['--color-surface-secondary']).toFixed(2)).toBe(
      '3.73',
    )
  })

  // White on coral is the house button, at 10 call sites. R79 already names
  // --color-ev-coral-hover (4.64:1) as the escape hatch.
  it('white on --color-ev-coral is under 4.5:1', () => {
    expect(ratio('#FFFFFF', light['--color-ev-coral']).toFixed(2)).toBe('3.14')
    expect(ratio('#FFFFFF', light['--color-ev-coral-hover']).toFixed(2)).toBe('4.64')
  })
})

describe('the ratios recorded beside the tokens', () => {
  // A spot check that the formula here is the one the comments were written
  // with, so a failure above means the token moved rather than that this file
  // measures something else.
  it('reproduces the values index.css writes down', () => {
    expect(ratio('#00657C', '#FFFFFF').toFixed(2)).toBe('6.66')
    expect(ratio('#FF5740', '#FFFFFF').toFixed(2)).toBe('3.14')
    expect(ratio('#59B0C4', '#0F1A1E').toFixed(2)).toBe('7.10')
    expect(ratio('#00657C', '#0F1A1E').toFixed(2)).toBe('2.66')
  })

  it('reproduces the three the review found, which nobody had written down', () => {
    // The old no-side fill inside the old track, and on the card (I5).
    expect(ratio('#C9CFD1', '#E2EBEF').toFixed(2)).toBe('1.30')
    expect(ratio('#C9CFD1', '#FFFFFF').toFixed(2)).toBe('1.58')
    // The old fill-against-track in dark mode (I6).
    expect(ratio('#FF5740', '#2B616E').toFixed(2)).toBe('2.20')
    // The house link token on the page background (I9).
    expect(ratio('#59B0C4', '#F0F8FA').toFixed(2)).toBe('2.31')
  })
})
