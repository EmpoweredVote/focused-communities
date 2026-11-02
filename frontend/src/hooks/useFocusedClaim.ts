import { useCallback } from 'react'
import { useSearchParams } from 'react-router'

// Claim ids are uuids. Loose on the version and variant nibbles on purpose: a
// v4 today and a v7 after some future migration are both ours, and a validator
// that pinned the version would start rejecting live links the day that
// changed. What this is for is telling a mangled link from a usable one, not
// re-deriving the server's id scheme.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export interface FocusedClaim {
  /** The claim named by a usable `?claim=`, or null when there is none. */
  claimId: string | null
  /**
   * `?claim=` was present and carried something that cannot be a claim id. The
   * reader followed a mangled link and must be told, not quietly handed the
   * root — see ClaimParamNotice.
   */
  claimParamRejected: boolean
  focusClaim: (id: string) => void
  clearFocusedClaim: () => void
}

/**
 * Owns `?claim=` on the community route: which claim is in focus, and how a
 * reader's zoom step gets written back so the view is linkable.
 *
 * The component that draws the trail stays presentational; this is the only
 * place that touches the URL.
 */
export function useFocusedClaim(): FocusedClaim {
  const [searchParams, setSearchParams] = useSearchParams()

  const raw = searchParams.get('claim')
  const claimId = raw !== null && UUID.test(raw) ? raw : null
  // Same standard the sibling `?season=` sets: a present-but-unusable value is
  // surfaced, and a bare "?claim=" is treated as absent.
  const claimParamRejected = raw !== null && raw !== '' && claimId === null

  // The functional form, every time. Handing setSearchParams an object literal
  // would replace the whole query string and so drop `?season=` — sending a
  // reader back to the default season the moment they opened a claim.
  // `replace: true` keeps Back meaning "leave this community" rather than
  // "undo one of twenty zoom steps".
  const focusClaim = useCallback(
    (id: string) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          next.set('claim', id)
          return next
        },
        { replace: true },
      )
    },
    [setSearchParams],
  )

  const clearFocusedClaim = useCallback(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.delete('claim')
        return next
      },
      { replace: true },
    )
  }, [setSearchParams])

  return { claimId, claimParamRejected, focusClaim, clearFocusedClaim }
}
