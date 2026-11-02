import { useId } from 'react'
import type { Claim, ClaimSide } from '../../types'
import { ClaimCard } from './ClaimCard'

/**
 * One side of the argument, as much of it as has been asked for.
 *
 * `total` is the parent's own count for this side and `hasMore` is the
 * server's word on whether the page the reader is looking at is the whole
 * side. Both are here because a column that decides emptiness from
 * `claims.length === 0` alone prints "No supporting arguments yet." over an
 * arbitrary prefix of a longer list — and the arguments that fall off the end
 * are not random: impact leads the sort, so what vanishes is whatever the
 * community rated lowest.
 */
export interface ColumnFeed {
  claims: Claim[]
  /** The parent claim's own count for this side, straight from the server. */
  total: number
  hasMore: boolean
  isFetching: boolean
  /** A failed request for a later page: the message and the URL that failed. */
  error: string | null
  requestPath: string | null
  onShowMore: () => void
}

interface ClaimColumnsProps {
  supports: ColumnFeed
  opposes: ColumnFeed
  onOpen: (id: string) => void
}

interface ColumnProps extends ColumnFeed {
  side: ClaimSide
  heading: string
  /** "supporting arguments" / "opposing arguments", written out per side. */
  what: string
  onOpen: (id: string) => void
}

// The side colour lives in the rule under the heading, never in the heading's
// own `color:` — on white, opposes reads at 3.14:1, which clears 3:1 for a rule
// and fails 4.5:1 for text.
const SIDE_RULE: Record<ClaimSide, string> = {
  supports: 'border-claim-supports',
  opposes: 'border-claim-opposes',
}

function Column({
  side,
  heading,
  what,
  claims,
  total,
  hasMore,
  isFetching,
  error,
  requestPath,
  onShowMore,
  onOpen,
}: ColumnProps) {
  const headingId = useId()
  // Three different things, kept apart the way the band above keeps loading,
  // failed and empty apart: this side is genuinely empty; this side is counted
  // as non-empty and still came back with nothing; this side is a prefix.
  const isEmpty = claims.length === 0 && !hasMore
  return (
    <section data-column={side} aria-labelledby={headingId}>
      {/* Rendered at every width: the heading is the thing that tells a reader
          which half of the argument they are in once the columns stack. */}
      <h3
        id={headingId}
        className={`mb-2 border-b-2 pb-1 text-sm font-semibold uppercase tracking-wide text-text-body ${SIDE_RULE[side]}`}
      >
        {heading}
      </h3>

      {claims.length > 0 && (
        <ul className="space-y-2">
          {claims.map((claim) => (
            <li key={claim.id}>
              <ClaimCard claim={claim} onOpen={onOpen} />
            </li>
          ))}
        </ul>
      )}

      {isEmpty && total === 0 && (
        <p className="text-xs italic text-text-muted">No {what} yet.</p>
      )}

      {/* The count and the column disagree. Saying "none yet" here would be the
          louder half of a contradiction two lines apart, and the false one. */}
      {isEmpty && total > 0 && (
        <p data-column-shortfall={side} className="text-xs text-text-secondary">
          This claim is counted as having {total} {what}, and none of them came back here.
        </p>
      )}

      {hasMore && (
        <button
          type="button"
          data-show-more={side}
          onClick={onShowMore}
          disabled={isFetching}
          className="mt-2 w-full rounded-lg border border-border-medium px-3 py-1.5 text-xs text-text-secondary transition-colors hover:bg-surface-hover disabled:cursor-default focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
        >
          {isFetching ? `Loading more ${what}…` : `Show more ${what}`}
        </button>
      )}

      {error && (
        <p data-column-error={side} role="alert" className="mt-2 text-xs text-text-secondary">
          More {what} could not be loaded, so this side is only part of what is there.{' '}
          <code className="text-text-muted">
            {requestPath} — {error}
          </code>
        </p>
      )}
    </section>
  )
}

export function ClaimColumns({ supports, opposes, onOpen }: ClaimColumnsProps) {
  return (
    // Stacks below `sm` rather than collapsing: an empty side is still a side,
    // and its heading and empty line hold the split open.
    <div data-claim-columns className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Column
        {...supports}
        side="supports"
        heading="Supports"
        what="supporting arguments"
        onOpen={onOpen}
      />
      <Column
        {...opposes}
        side="opposes"
        heading="Opposes"
        what="opposing arguments"
        onOpen={onOpen}
      />
    </div>
  )
}
