import type { AccessState, AccountUser } from '../context/AuthContext'

/**
 * Mirrors the server's `requireConnected` gate (`middleware/tierGuards.ts`)
 * exactly, and that gate is narrower than it looks:
 *
 *  - tier is `connected` or `empowered`, and
 *  - account_standing is `active`, and
 *  - completed_onboarding is DELIBERATELY not checked. Calibration is not a
 *    write gate, so a reader whose Compass is unfinished may still rate.
 *
 * It cannot be written as a check on `auth.state`. `detectUserState()` branches
 * on tier and completed_onboarding and never reads account_standing, so a
 * suspended connected account arrives here as `{ state: 'connected' }` — and a
 * reader who may rate arrives as `{ state: 'connected_no_compass' }`. Deriving
 * the gate from the state name is wrong in both directions: too strict locks a
 * reader out of a control they are entitled to, too loose hands them a control
 * that 403s on click.
 *
 * It lives in `lib/` rather than beside `useAuth` because AuthContext.tsx is a
 * component file; one more non-component export there is one more
 * react-refresh error.
 */
export function canRateClaims(auth: AccessState): boolean {
  const user: AccountUser | null = 'user' in auth ? auth.user : null
  if (!user) return false
  if (user.tier !== 'connected' && user.tier !== 'empowered') return false
  return user.account_standing === 'active'
}

export type ClaimGateReason = 'ok' | 'loading' | 'not-connected' | 'suspended'

/**
 * WHY the gate said no, for the surface that has to word the invitation.
 *
 * It is deliberately a thin wrapper around `canRateClaims` rather than a
 * second copy of the rule: 'ok' is defined as "canRateClaims said yes", so the
 * two cannot drift apart, and everything below only explains a refusal.
 *
 * The same server gate (`requireConnected`) guards rating and adding a claim,
 * so one reason serves both surfaces.
 *
 * 'not-connected' covers two cases the client cannot tell apart and does not
 * need to: `detectUserState()` collapses a signed-out visitor and an `inform`
 * tier account into the same `{ state: 'inform' }`. Both are answered by the
 * same invitation, which is why the wording names the tier rather than
 * asserting the reader is signed out.
 */
export function claimGateReason(auth: AccessState): ClaimGateReason {
  if (canRateClaims(auth)) return 'ok'
  if (auth.state === 'loading') return 'loading'
  const user: AccountUser | null = 'user' in auth ? auth.user : null
  // A suspended account is one that HAS a usable tier and lost its standing.
  // An inform-tier account that is also suspended is told about the tier,
  // because restoring standing alone would not open the control.
  if (user && (user.tier === 'connected' || user.tier === 'empowered')) {
    if (user.account_standing !== 'active') return 'suspended'
  }
  return 'not-connected'
}
