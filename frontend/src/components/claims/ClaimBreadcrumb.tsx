import { useState } from 'react'
import type { BreadcrumbItem, ClaimSide } from '../../types'

interface ClaimBreadcrumbProps {
  trail: BreadcrumbItem[]
  onJump: (id: string) => void
}

// Mirrors ClaimCard: a side is a word and a mark before it is a colour.
const SIDE_MARK: Record<ClaimSide, string> = {
  supports: '+', // plus
  opposes: '−', // minus
}

const SIDE_LABEL: Record<ClaimSide, string> = {
  supports: 'Supports',
  opposes: 'Opposes',
}

// How much of a deep trail stays on screen. The two kept are the first and the
// last; see the note on completeness below for why they are described that way
// and not as the root and the parent.
const HEAD = 1
const TAIL = 2

type Entry =
  | { kind: 'step'; item: BreadcrumbItem }
  | { kind: 'gap'; count: number }

function Step({ item, onJump }: { item: BreadcrumbItem; onJump: (id: string) => void }) {
  // A hidden ancestor arrives as body: '' — the server replaces the text before
  // it leaves the database. An empty body is a removed claim, not missing data,
  // and never a reason to go looking for the text somewhere else.
  const isTombstone = item.body.trim() === ''
  return (
    <button
      type="button"
      data-step={item.id}
      data-side={item.side ?? 'none'}
      onClick={() => onJump(item.id)}
      title={isTombstone ? undefined : item.body}
      className={[
        'flex max-w-[14ch] items-baseline gap-1 rounded px-1 py-0.5 sm:max-w-[28ch]',
        'text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-body',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring',
      ].join(' ')}
    >
      {item.side && (
        <>
          <span aria-hidden="true">{SIDE_MARK[item.side]}</span>
          <span className="sr-only">{SIDE_LABEL[item.side]}:</span>
        </>
      )}
      {isTombstone ? (
        <span className="truncate italic text-text-muted">Removed claim</span>
      ) : (
        <span className="truncate">{item.body}</span>
      )}
    </button>
  )
}

/**
 * The trail of ancestors above the claim in focus, root-first.
 *
 * Presentational: it renders what it is handed and calls back. `?claim=` is
 * owned by useFocusedClaim.
 *
 * On completeness — the trail arrives root-first and already truncated at the
 * DEEP end when an argument runs past the server's cap, and a damaged path
 * shortens it the same way. Neither case is flagged in the payload: there is no
 * `truncated` on a breadcrumb and no depth on a claim, so a client cannot tell
 * a whole trail from a clipped one. Render what you are given and say nothing
 * about how complete it is. In particular the last step is NOT reliably the
 * claim's parent, so nothing here names it one.
 */
export function ClaimBreadcrumb({ trail, onJump }: ClaimBreadcrumbProps) {
  const [unfolded, setUnfolded] = useState(false)

  // A root claim has no ancestors. No trail, no chrome.
  if (trail.length === 0) return null

  // Folding only pays once it hides more than the one step it costs.
  const hiddenCount = !unfolded && trail.length > HEAD + TAIL + 1 ? trail.length - HEAD - TAIL : 0
  const entries: Entry[] =
    hiddenCount > 0
      ? [
          ...trail.slice(0, HEAD).map((item): Entry => ({ kind: 'step', item })),
          { kind: 'gap', count: hiddenCount },
          ...trail.slice(trail.length - TAIL).map((item): Entry => ({ kind: 'step', item })),
        ]
      : trail.map((item): Entry => ({ kind: 'step', item }))

  return (
    <nav aria-label="Trail above this claim">
      <ol className="flex flex-wrap items-center gap-y-0.5 text-xs">
        {entries.map((entry, i) => (
          <li
            key={entry.kind === 'gap' ? 'gap' : entry.item.id}
            className="flex min-w-0 items-center"
          >
            {i > 0 && (
              <span aria-hidden="true" className="px-0.5 text-text-muted">
                &rsaquo;
              </span>
            )}
            {entry.kind === 'gap' ? (
              // Unfoldable rather than a dead ellipsis: a step the reader
              // cannot reach is a step missing from the trail.
              <button
                type="button"
                onClick={() => setUnfolded(true)}
                className={[
                  'rounded px-1 py-0.5 text-text-muted transition-colors',
                  'hover:bg-surface-hover hover:text-text-body',
                  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring',
                ].join(' ')}
              >
                {entry.count} more steps
              </button>
            ) : (
              <Step item={entry.item} onJump={onJump} />
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}

/**
 * Shown where the trail would be when `?claim=` named something that cannot be
 * a claim id. A reader who followed a mangled link is told, rather than being
 * handed the top of the argument as though they had asked for it.
 */
export function ClaimParamNotice({ rejected }: { rejected: boolean }) {
  if (!rejected) return null
  return (
    <p
      data-testid="claim-param-rejected"
      className="rounded border border-ev-yellow bg-ev-yellow-light px-2 py-1 text-sm text-text-body"
    >
      The claim you asked for is not available. You are reading the top of this argument instead.
    </p>
  )
}
