import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react'
import { TreeMinimap } from './TreeMinimap'
import type { ShapeMeta, ShapeNode } from '../../types'

afterEach(cleanup)

// Synthetic throughout: ids start with "test-" and nothing here resembles a
// real claim, a real person or a real id. A ShapeNode carries no text at all,
// so there is nothing to invent but the ids.
const node = (n: number, over: Partial<ShapeNode> = {}): ShapeNode => ({
  id: `test-node-${n}`,
  parentId: null,
  side: 'supports',
  depth: 1,
  impact: 5,
  isHidden: false,
  mergedInto: null,
  ...over,
})

const meta = (over: Partial<ShapeMeta> = {}): ShapeMeta => ({
  truncated: false,
  completeThroughDepth: 0,
  ...over,
})

function map(): HTMLElement {
  return screen.getByTestId('tree-minimap')
}

function row(depth: number): HTMLElement {
  const el = map().querySelector<HTMLElement>(`[data-depth="${depth}"]`)
  if (!el) throw new Error(`no row for depth ${depth}`)
  return el
}

function rowDepths(): string[] {
  return Array.from(map().querySelectorAll<HTMLElement>('[data-depth]')).map(
    (el) => el.getAttribute('data-depth') as string,
  )
}

function nodeButtons(scope: HTMLElement = map()): HTMLElement[] {
  return Array.from(scope.querySelectorAll<HTMLElement>('button[data-node]'))
}

function summaryText(): string {
  return screen.getByTestId('tree-minimap-summary').textContent ?? ''
}

// Depths 0-2, complete through depth 1: one root, then 3 supporting and 2
// opposing, then an arbitrary part of depth 2.
const CUT_SHAPE: ShapeNode[] = [
  node(0, { depth: 0, side: null }),
  node(1, { depth: 1, side: 'supports', parentId: 'test-node-0' }),
  node(2, { depth: 1, side: 'supports', parentId: 'test-node-0' }),
  node(3, { depth: 1, side: 'supports', parentId: 'test-node-0' }),
  node(4, { depth: 1, side: 'opposes', parentId: 'test-node-0' }),
  node(5, { depth: 1, side: 'opposes', parentId: 'test-node-0' }),
  node(6, { depth: 2, side: 'supports', parentId: 'test-node-1' }),
  node(7, { depth: 2, side: 'supports', parentId: 'test-node-1' }),
]

describe('TreeMinimap', () => {
  it('marks the focused claim', () => {
    render(
      <TreeMinimap
        shape={CUT_SHAPE}
        focusedId="test-node-4"
        meta={meta({ truncated: true, completeThroughDepth: 1 })}
        onJump={vi.fn()}
      />,
    )
    const marked = nodeButtons().filter((b) => b.getAttribute('data-focused') === 'true')
    expect(marked).toHaveLength(1)
    expect(marked[0].getAttribute('data-node')).toBe('test-node-4')
    // The mark is not colour alone: it is in the accessible name too.
    expect(marked[0]).toHaveAttribute('aria-current', 'true')
    expect(marked[0].getAttribute('aria-label')).toMatch(/you are here/i)
    // Nothing claims the focused claim is missing when it plainly is not.
    expect(screen.queryByTestId('tree-minimap-focus-missing')).not.toBeInTheDocument()
  })

  it('reflects the pro/con balance at each depth the response describes completely', () => {
    render(
      <TreeMinimap
        shape={CUT_SHAPE}
        focusedId="test-node-0"
        meta={meta({ truncated: true, completeThroughDepth: 1 })}
        onJump={vi.fn()}
      />,
    )
    const d1 = row(1)
    expect(d1).toHaveAttribute('data-complete', 'true')
    // The picture: supports and opposes split across an axis, so their relative
    // weight at this depth is what the reader sees.
    expect(nodeButtons(within(d1).getByTestId('side-group-supports'))).toHaveLength(3)
    expect(nodeButtons(within(d1).getByTestId('side-group-opposes'))).toHaveLength(2)
    expect(within(d1).getByTestId('balance-axis')).toBeInTheDocument()
    // The text alternative says the same thing in words.
    expect(summaryText()).toContain('Level 1: 3 supporting, 2 opposing.')
  })

  it('says so when the shape was truncated', () => {
    render(
      <TreeMinimap
        shape={CUT_SHAPE}
        focusedId="test-node-0"
        meta={meta({ truncated: true, completeThroughDepth: 1 })}
        onJump={vi.fn()}
      />,
    )
    expect(screen.getByTestId('tree-minimap-cutoff')).toHaveTextContent(/cut off below level 1/i)
    expect(summaryText()).toMatch(/cut off below level 1/i)
  })

  it('renders a single-node tree without error', () => {
    render(
      <TreeMinimap
        shape={[node(0, { depth: 0, side: null })]}
        focusedId="test-node-0"
        meta={meta({ completeThroughDepth: 0 })}
        onJump={vi.fn()}
      />,
    )
    expect(nodeButtons()).toHaveLength(1)
    expect(rowDepths()).toEqual(['0'])
    expect(nodeButtons()[0].getAttribute('data-focused')).toBe('true')
    expect(screen.queryByTestId('tree-minimap-cutoff')).not.toBeInTheDocument()
    expect(summaryText()).toContain('Level 0: 1 top claim.')
  })

  it('renders an empty shape without inventing a tree', () => {
    render(
      <TreeMinimap
        shape={[]}
        focusedId=""
        meta={meta({ completeThroughDepth: null })}
        onJump={vi.fn()}
      />,
    )
    expect(nodeButtons()).toHaveLength(0)
    expect(rowDepths()).toEqual([])
    expect(summaryText()).not.toMatch(/\d/)
  })

  it('draws no balance, no count and no absence below completeThroughDepth', () => {
    render(
      <TreeMinimap
        shape={CUT_SHAPE}
        focusedId="test-node-0"
        meta={meta({ truncated: true, completeThroughDepth: 1 })}
        onJump={vi.fn()}
      />,
    )
    const d2 = row(2)
    expect(d2).toHaveAttribute('data-complete', 'false')
    // The nodes that arrived are still drawn...
    expect(nodeButtons(d2).map((b) => b.getAttribute('data-node'))).toEqual([
      'test-node-6',
      'test-node-7',
    ])
    // ...but not split across an axis, because the siblings at this depth are an
    // arbitrary part of what is there and the split would read as a proportion.
    expect(within(d2).queryByTestId('side-group-supports')).not.toBeInTheDocument()
    expect(within(d2).queryByTestId('side-group-opposes')).not.toBeInTheDocument()
    expect(within(d2).queryByTestId('balance-axis')).not.toBeInTheDocument()
    // Depth 2 is all supporting in this fixture. Saying "0 opposing" there would
    // be a claim about the world the response does not support.
    expect(summaryText()).not.toMatch(/level 2/i)
    expect(summaryText()).not.toMatch(/0 opposing/)
    expect(map().textContent ?? '').not.toMatch(/no opposing/i)
  })

  it('draws no balance at all when completeThroughDepth is null', () => {
    render(
      <TreeMinimap
        shape={CUT_SHAPE}
        focusedId="test-node-0"
        meta={meta({ truncated: true, completeThroughDepth: null })}
        onJump={vi.fn()}
      />,
    )
    expect(nodeButtons()).toHaveLength(CUT_SHAPE.length)
    expect(map().querySelectorAll('[data-complete="true"]')).toHaveLength(0)
    expect(map().querySelectorAll('[data-testid="balance-axis"]')).toHaveLength(0)
    expect(summaryText()).not.toMatch(/level \d/i)
    expect(summaryText()).not.toMatch(/supporting|opposing/i)
    expect(summaryText()).toMatch(/no level of this map is complete/i)
  })

  it('says the map is cut off when only completeThroughDepth reveals it', () => {
    // `truncated` and `completeThroughDepth` disagreeing is the one case where
    // a bare boolean would have let a fabricated balance through: depth 2 is
    // drawn and is not described completely, whatever the flag says.
    render(
      <TreeMinimap
        shape={CUT_SHAPE}
        focusedId="test-node-0"
        meta={meta({ truncated: false, completeThroughDepth: 1 })}
        onJump={vi.fn()}
      />,
    )
    expect(row(2)).toHaveAttribute('data-complete', 'false')
    expect(screen.getByTestId('tree-minimap-cutoff')).toHaveTextContent(/cut off below level 1/i)
    expect(summaryText()).toMatch(/cut off below level 1/i)
    expect(summaryText()).not.toMatch(/level 2/i)
  })

  it('explains a focused claim that sits below the cut, and marks nothing', () => {
    render(
      <TreeMinimap
        shape={CUT_SHAPE}
        focusedId="test-node-404"
        meta={meta({ truncated: true, completeThroughDepth: 1 })}
        onJump={vi.fn()}
      />,
    )
    expect(nodeButtons().filter((b) => b.getAttribute('data-focused') === 'true')).toHaveLength(0)
    expect(screen.getByTestId('tree-minimap-focus-missing')).toHaveTextContent(
      /below what this map can show/i,
    )
  })

  it('invents no explanation when the focused claim is absent from a whole shape', () => {
    // Two endpoints disagreeing is a real inconsistency, not something the map
    // may narrate to the reader.
    render(
      <TreeMinimap
        shape={CUT_SHAPE}
        focusedId="test-node-404"
        meta={meta({ truncated: false, completeThroughDepth: 2 })}
        onJump={vi.fn()}
      />,
    )
    expect(nodeButtons().filter((b) => b.getAttribute('data-focused') === 'true')).toHaveLength(0)
    expect(screen.queryByTestId('tree-minimap-focus-missing')).not.toBeInTheDocument()
    expect(screen.queryByTestId('tree-minimap-cutoff')).not.toBeInTheDocument()
  })

  it('draws a merged node as an ordinary node whether or not its target is on the map', () => {
    const shape = [
      node(0, { depth: 0, side: null }),
      // target is not in this payload
      node(1, { depth: 1, mergedInto: 'test-node-elsewhere' }),
      // target is on the map, and the two point at each other: a cycle is legal
      node(2, { depth: 1, mergedInto: 'test-node-3' }),
      node(3, { depth: 1, mergedInto: 'test-node-2' }),
    ]
    render(
      <TreeMinimap
        shape={shape}
        focusedId="test-node-0"
        meta={meta({ completeThroughDepth: 1 })}
        onJump={vi.fn()}
      />,
    )
    // Nothing is folded away and nothing is invented for the absent target.
    expect(nodeButtons().map((b) => b.getAttribute('data-node'))).toEqual([
      'test-node-0',
      'test-node-1',
      'test-node-2',
      'test-node-3',
    ])
    expect(map().querySelector('[data-node="test-node-elsewhere"]')).toBeNull()
    for (const id of ['test-node-1', 'test-node-2', 'test-node-3']) {
      const btn = map().querySelector<HTMLElement>(`[data-node="${id}"]`)
      expect(btn).toHaveAttribute('data-merged', 'true')
      expect(btn?.getAttribute('aria-label')).toMatch(/merged/i)
    }
    // The absent target is not read as bad data, and the three merged nodes
    // still count towards the balance they are part of.
    expect(nodeButtons(within(row(1)).getByTestId('side-group-supports'))).toHaveLength(3)
    expect(summaryText()).toContain('Level 1: 3 supporting, 0 opposing.')
  })

  it('draws a hidden node rather than dropping it', () => {
    const shape = [
      node(0, { depth: 0, side: null }),
      node(1, { depth: 1, side: 'supports' }),
      node(2, { depth: 1, side: 'opposes', isHidden: true }),
    ]
    render(
      <TreeMinimap
        shape={shape}
        focusedId="test-node-0"
        meta={meta({ completeThroughDepth: 1 })}
        onJump={vi.fn()}
      />,
    )
    const hidden = map().querySelector<HTMLElement>('[data-node="test-node-2"]')
    expect(hidden).toBeInTheDocument()
    expect(hidden).toHaveAttribute('data-hidden', 'true')
    expect(hidden?.getAttribute('aria-label')).toMatch(/removed/i)
    // Dropping it would make its children look like they hang from a
    // grandparent, so it keeps its place in the balance too.
    expect(summaryText()).toContain('Level 1: 1 supporting, 1 opposing.')
  })

  it('jumps to a claim when its node is clicked', () => {
    const onJump = vi.fn()
    render(
      <TreeMinimap
        shape={CUT_SHAPE}
        focusedId="test-node-0"
        meta={meta({ truncated: true, completeThroughDepth: 1 })}
        onJump={onJump}
      />,
    )
    fireEvent.click(map().querySelector<HTMLElement>('[data-node="test-node-7"]') as HTMLElement)
    expect(onJump).toHaveBeenCalledTimes(1)
    expect(onJump).toHaveBeenCalledWith('test-node-7')
  })

  it('carries the side in the accessible name, not in colour alone', () => {
    render(
      <TreeMinimap
        shape={CUT_SHAPE}
        focusedId="test-node-0"
        meta={meta({ truncated: true, completeThroughDepth: 1 })}
        onJump={vi.fn()}
      />,
    )
    const byId = (id: string) => map().querySelector<HTMLElement>(`[data-node="${id}"]`)
    expect(byId('test-node-1')?.getAttribute('aria-label')).toMatch(/supporting/i)
    expect(byId('test-node-4')?.getAttribute('aria-label')).toMatch(/opposing/i)
    expect(byId('test-node-1')).toHaveAttribute('data-side', 'supports')
    expect(byId('test-node-4')).toHaveAttribute('data-side', 'opposes')
    expect(byId('test-node-0')).toHaveAttribute('data-side', 'none')
  })

  it('never implies it can tell an unrated claim from a split one', () => {
    const shape = [
      node(0, { depth: 0, side: null, impact: 5 }),
      node(1, { depth: 1, impact: 5 }),
      node(2, { depth: 1, impact: 8.5, side: 'opposes' }),
    ]
    render(
      <TreeMinimap
        shape={shape}
        focusedId="test-node-0"
        meta={meta({ completeThroughDepth: 1 })}
        onJump={vi.fn()}
      />,
    )
    // ratingCount is not on a ShapeNode at all, so "unrated" is unknowable here.
    expect(map().textContent ?? '').not.toMatch(/unrated|not yet rated/i)
    const labels = nodeButtons().map((b) => b.getAttribute('aria-label') ?? '')
    expect(labels.join(' ')).not.toMatch(/unrated|no ratings/i)
    // And the impact figure itself is never printed.
    expect(map().textContent ?? '').not.toMatch(/8\.5|5\.0/)
  })
})
