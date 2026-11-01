import type { Claim, ClaimSide } from '../../types'
import { ImpactControl } from './ImpactControl'

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

export function ClaimCard({ claim, onOpen }: ClaimCardProps) {
  // `side` is null on a root. A root is never asked for inside a column, but it
  // must render rather than crash if it is.
  const side = claim.side
  // `body` is '' on a hidden claim — that is the tombstone, not missing data.
  const isTombstone = claim.isHidden || claim.body.trim() === ''

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
          {/* The one impact readout on a card, and it lives in ImpactControl so
              that a card and an opened claim cannot drift into two different
              bars. `canRate` is false here, and is not a prop of the card: a
              card is itself a <button>, an interactive control may not nest
              inside one, and a column card is for moving to a claim rather than
              rating it. The scale belongs to the claim the reader has opened. */}
          <div className="mt-2">
            <ImpactControl
              claimId={claim.id}
              side={side}
              impact={claim.impact}
              ratingCount={claim.ratingCount}
              myRating={claim.myRating}
              canRate={false}
            />
          </div>

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
