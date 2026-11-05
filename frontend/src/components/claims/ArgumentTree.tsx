import { useId, useState } from 'react'
import { useAuth } from '../../context/auth'
import { canRateClaims, claimGateReason } from '../../lib/access'
import { useFocusedClaim } from '../../hooks/useFocusedClaim'
import {
  claimNodePath,
  rootClaimPath,
  useClaimColumn,
  useClaimNode,
  useRootClaim,
  useTreeShape,
} from '../../hooks/useClaims'
import { ClaimCardSkeleton } from '../SkeletonCard'
import { ClaimBreadcrumb, ClaimParamNotice } from './ClaimBreadcrumb'
import { ClaimColumns, type ColumnFeed } from './ClaimColumns'
import { ClaimComposer } from './ClaimComposer'
import { ImpactControl } from './ImpactControl'
import { TreeMinimap } from './TreeMinimap'
import type { ClaimSide } from '../../types'

interface ArgumentTreeProps {
  communityId: string
}

// Written out per side rather than interpolated: "a supporting" and "an
// opposing" do not come from one template.
const ADD_LABEL: Record<ClaimSide, string> = {
  supports: 'Add a supporting argument',
  opposes: 'Add an opposing argument',
}

const SIDES: ClaimSide[] = ['supports', 'opposes']

/**
 * The argument for one community: breadcrumb, the claim in focus, both child
 * columns, the map, and the composer.
 *
 * ## The three states this band must keep apart (R95)
 *
 * The claims routes are built but not deployed, so every request here 404s
 * against the live API today. A band that renders an empty argument on a
 * failed request does something worse than invent data: it makes a false
 * claim about the world — "nobody has argued about this yet" — on the one
 * surface whose whole job is showing the shape of a disagreement.
 *
 * So `loading`, `failed` and `loaded and genuinely empty` are three separate
 * branches of one `if`/`else`, never a fallthrough, and each is reachable in
 * the DOM and to a screen reader on its own. They are written as an exclusive
 * chain rather than three independent `&&`s precisely so that a future edit
 * cannot quietly make "failed" render as "empty".
 *
 * ## `?claim=` (R96)
 *
 * Owned by `useFocusedClaim`, not re-read here. Two writers to one search
 * parameter is how `?season=` gets dropped from a shared link.
 */
export function ArgumentTree({ communityId }: ArgumentTreeProps) {
  const headingId = useId()
  // signIn comes from the context rather than a locally built accounts URL:
  // one place knows where sign-in lives.
  const { auth, signIn } = useAuth()
  const { claimId, claimParamRejected, focusClaim, clearFocusedClaim } = useFocusedClaim()

  // Derived from the user object, never from the AccessState name:
  // detectUserState() never reads account_standing, so a suspended connected
  // account arrives as { state: 'connected' } and a reader who may write
  // arrives as { state: 'connected_no_compass' } (R98).
  const canWrite = canRateClaims(auth)
  const gate = claimGateReason(auth)
  // Two states the server will always refuse a write on, and the UI already
  // holds both facts: a merged parent answers 409 (R34) and a hidden one — or
  // any claim under a hidden ancestor — answers 404 (R33/R55/R103). Offering
  // the buttons anyway costs the reader a draft's worth of effort for a trip
  // that cannot succeed, and offering the rating scale on a merged claim feeds
  // ratings into a claim that by construction collects nothing further.
  const noWritesReason = (claim: { isHidden: boolean; mergedInto: string | null }) =>
    claim.mergedInto ? ('merged' as const) : claim.isHidden ? ('removed' as const) : null

  // Which composer is open, carried WITH the claim it belongs to rather than
  // reset by an effect when the focus moves. An open composer for a claim the
  // reader has zoomed away from would post to the wrong parent.
  // `movedByMerge` rides along so the composer that opens at the destination
  // can say why it is there; it is set only by the offer below, never by a
  // reader opening a composer themselves.
  const [openOn, setOpenOn] = useState<{
    parentId: string
    side: ClaimSide
    movedByMerge?: boolean
  } | null>(null)

  // Exactly one of these is enabled: the other is called with undefined, which
  // its own `enabled` turns off.
  const rootQuery = useRootClaim(claimId ? undefined : communityId)
  const nodeQuery = useClaimNode(claimId ?? undefined)
  const query = claimId ? nodeQuery : rootQuery
  const requestPath = claimId ? claimNodePath(claimId) : rootClaimPath(communityId)

  const shapeQuery = useTreeShape(communityId)

  // One response carries page one of both columns and a separate
  // { cursor, hasMore } for each. The two advance independently, so each side
  // gets its own paging query; neither fetches anything until the reader asks.
  const supportsPages = useClaimColumn(requestPath, 'supports', query.data?.meta.supports)
  const opposesPages = useClaimColumn(requestPath, 'opposes', query.data?.meta.opposes)

  const node = query.data?.node
  // With placeholderData the previous claim stays on screen while the next
  // one loads. It is the previous claim, not the one that was asked for, so
  // it is dimmed and marked busy rather than presented as the answer.
  const stale = query.isPlaceholderData

  // Page one comes with the node; the pages after it come from the side's own
  // query. `total` is the server's count for the side, so the column can tell
  // "this side is empty" from "this side is the top of a longer list".
  function feed(side: ClaimSide, pages: typeof supportsPages): ColumnFeed {
    return {
      claims: node ? [...node[side], ...pages.extra] : [],
      total: node ? (side === 'supports' ? node.claim.childSupports : node.claim.childOpposes) : 0,
      hasMore: pages.hasMore,
      isFetching: pages.isFetching,
      error: pages.error,
      requestPath: pages.requestPath,
      onShowMore: pages.showMore,
    }
  }

  return (
    <section data-band="arguments" aria-labelledby={headingId} className="mb-10">
      <h2 id={headingId} className="mb-4 text-lg font-semibold text-text-body">
        Arguments
      </h2>

      {/* Only on a branch where "you are reading the top of this argument
          instead" is true. Beside the failure block it contradicts it: that
          block says none of the argument is shown, and this says which part of
          it the reader got. */}
      <ClaimParamNotice rejected={claimParamRejected && !query.isError} />

      {query.isError ? (
        <div
          data-testid="argument-tree-error"
          role="alert"
          className="rounded-lg border border-border-light p-4"
        >
          <p className="text-text-secondary">
            This argument could not be loaded, so none of it is shown here. That is not the same
            as there being nothing to show.
          </p>
          <p className="mt-2 text-sm text-text-muted">
            <code data-testid="argument-tree-error-detail">
              {requestPath} — {query.error.message}
            </code>
          </p>
          <button
            onClick={() => query.refetch()}
            className="mt-3 rounded-lg bg-ev-coral px-4 py-2 text-sm text-white transition-colors hover:bg-ev-coral-hover"
          >
            Try Again
          </button>
        </div>
      ) : !node ? (
        <div data-testid="argument-tree-loading" aria-busy="true" aria-label="Loading the argument">
          <ClaimCardSkeleton />
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <ClaimCardSkeleton />
            <ClaimCardSkeleton />
          </div>
        </div>
      ) : (
        <div
          data-testid="argument-tree"
          aria-busy={stale}
          className={`transition-opacity ${stale ? 'opacity-50' : ''}`}
        >
          <ClaimBreadcrumb trail={node.breadcrumb} onJump={focusClaim} />

          {claimId && (
            <button
              type="button"
              onClick={clearFocusedClaim}
              className="mt-1 rounded px-1 py-0.5 text-xs text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-body focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
            >
              Back to the top of this argument
            </button>
          )}

          {/* The claim in focus is an article, not a ClaimCard: a card is a
              <button> that moves you somewhere, and this is the claim you are
              already on. It is also what lets the rating control below sit
              outside a button, which is the only valid place for it. */}
          <article
            data-focused-claim={node.claim.id}
            className="mt-2 rounded-lg border border-border-light bg-surface-card p-4"
          >
            {node.claim.isHidden || node.claim.body.trim() === '' ? (
              <p className="italic leading-relaxed text-text-muted">This claim was removed.</p>
            ) : (
              <p className="leading-relaxed text-text-body">{node.claim.body}</p>
            )}
            <p className="mt-2 text-xs text-text-secondary">
              {node.claim.childSupports} supporting {'·'} {node.claim.childOpposes} opposing
            </p>
            {/* The same mark the card and the map give this claim. Without it,
                zooming in is where a merged claim turns back into an ordinary
                one — exactly where the reader is looking hardest. The target
                may be outside this payload, so it is named nowhere. */}
            {node.claim.mergedInto && (
              <p data-testid="focused-claim-merged" className="mt-1 text-xs text-text-muted">
                Merged into another claim
              </p>
            )}
          </article>

          {!node.claim.isHidden && node.claim.body.trim() !== '' && (
            <div className="mt-2">
              <ImpactControl
                // Re-keyed per claim so the control is rebuilt rather than
                // reused. It holds its own mutation, and the displayed
                // selection falls back to the in-flight one: without this, a
                // rating still in flight for claim A shows as checked under
                // claim B, which is a statement about this reader's rating of
                // B and is false. The same instance would also announce A's
                // refusal under B through role="status".
                key={node.claim.id}
                claimId={node.claim.id}
                side={node.claim.side}
                impact={node.claim.impact}
                ratingCount={node.claim.ratingCount}
                myRating={node.claim.myRating}
                canRate={canWrite && !noWritesReason(node.claim)}
              />
            </div>
          )}

          {/* ImpactControl renders no affordance at all when canRate is false
              (R102) because it cannot tell a signed-out reader from a
              suspended one from a navigation card. This is the surface that
              knows, so this is where the invitation lives — and one sentence
              covers both consequences, rating and adding, rather than two
              notices saying nearly the same thing. */}
          {gate === 'not-connected' && (
            <p data-testid="claim-gate-not-connected" className="mt-3 text-sm text-text-secondary">
              Connected accounts can rate these arguments and add their own.{' '}
              <button
                type="button"
                onClick={() => signIn()}
                // The semantic link token, not the brand one: --color-ev-teal-light
                // is 2.49:1 on the card and 2.31:1 on the page background, and
                // this is the one control a signed-out reader can act on (I9).
                className="cursor-pointer border-none bg-transparent p-0 text-link underline hover:text-link-hover"
              >
                Sign in
              </button>
            </p>
          )}
          {gate === 'suspended' && (
            <p data-testid="claim-gate-suspended" className="mt-3 text-sm text-text-secondary">
              Your account is suspended, so you cannot rate these arguments or add your own.
            </p>
          )}

          {/* Said once, to a reader who could otherwise write: the buttons are
              gone and this is why. A reader who may not write already has the
              gate sentence above, and two notices saying nearly the same thing
              is what that comment warns against. */}
          {canWrite && noWritesReason(node.claim) && (
            <p data-testid="claim-closed-to-writes" className="mt-3 text-sm text-text-secondary">
              {noWritesReason(node.claim) === 'merged'
                ? 'This claim was merged into another one, so it takes no new arguments or ratings.'
                : 'This claim was removed, so it takes no new arguments.'}
            </p>
          )}

          {canWrite && !noWritesReason(node.claim) && (
            <div className="mt-3">
              <div className="flex flex-wrap gap-2">
                {SIDES.map((side) => (
                  <button
                    key={side}
                    type="button"
                    data-add-side={side}
                    onClick={() =>
                      setOpenOn(
                        openOn && openOn.parentId === node.claim.id && openOn.side === side
                          ? null
                          : { parentId: node.claim.id, side },
                      )
                    }
                    className="rounded-lg border border-border-medium px-3 py-1.5 text-sm text-text-secondary transition-colors hover:bg-surface-hover"
                  >
                    {ADD_LABEL[side]}
                  </button>
                ))}
              </div>
              {openOn && openOn.parentId === node.claim.id && (
                <ClaimComposer
                  // Re-keyed per side so switching sides remounts the form
                  // against its own draft rather than carrying one across.
                  key={`${openOn.parentId}:${openOn.side}`}
                  parentId={openOn.parentId}
                  side={openOn.side}
                  onClose={() => setOpenOn(null)}
                  // The parent was merged while they were writing. Put the
                  // claim that now carries the argument on screen and open a
                  // composer on it, same side: the draft has already moved
                  // with them, and the re-key below remounts the form against
                  // it rather than against the draft they just left.
                  movedByMerge={openOn.movedByMerge}
                  onMoveTo={(destinationId) => {
                    focusClaim(destinationId)
                    setOpenOn({ parentId: destinationId, side: openOn.side, movedByMerge: true })
                  }}
                />
              )}
            </div>
          )}

          {/* True only because the request succeeded — and only because both
              columns came back whole. A column with a cursor behind it, or
              with a non-zero count above it, is not an argument nobody has
              answered; it is one this client has not finished reading. */}
          {node.supports.length === 0 &&
            node.opposes.length === 0 &&
            node.claim.childSupports === 0 &&
            node.claim.childOpposes === 0 &&
            !supportsPages.hasMore &&
            !opposesPages.hasMore && (
              <p data-testid="argument-tree-empty" className="mt-4 text-sm text-text-muted">
                Nobody has answered this claim yet.
              </p>
            )}

          <div className="mt-4">
            <ClaimColumns
              supports={feed('supports', supportsPages)}
              opposes={feed('opposes', opposesPages)}
              onOpen={focusClaim}
            />
          </div>

          <div className="mt-6">
            {shapeQuery.isError ? (
              <p data-testid="tree-minimap-error" className="text-sm text-text-secondary">
                The map of this argument could not be loaded.{' '}
                <code className="text-text-muted">{shapeQuery.error.message}</code>
              </p>
            ) : shapeQuery.data ? (
              <TreeMinimap
                shape={shapeQuery.data.nodes}
                focusedId={node.claim.id}
                meta={shapeQuery.data.meta}
                onJump={focusClaim}
              />
            ) : null}
          </div>
        </div>
      )}
    </section>
  )
}
