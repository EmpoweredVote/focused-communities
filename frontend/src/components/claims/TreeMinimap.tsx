import type { ClaimSide, ShapeMeta, ShapeNode } from '../../types'
import { impactWord } from '../../lib/impact'

interface TreeMinimapProps {
  shape: ShapeNode[]
  /** The claim the reader is on. It may be absent from `shape`; see below. */
  focusedId: string
  /**
   * The whole `meta`, not a bare `truncated` flag. Truncation cuts INSIDE a
   * depth level, so `completeThroughDepth` is the only thing that says which
   * levels this response describes completely — and nothing below that level
   * may be drawn as a count, a balance or an absence.
   */
  meta: ShapeMeta
  onJump: (id: string) => void
}

/**
 * On merges: this map does NOT fold a node onto its merge target.
 *
 * `mergedInto` names a real claim row and guarantees nothing else: the target
 * may sit in another community or below the truncation cut, chains (A -> B -> C)
 * are legal, and nothing in the schema forbids a cycle, so a folding client has
 * to walk a graph that can loop. A minimap does not need that walk, so there is
 * none here — every node in `shape` is drawn where it is, with a mark saying it
 * was merged. No walk, no unbounded loop, no node that silently vanishes.
 */

// Side is shape-and-position, never colour: the ramp below owns colour.
const SIDE_SHAPE: Record<ClaimSide, string> = {
  supports: 'h-3.5 w-3.5 rounded-full', // circle
  opposes: 'h-3.5 w-3.5 rounded-[3px]', // square
}
// A root has no side. A wider pill keeps it from reading as either one.
const ROOT_SHAPE = 'h-3.5 w-6 rounded-full'

const SIDE_WORD: Record<ClaimSide, string> = {
  supports: 'supporting',
  opposes: 'opposing',
}

// Neutral intensity, declared in index.css with its contrast ratios against
// both card surfaces. `impact` is never null — an unrated claim is exactly 5,
// the midpoint — and `ratingCount` is not on a ShapeNode at all, so this ramp
// cannot tell "neutral because unrated" from "neutral because opinion is
// split". Nothing here implies it can.
const IMPACT_FILL: Record<'low' | 'moderate' | 'high', string> = {
  low: 'bg-minimap-impact-low',
  moderate: 'bg-minimap-impact-moderate',
  high: 'bg-minimap-impact-high',
}

/**
 * The axis stops at level 1 (I2).
 *
 * `side` is a claim's side RELATIVE TO ITS PARENT. At depth 1 every parent is
 * the root, so splitting the row across one axis draws the question's own
 * pro/con balance and the sentence "3 supporting, 2 opposing" is about the
 * question. At depth 2 and below it is not: a `supports` child of an `opposes`
 * parent argues against the question and would be drawn on the supporting side
 * of the same axis and counted as supporting in the same sentence. Each node's
 * own label stays true; what was false was the aggregate the shared axis and
 * the summary asserted.
 *
 * The other candidate fix was re-anchoring each node to the root by the parity
 * of its ancestors' sides. Rejected on two grounds. The payload is truncatable
 * (R25), so for the deep nodes that need it most the ancestors may be absent
 * and the parity simply unknown — the map would have to guess or blank exactly
 * where it is least sure. And parity encodes an interpretation, "an argument
 * against an objection supports the question", that no field in the response
 * makes; drawing it would be this component asserting something the data does
 * not say, which is the failure this whole band is built to avoid. Dropping
 * the axis asserts less, and less is what is true.
 */
const AXIS_MAX_DEPTH = 1

interface Row {
  depth: number
  /** True only for depths this response describes completely. */
  complete: boolean
  /** Complete AND shallow enough for one axis to mean what it looks like. */
  split: boolean
  nodes: ShapeNode[]
  supports: ShapeNode[]
  opposes: ShapeNode[]
  roots: ShapeNode[]
}

/**
 * 🔴 `truncated` AND `completeThroughDepth` ARE READ TOGETHER OR NOT AT ALL.
 *
 * The API says so in as many words, and this component used to read the second one alone:
 * `completeThroughDepth !== null && node.depth <= completeThroughDepth`. That inverts the
 * common case. When nothing was cut the server sends `{ truncated: false,
 * completeThroughDepth: null }` — null meaning "the question does not apply", not "nothing is
 * complete" — so every row was marked incomplete and the map suppressed its counts and balance
 * on a tree that was whole. Caught on the first live response after deploy, where a one-node
 * community came back exactly that way.
 *
 * The three states, in full:
 *   truncated false                        → nothing was cut; every depth present is complete.
 *   truncated true,  completeThroughDepth N → depths <= N are whole, deeper ones are a subset.
 *   truncated true,  completeThroughDepth null → cannot happen (a cut always names a depth),
 *                                            and if it ever does, claim nothing.
 */
function buildRows(shape: ShapeNode[], completeThroughDepth: number | null, truncated: boolean): Row[] {
  const byDepth = new Map<number, Row>()
  for (const node of shape) {
    let row = byDepth.get(node.depth)
    if (!row) {
      // Nothing cut AND no depth named is the only state that means "all of it is here".
      // Any other combination falls through to the depth test, so a server that somehow
      // disagrees with itself makes this map claim LESS, never more.
      const complete =
        !truncated && completeThroughDepth === null
          ? true
          : completeThroughDepth !== null && node.depth <= completeThroughDepth
      row = {
        depth: node.depth,
        complete,
        split: complete && node.depth <= AXIS_MAX_DEPTH,
        nodes: [],
        supports: [],
        opposes: [],
        roots: [],
      }
      byDepth.set(node.depth, row)
    }
    row.nodes.push(node)
    // `side` is null on a root. Counting a null as either side would invent a
    // position for a claim that does not take one.
    if (node.side === 'supports') row.supports.push(node)
    else if (node.side === 'opposes') row.opposes.push(node)
    else row.roots.push(node)
  }
  return [...byDepth.values()].sort((a, b) => a.depth - b.depth)
}

function depthSentence(row: Row): string {
  // Below the axis, the level's size is still something this response
  // describes completely; the split of it into two sides is not something a
  // reader may add up. So the count stays and the tally goes.
  if (!row.split) {
    const n = row.nodes.length
    return `Level ${row.depth}: ${n} ${n === 1 ? 'claim' : 'claims'}, each supporting or opposing its own parent.`
  }
  const bits: string[] = []
  if (row.roots.length > 0) {
    bits.push(`${row.roots.length} top ${row.roots.length === 1 ? 'claim' : 'claims'}`)
  }
  if (row.supports.length + row.opposes.length > 0 || row.roots.length === 0) {
    bits.push(`${row.supports.length} supporting`, `${row.opposes.length} opposing`)
  }
  return `Level ${row.depth}: ${bits.join(', ')}.`
}

function nodeLabel(node: ShapeNode, isFocused: boolean): string {
  const what = node.side ? `a ${SIDE_WORD[node.side]} claim` : 'the top claim'
  const bits = [`Go to ${what} at level ${node.depth}`, `${impactWord(node.impact)} impact`]
  // Each of these is already a mark in the picture; the label is what carries
  // them to a reader who is not looking at the picture.
  if (node.isHidden) bits.push('removed')
  if (node.mergedInto) bits.push('merged into another claim')
  if (isFocused) bits.push('you are here')
  return bits.join(', ')
}

function Node({
  node,
  isFocused,
  onJump,
}: {
  node: ShapeNode
  isFocused: boolean
  onJump: (id: string) => void
}) {
  return (
    <button
      type="button"
      data-node={node.id}
      data-side={node.side ?? 'none'}
      data-focused={isFocused ? 'true' : undefined}
      data-hidden={node.isHidden ? 'true' : undefined}
      data-merged={node.mergedInto ? 'true' : undefined}
      aria-current={isFocused ? 'true' : undefined}
      aria-label={nodeLabel(node, isFocused)}
      onClick={() => onJump(node.id)}
      className={[
        'flex items-center gap-px rounded-md p-1.5 transition-colors hover:bg-surface-card',
        'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-focus-ring',
      ].join(' ')}
    >
      <span className="relative flex items-center">
        <span
          aria-hidden="true"
          className={[
            'block',
            node.side ? SIDE_SHAPE[node.side] : ROOT_SHAPE,
            IMPACT_FILL[impactWord(node.impact)],
            // "You are here" is a ring and a word in the label, not a hue: an
            // extra colour here would be a third meaning in the one channel
            // impact already owns.
            isFocused ? 'ring-2 ring-text-body ring-offset-2 ring-offset-surface-card' : '',
          ].join(' ')}
        />
        {/* A removed claim keeps its place — dropping it would make its
            children look like they hang from a grandparent — and wears the
            same tombstone idea the card uses, as a strike rather than a hue. */}
        {node.isHidden && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-1/2 h-px w-[150%] -translate-x-1/2 -translate-y-1/2 rotate-45 bg-text-body"
          />
        )}
      </span>
      {/* Merged, and not folded away: see the note at the top of the file. */}
      {node.mergedInto && (
        <span aria-hidden="true" className="text-[8px] leading-none text-text-secondary">
          &rarr;
        </span>
      )}
    </button>
  )
}

export function TreeMinimap({ shape, focusedId, meta, onJump }: TreeMinimapProps) {
  const rows = buildRows(shape, meta.completeThroughDepth, meta.truncated)
  const focusedOnMap = focusedId !== '' && shape.some((n) => n.id === focusedId)

  // An empty shape with completeThroughDepth null is the one state where the
  // client knows only that it does not know. `rows.some(...)` over no rows is
  // false, so without this the caveat was dropped and what remained was
  // "This map has nothing to draw." — the opposite of the truth, said on the
  // branch least able to support it (I8).
  // An empty shape is only "we know nothing" when the server also says it cut something.
  // With `truncated: false` an empty shape means the community genuinely has no claims —
  // a different sentence, and the honest one.
  const nothingDescribed = rows.length === 0 && meta.truncated && meta.completeThroughDepth === null

  // Cut off when the server says so, and also when a drawn depth is one this
  // response does not describe completely — which is the same thing seen from
  // the other side, except when the two disagree, and then the reader is told.
  const isCut = meta.truncated || nothingDescribed || rows.some((r) => !r.complete)
  const cutText =
    meta.completeThroughDepth === null
      ? 'No level of this map is complete, so it shows no counts and no balance.'
      : `The map is cut off below level ${meta.completeThroughDepth}: what it draws below that level is part of the argument there, not all of it, so it gives no counts for it.`

  // Said once, when there is a level whose nodes are drawn without the axis
  // and a reader might otherwise read the missing axis as missing arguments.
  const hasUnsplitLevel = rows.some((r) => r.complete && !r.split)
  const axisText =
    `Below level ${AXIS_MAX_DEPTH} a claim's side is relative to its own parent rather than to the ` +
    'question, so those levels are listed rather than weighed against each other.'

  // The text alternative obeys exactly the same cut as the picture. A summary
  // more confident than what it describes is worse than no summary.
  const summary = [
    'Map of this argument.',
    ...(rows.length === 0 && !nothingDescribed ? ['This map has nothing to draw.'] : []),
    ...rows.filter((r) => r.complete).map(depthSentence),
    ...(hasUnsplitLevel ? [axisText] : []),
    ...(isCut ? [cutText] : []),
  ].join(' ')

  return (
    <section
      data-testid="tree-minimap"
      data-tree-minimap
      aria-label="Map of this argument"
      className="rounded-xl border border-border-light bg-surface-card p-4 shadow-sm"
    >
      {/* Header and legend. The legend repeats, in pictures, what each mark's
          own label already says, so it is hidden from screen readers. */}
      <div className="mb-3 flex flex-wrap items-start justify-between gap-x-6 gap-y-2">
        <div>
          <h3 className="text-sm font-semibold text-text-body">Argument map</h3>
          <p className="mt-0.5 text-xs text-text-muted">Each row is a level of the argument. Select a mark to jump to it.</p>
        </div>
        <div aria-hidden="true" className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-text-secondary">
          <span className="inline-flex items-center gap-1.5">
            <span className={`block ${ROOT_SHAPE} bg-minimap-impact-moderate`} />
            The issue
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className={`block ${SIDE_SHAPE.supports} bg-minimap-impact-moderate`} />
            Supports
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className={`block ${SIDE_SHAPE.opposes} bg-minimap-impact-moderate`} />
            Opposes
          </span>
          {/* The two modifiers a mark can carry, drawn exactly as Node draws them.
              Without these the map showed a struck mark and an arrowed mark that the
              legend never accounted for. Side here is arbitrary: both modifiers apply
              to either shape. */}
          <span className="inline-flex items-center gap-1.5">
            <span className="relative flex items-center">
              <span className={`block ${SIDE_SHAPE.supports} bg-minimap-impact-moderate`} />
              <span className="pointer-events-none absolute left-1/2 top-1/2 h-px w-[150%] -translate-x-1/2 -translate-y-1/2 rotate-45 bg-text-body" />
            </span>
            Removed
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="flex items-center gap-px">
              <span className={`block ${SIDE_SHAPE.supports} bg-minimap-impact-moderate`} />
              <span className="text-[8px] leading-none text-text-secondary">&rarr;</span>
            </span>
            Merged
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="flex gap-0.5">
              <span className={`block h-2.5 w-2.5 rounded-full ${IMPACT_FILL.low}`} />
              <span className={`block h-2.5 w-2.5 rounded-full ${IMPACT_FILL.moderate}`} />
              <span className={`block h-2.5 w-2.5 rounded-full ${IMPACT_FILL.high}`} />
            </span>
            Low to high impact
          </span>
        </div>
      </div>
      {/* The drawing is decorative — every line, axis and label in it is
          aria-hidden and this sentence is the alternative. The nodes cannot
          be: they are the controls that jump, and a control hidden from a
          screen reader is a control that reader cannot use. */}
      <p data-testid="tree-minimap-summary" className="sr-only">
        {summary}
      </p>

      <ol className="space-y-1.5">
        {rows.map((row) => (
          <li
            key={row.depth}
            data-depth={row.depth}
            data-complete={row.complete ? 'true' : 'false'}
            className={[
              'flex items-center gap-3 rounded-lg border bg-surface-hover/60 px-2.5 py-1',
              // The cut is in the row's own outline too, so a reader scanning
              // the picture can see which levels are only partly drawn.
              row.complete ? 'border-transparent' : 'border-dashed border-border-incomplete',
            ].join(' ')}
            data-split={row.split ? 'true' : 'false'}
          >
            <span
              aria-hidden="true"
              className="w-14 shrink-0 text-[11px] font-semibold uppercase tracking-wide text-text-muted"
            >
              Level {row.depth}
            </span>

            {row.split ? (
              // Position is the balance channel, and it is drawn only where the
              // response describes the whole level AND every node on it takes
              // its side against the same parent. Supports left of the axis,
              // opposes right: the reader sees the weight of each side of the
              // question.
              <div className="flex min-w-0 flex-1 items-center">
                <div
                  data-testid="side-group-supports"
                  className="flex min-w-0 flex-1 flex-wrap items-center justify-end"
                >
                  {row.supports.map((node) => (
                    <Node
                      key={node.id}
                      node={node}
                      isFocused={node.id === focusedId}
                      onJump={onJump}
                    />
                  ))}
                </div>
                <div className="flex shrink-0 items-center px-1">
                  {row.roots.length > 0 ? (
                    row.roots.map((node) => (
                      <Node
                        key={node.id}
                        node={node}
                        isFocused={node.id === focusedId}
                        onJump={onJump}
                      />
                    ))
                  ) : (
                    <span
                      data-testid="balance-axis"
                      aria-hidden="true"
                      className="h-5 w-px bg-border-medium"
                    />
                  )}
                </div>
                <div
                  data-testid="side-group-opposes"
                  className="flex min-w-0 flex-1 flex-wrap items-center"
                >
                  {row.opposes.map((node) => (
                    <Node
                      key={node.id}
                      node={node}
                      isFocused={node.id === focusedId}
                      onJump={onJump}
                    />
                  ))}
                </div>
              </div>
            ) : (
              // Not split, for either of two reasons. Below the cut the
              // siblings at this depth are an arbitrary part of what is there,
              // so a split would read as a proportion of a whole nobody has
              // seen. Below level 1 the sides are taken against different
              // parents, so a split would read as a balance of a question none
              // of them is about. Both end the same way: the nodes are drawn in
              // the order they arrived, and each still carries its own side,
              // which is real per node.
              <div
                data-testid="unsplit-group"
                className="flex min-w-0 flex-1 flex-wrap items-center"
              >
                {row.nodes.map((node) => (
                  <Node
                    key={node.id}
                    node={node}
                    isFocused={node.id === focusedId}
                    onJump={onJump}
                  />
                ))}
              </div>
            )}
          </li>
        ))}
      </ol>

      {/* Marking nothing is right when the focused claim is below the cut;
          marking nothing silently is not, because a reader looking for
          themselves reads the absence as "I am at the top" or "this is
          broken". With an untruncated shape the same absence is a real
          disagreement between two endpoints, and the map does not narrate a
          cause it does not know. */}
      {!focusedOnMap && focusedId !== '' && meta.truncated && (
        <p data-testid="tree-minimap-focus-missing" className="mt-2 text-xs text-text-secondary">
          The claim you are reading is below what this map can show.
        </p>
      )}

      {hasUnsplitLevel && (
        // Same sentence as the summary's, hidden from a screen reader here for
        // the same reason the cut-off line is: one fact, said once.
        <p
          data-testid="tree-minimap-axis-note"
          aria-hidden="true"
          className="mt-3 flex gap-1.5 border-t border-border-light pt-3 text-xs leading-relaxed text-text-secondary"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="mt-px h-3.5 w-3.5 flex-shrink-0 text-text-muted" aria-hidden="true"><path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 9a.75.75 0 0 0 0 1.5h.253a.25.25 0 0 1 .244.304l-.459 2.066A1.75 1.75 0 0 0 10.747 15H11a.75.75 0 0 0 0-1.5h-.253a.25.25 0 0 1-.244-.304l.459-2.066A1.75 1.75 0 0 0 9.253 9H9Z" clipRule="evenodd" /></svg>
          <span>{axisText}</span>
        </p>
      )}

      {isCut && (
        // Same sentence as the one in the summary above, which is why it is
        // hidden from a screen reader here: one fact, said once.
        <p
          data-testid="tree-minimap-cutoff"
          aria-hidden="true"
          className="mt-3 flex gap-1.5 border-t border-border-light pt-3 text-xs leading-relaxed text-text-secondary"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="mt-px h-3.5 w-3.5 flex-shrink-0 text-text-muted" aria-hidden="true"><path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 9a.75.75 0 0 0 0 1.5h.253a.25.25 0 0 1 .244.304l-.459 2.066A1.75 1.75 0 0 0 10.747 15H11a.75.75 0 0 0 0-1.5h-.253a.25.25 0 0 1-.244-.304l.459-2.066A1.75 1.75 0 0 0 9.253 9H9Z" clipRule="evenodd" /></svg>
          <span>{cutText}</span>
        </p>
      )}
    </section>
  )
}
