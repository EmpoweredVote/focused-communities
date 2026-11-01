import { useId } from 'react'
import { impactWord } from '../../lib/impact'
import { useRateClaim } from '../../hooks/useClaimMutations'
import type { ClaimSide } from '../../types'

interface ImpactControlProps {
  claimId: string
  /**
   * null on a root claim. The bar takes the side's own colour (R94): on a card
   * the side is already stated in words and by the rail, so colour here is
   * redundant decoration and the bar's LENGTH is the only variable carrying
   * impact. That is the opposite of the minimap, where a dot has no label and
   * one palette may not carry two meanings.
   */
  side: ClaimSide | null
  /**
   * Never null, and never `impact ?? 5`. An unrated claim reads exactly 5, the
   * midpoint of the 1-9 band; "nobody has rated this" is `ratingCount === 0`,
   * a different question that this component answers separately.
   */
  impact: number
  ratingCount: number
  myRating: number | null
  /**
   * Whether this reader may rate, as `canRateClaims()` in lib/access.ts derives
   * it. When false the aggregate is still shown and no rating affordance is
   * offered at all — not a disabled one. Two reasons: a disabled radio is not
   * focusable and tells a screen-reader user nothing, and this component cannot
   * tell "signed out" from "suspended" from "this is a navigation card", so it
   * does not guess at copy. The surface that knows owns the invitation to sign
   * in.
   */
  canRate: boolean
}

// Semantic side tokens only, never the brand tokens and never raw hex. The
// contrast notes and the dark-mode remap for supports live with the tokens in
// index.css; a bar is a non-text part, so 3:1 against the card surface is the
// floor and both sides clear it in both modes.
const SIDE_FILL: Record<ClaimSide, string> = {
  supports: 'bg-claim-supports',
  opposes: 'bg-claim-opposes',
}

function impactPercent(impact: number): number {
  const clamped = Math.min(9, Math.max(1, impact))
  return ((clamped - 1) / 8) * 100
}

/**
 * Nine steps, chosen as a radiogroup rather than an `<input type="range">`
 * (R93). A native range announces `aria-valuenow` — a bare number, the one
 * thing this scale may not say — unless every step also carries an
 * `aria-valuetext`; a radiogroup gives each step a real accessible name for
 * free, keyboard support is native, and there is no number to leak.
 *
 * Words sit at the ends and the middle; the steps between them are unlabelled
 * marks on screen but each still has its own name, because "slightly more than
 * the middle" is something a screen-reader user can act on and a bare index is
 * not.
 */
const STEPS: { rating: number; name: string }[] = [
  { rating: 1, name: 'Low weight' },
  { rating: 2, name: 'Slightly more than low weight' },
  { rating: 3, name: 'Well above low weight' },
  { rating: 4, name: 'Slightly below moderate weight' },
  { rating: 5, name: 'Moderate weight' },
  { rating: 6, name: 'Slightly above moderate weight' },
  { rating: 7, name: 'Well above moderate weight' },
  { rating: 8, name: 'Slightly below high weight' },
  { rating: 9, name: 'High weight' },
]

// The words under the scale. They match impactWord()'s three buckets on
// purpose: the aggregate the reader is looking at and the choice they are
// making should not use two vocabularies for the same band.
const ANCHORS = ['Low', 'Moderate', 'High']

/**
 * The client's model of who may rate is imperfect — `AccessState` does not
 * carry account_standing through every branch — so a refusal must be said out
 * loud rather than swallowed. The API distinguishes `tier` from `suspended`
 * and apiFetch carries `reason` through, so the reader is told which happened.
 * useRateClaim has already rolled the mark back by the time this shows, which
 * is what keeps the revert from being silent.
 */
function rateFailureMessage(err: { status?: number; reason?: string }): string {
  if (err.status === 403 && err.reason === 'suspended') {
    return 'Your account is suspended, so that rating was not saved.'
  }
  if (err.status === 403 && err.reason === 'tier') {
    return 'Rating is open to connected accounts, so that rating was not saved.'
  }
  if (err.status === 403) {
    return 'The server refused that rating, so it was not saved.'
  }
  if (err.status === 429) {
    return 'That was a lot of ratings at once, so this one was not saved. Try again shortly.'
  }
  return 'That rating was not saved. Try again.'
}

interface RatingScaleProps {
  claimId: string
  side: ClaimSide | null
  myRating: number | null
}

/**
 * Split out so the hooks it needs are only mounted when the scale is. A card
 * renders the aggregate half with `canRate={false}` and must not require a
 * QueryClientProvider or an AuthProvider to do it.
 */
function RatingScale({ claimId, side, myRating }: RatingScaleProps) {
  const groupName = useId()
  const legendId = useId()
  const rate = useRateClaim()

  // The reader's own choice is the part they are watching, so it registers at
  // once. useRateClaim patches myRating optimistically into the cache, but the
  // parent may not have re-read it yet; showing the in-flight choice keeps the
  // mark from snapping back for a frame. No arithmetic on impact happens here
  // or anywhere else on the client — impact and ratingCount arrive from the
  // mutation's response.
  const selected = rate.isPending ? (rate.variables?.rating ?? myRating) : myRating

  return (
    <fieldset role="radiogroup" aria-labelledby={legendId} className="mt-3">
      <legend id={legendId} className="text-xs font-medium text-text-secondary">
        How much weight does this argument deserve?
      </legend>
      <div className="mt-1.5 flex items-end gap-1">
        {STEPS.map((step) => {
          const checked = selected === step.rating
          return (
            <label key={step.rating} className="flex-1 cursor-pointer">
              <input
                type="radio"
                name={groupName}
                checked={checked}
                onChange={() => rate.mutate({ claimId, rating: step.rating })}
                className="peer sr-only"
              />
              {/* The step's whole accessible name. The mark beside it is
                  decoration and says so, so nothing announces an index. */}
              <span className="sr-only">{step.name}</span>
              <span
                aria-hidden="true"
                // Rising height makes nine marks read as a scale without
                // printing a single digit.
                style={{ height: `${10 + step.rating * 2}px` }}
                className={[
                  'block rounded-sm border',
                  checked
                    ? `border-transparent ${side ? SIDE_FILL[side] : 'bg-border-medium'}`
                    : 'border-border-medium bg-surface-card hover:bg-surface-hover',
                  'peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus-ring',
                ].join(' ')}
              />
            </label>
          )
        })}
      </div>
      <div className="mt-1 flex justify-between text-xs text-text-muted">
        {ANCHORS.map((word) => (
          <span key={word}>{word}</span>
        ))}
      </div>
      {rate.isError && rate.error && (
        <p role="status" className="mt-1 text-xs text-text-body">
          {rateFailureMessage(rate.error)}
        </p>
      )}
    </fieldset>
  )
}

/**
 * The aggregate and, for a reader entitled to it, the scale that feeds it.
 *
 * There is exactly one impact bar in the app and it is this one: the card used
 * to draw its own and now renders this instead, so a reader never meets two
 * readouts of the same quantity. The figure itself never ships — not in the
 * text, not in an aria-label, not in a test id. A bar plus a word; the digits
 * stay on the server.
 */
export function ImpactControl({
  claimId,
  side,
  impact,
  ratingCount,
  myRating,
  canRate,
}: ImpactControlProps) {
  // The only honest way to say nobody has rated this. impact is still 5 in that
  // case, so a bar alone could not tell "unrated" apart from "opinion is split".
  const isRated = ratingCount > 0

  return (
    <div data-impact-control>
      {isRated ? (
        <div className="flex items-center gap-2">
          <div
            role="img"
            aria-label={`Impact so far: ${impactWord(impact)}`}
            className="h-1.5 flex-1 overflow-hidden rounded-full bg-border-light"
          >
            <div
              className={`h-full rounded-full ${side ? SIDE_FILL[side] : 'bg-border-medium'}`}
              style={{ width: `${impactPercent(impact)}%` }}
            />
          </div>
          <span className="shrink-0 text-xs text-text-muted">
            {ratingCount} {ratingCount === 1 ? 'rating' : 'ratings'}
          </span>
        </div>
      ) : (
        <p className="text-xs text-text-muted">Not yet rated</p>
      )}

      {canRate && <RatingScale claimId={claimId} side={side} myRating={myRating} />}
    </div>
  )
}
