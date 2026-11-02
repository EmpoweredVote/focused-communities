import { useState } from 'react'
import { CharCounter } from '../CharCounter'
import { useCreateClaim } from '../../hooks/useClaimMutations'
import { useDraft } from '../../hooks/useDraft'
import { useViewer } from '../../hooks/useClaims'
import type { ClaimSide } from '../../types'

interface ClaimComposerProps {
  /** The claim the new one is attached to. */
  parentId: string
  side: ClaimSide
  /** Called after the claim is created, and when the reader backs out. */
  onClose: () => void
}

// The server's bounds, measured the same way the server measures them — on the
// TRIMMED body (routes/claimWrites.ts, BODY_MIN/BODY_MAX). A client that
// counted the untrimmed string would let through ten spaces and get a 400 the
// reader cannot act on.
const BODY_MIN = 10
const BODY_MAX = 500
// The field's own label, distinct from the trigger that opened the form so
// that two controls on screen do not share one name.
const FIELD_LABEL: Record<ClaimSide, string> = {
  supports: 'Your supporting argument',
  opposes: 'Your opposing argument',
}

/**
 * The draft key carries the SIDE as well as the parent (R99), and the VIEWER.
 *
 * Keyed by parent alone, a reader who starts a supporting argument, changes
 * their mind and opens the opposing composer on the same claim finds their own
 * supporting text waiting there as the opposing one. The two are different
 * drafts about the same claim and must not share a slot.
 *
 * The viewer is the third term, and the one that was missing: `signOut()`
 * removes `ev_token` and leaves localStorage's drafts where they are, so on a
 * shared device the next reader opening the same composer found the previous
 * reader's half-written argument in it. Same reasoning as the query keys —
 * anything that can hold one reader's words carries who they were.
 */
function claimDraftKey(parentId: string, side: ClaimSide, viewer: string): string {
  return `draft-claim-${viewer}-${side}-${parentId}`
}

/**
 * What the reader is told when the server refuses.
 *
 * Keyed on the server's error CODE where there is one, and on the status
 * otherwise. The code is what lets this say which of two refusals that share a
 * status actually happened — ANCESTOR_NOT_VISIBLE and CLAIM_NOT_FOUND are both
 * 404, and the write route takes deliberate care to keep them apart, because
 * only one of them suggests making the argument somewhere else.
 *
 * The status branches below are still the whole answer for anything that did
 * not come back in the claims API's envelope: a proxy's error page, or any
 * endpoint that answers in the older flat shape. Each of those lines says only
 * what the status alone supports.
 */
function createFailureMessage(err: { status?: number; reason?: string; code?: string }): string {
  if (err.status === 403 && err.reason === 'suspended') {
    return 'Your account is suspended, so this argument was not added.'
  }
  if (err.status === 403 && err.reason === 'tier') {
    return 'Adding an argument is open to connected accounts, so this one was not added.'
  }
  if (err.status === 403) {
    return 'The server refused this argument, so it was not added.'
  }
  if (err.code === 'ANCESTOR_NOT_VISIBLE') {
    // Not the point being answered — the discussion above it. Worth saying,
    // because the argument may still have a place elsewhere in the tree.
    return 'The discussion above this point was removed, so this was not added. The argument may still belong elsewhere in this tree.'
  }
  if (err.code === 'CLAIM_NOT_FOUND') {
    return 'The claim you are answering is no longer part of this argument, so this was not added.'
  }
  if (err.code === 'CLAIM_MERGED') {
    return 'That claim has been merged into another one, so nothing can be added under it.'
  }
  if (err.code === 'MAX_DEPTH_REACHED') {
    return 'This argument has reached its maximum depth, so nothing further can be added here.'
  }
  if (err.code === 'INVALID_BODY') {
    // The server measures the trimmed body against the same two bounds this
    // form counts against, so the numbers here are the server's own.
    return `An argument has to be between ${BODY_MIN} and ${BODY_MAX} characters, so this one was not added.`
  }
  if (err.status === 404) {
    // No code came through: the two 404s above cannot be told apart, and
    // guessing which one happened would be inventing the reason.
    return 'The claim you are answering is no longer part of this argument, so this was not added.'
  }
  if (err.status === 409) {
    return 'That claim has been merged into another one, so nothing can be added under it.'
  }
  if (err.status === 422) {
    return 'This argument has reached its maximum depth, so nothing further can be added here.'
  }
  if (err.status === 400) {
    return 'The server would not accept this text, so it was not added.'
  }
  if (err.status === 429) {
    return 'That was a lot of writing at once, so this one was not added. Try again shortly.'
  }
  if (err.status === 0) {
    return 'That argument could not be sent, so it was not added.'
  }
  return `That argument was not added (error ${err.status ?? 'unknown'}).`
}

/**
 * Writes one child claim under `parentId`.
 *
 * It does NOT gate itself: the caller mounts it only for a reader
 * `canRateClaims()` admits, because the surface above knows the reason for a
 * refusal and owns the wording of the invitation. The server is the real gate
 * and its refusal is surfaced here rather than swallowed.
 */
export function ClaimComposer({ parentId, side, onClose }: ClaimComposerProps) {
  const { viewer } = useViewer()
  const [body, setBody, clearDraft] = useDraft(claimDraftKey(parentId, side, viewer))
  const [touched, setTouched] = useState(false)
  const create = useCreateClaim()

  const trimmed = body.trim()
  const tooShort = trimmed.length < BODY_MIN
  const tooLong = trimmed.length > BODY_MAX
  const error = touched && tooShort ? `An argument must be at least ${BODY_MIN} characters.` : ''
  const canSubmit = !tooShort && !tooLong && !create.isPending

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setTouched(true)
    if (!canSubmit) return
    create.mutate(
      { parentId, side, body: trimmed },
      {
        onSuccess: () => {
          // The only path that discards the reader's text. Every failure keeps
          // it: it is the one thing in this feature they cannot get back.
          clearDraft()
          onClose()
        },
      },
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      data-claim-composer={side}
      className="mt-3 rounded-lg border border-border-light bg-surface-card p-3"
    >
      <label
        htmlFor={`claim-composer-${side}`}
        className="block text-sm font-medium text-text-secondary"
      >
        {FIELD_LABEL[side]}
      </label>
      <textarea
        id={`claim-composer-${side}`}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        onBlur={() => setTouched(true)}
        maxLength={BODY_MAX}
        rows={3}
        className="mt-1 w-full resize-none rounded-lg border border-border-medium px-3 py-2 text-sm focus:outline-2 focus:outline-offset-2 focus:outline-focus-ring"
      />
      <CharCounter value={body} max={BODY_MAX} />
      {error && <p className="mt-1 text-xs text-text-body">{error}</p>}

      {create.isError && create.error && (
        <div role="alert" data-testid="claim-composer-error" className="mt-1 text-xs text-text-body">
          <p>{createFailureMessage(create.error)}</p>
          {/* Said once, every time, so the reader can see their words are not
              gone before they decide what to do next. */}
          <p className="text-text-secondary">Your text has been kept.</p>
        </div>
      )}

      <div className="mt-2 flex items-center gap-2">
        <button
          type="submit"
          disabled={!canSubmit}
          className="rounded-lg bg-ev-coral px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-ev-coral-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          {create.isPending ? 'Adding...' : 'Add argument'}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg px-3 py-2 text-sm text-text-secondary transition-colors hover:bg-surface-hover"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
