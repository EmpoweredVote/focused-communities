import { useId } from 'react'
import type { Claim, ClaimSide } from '../../types'
import { ClaimCard } from './ClaimCard'

interface ClaimColumnsProps {
  supports: Claim[]
  opposes: Claim[]
  onOpen: (id: string) => void
}

interface ColumnProps {
  side: ClaimSide
  heading: string
  empty: string
  claims: Claim[]
  onOpen: (id: string) => void
}

// The side colour lives in the rule under the heading, never in the heading's
// own `color:` — on white, opposes reads at 3.14:1, which clears 3:1 for a rule
// and fails 4.5:1 for text.
const SIDE_RULE: Record<ClaimSide, string> = {
  supports: 'border-claim-supports',
  opposes: 'border-claim-opposes',
}

function Column({ side, heading, empty, claims, onOpen }: ColumnProps) {
  const headingId = useId()
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
      {claims.length === 0 ? (
        <p className="text-xs italic text-text-muted">{empty}</p>
      ) : (
        <ul className="space-y-2">
          {claims.map((claim) => (
            <li key={claim.id}>
              <ClaimCard claim={claim} onOpen={onOpen} />
            </li>
          ))}
        </ul>
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
        side="supports"
        heading="Supports"
        empty="No supporting arguments yet."
        claims={supports}
        onOpen={onOpen}
      />
      <Column
        side="opposes"
        heading="Opposes"
        empty="No opposing arguments yet."
        claims={opposes}
        onOpen={onOpen}
      />
    </div>
  )
}
