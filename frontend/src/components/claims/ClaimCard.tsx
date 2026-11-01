import type { Claim, ClaimSide } from '../../types'

interface ClaimCardProps {
  claim: Claim
  onOpen: (id: string) => void
}

const SIDE_LABEL: Record<ClaimSide, string> = {
  supports: 'Supports',
  opposes: 'Opposes',
}

// The side must survive greyscale, so each side carries three signals: the word,
// a leading mark, and a border style. Colour is the fourth, never the only one.
const SIDE_MARK: Record<ClaimSide, string> = {
  supports: '+', // plus
  opposes: '−', // minus
}

const SIDE_BORDER: Record<ClaimSide, string> = {
  supports: 'border-l-claim-supports [border-left-style:solid]',
  opposes: 'border-l-claim-opposes [border-left-style:dashed]',
}

const SIDE_FILL: Record<ClaimSide, string> = {
  supports: 'bg-claim-supports',
  opposes: 'bg-claim-opposes',
}

// `impact` is a Bayesian mean on a 1-9 band. It may be SHOWN — it is not a
// Compass stance. The project rule about never showing 1-5 is about the
// Compass's five positions, which are not a scale and have no midpoint; impact
// is a different quantity in a different band. What it may never be is a
// printed number: an unrated claim reads exactly 5, "5.6667" means nothing to a
// reader, and a bare figure beside an argument invites being read as a score
// someone assigned. Bar plus a qualitative alternative; the digits never ship.
function impactWord(impact: number): string {
  if (impact < 4) return 'low'
  if (impact > 6) return 'high'
  return 'moderate'
}

function impactPercent(impact: number): number {
  const clamped = Math.min(9, Math.max(1, impact))
  return ((clamped - 1) / 8) * 100
}

export function ClaimCard({ claim, onOpen }: ClaimCardProps) {
  // `side` is null on a root. A root is never asked for inside a column, but it
  // must render rather than crash if it is.
  const side = claim.side
  // `body` is '' on a hidden claim — that is the tombstone, not missing data.
  const isTombstone = claim.isHidden || claim.body.trim() === ''
  // ratingCount === 0 is the only honest way to say nobody has rated this;
  // impact is still 5 in that case, so a bar alone could not tell the reader
  // "unrated" apart from "opinion is split".
  const isRated = claim.ratingCount > 0

  return (
    <button
      type="button"
      data-side={side ?? 'none'}
      onClick={() => onOpen(claim.id)}
      className={[
        'block w-full rounded-lg border border-l-4 border-border-light bg-surface-card p-3 text-left',
        'shadow-sm transition-colors hover:bg-surface-hover',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring',
        side ? SIDE_BORDER[side] : 'border-l-border-medium',
      ].join(' ')}
    >
      {side && (
        <span className="mb-1 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-text-body">
          <span aria-hidden="true">{SIDE_MARK[side]}</span>
          <span>{SIDE_LABEL[side]}</span>
        </span>
      )}

      {isTombstone ? (
        <p className="text-sm italic leading-relaxed text-text-muted">This claim was removed.</p>
      ) : (
        <p className="text-sm leading-relaxed text-text-body">{claim.body}</p>
      )}

      {/* The structure survives hiding even when the text does not, so the
          per-side child counts stay on a tombstone. */}
      <p className="mt-2 text-xs text-text-secondary">
        {claim.childSupports} supporting {'·'} {claim.childOpposes} opposing
      </p>

      {!isTombstone && (
        <>
          {isRated ? (
            <div className="mt-2 flex items-center gap-2">
              <div
                role="img"
                aria-label={`Impact so far: ${impactWord(claim.impact)}`}
                className="h-1.5 flex-1 overflow-hidden rounded-full bg-border-light"
              >
                <div
                  className={`h-full rounded-full ${side ? SIDE_FILL[side] : 'bg-border-medium'}`}
                  style={{ width: `${impactPercent(claim.impact)}%` }}
                />
              </div>
              <span className="shrink-0 text-xs text-text-muted">
                {claim.ratingCount} {claim.ratingCount === 1 ? 'rating' : 'ratings'}
              </span>
            </div>
          ) : (
            <p className="mt-2 text-xs text-text-muted">Not yet rated</p>
          )}

          {(claim.authorPseudonym || claim.mergedInto) && (
            <p className="mt-1 flex items-center gap-2 text-xs text-text-muted">
              {/* No fallback name: a null pseudonym means no byline, never an
                  invented one. */}
              {claim.authorPseudonym && <span data-byline>{claim.authorPseudonym}</span>}
              {/* The merge target may be outside this payload, so the card says
                  a merge happened and names nothing it cannot show. */}
              {claim.mergedInto && <span>Merged into another claim</span>}
            </p>
          )}
        </>
      )}
    </button>
  )
}
