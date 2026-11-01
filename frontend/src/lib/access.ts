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
