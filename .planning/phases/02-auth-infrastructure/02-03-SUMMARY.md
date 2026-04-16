---
phase: 02-auth-infrastructure
plan: "03"
name: frontend-auth-primitives
subsystem: frontend-auth
tags: [react, typescript, auth, context, fetch, framer]

dependency-graph:
  requires:
    - "02-01 (accounts API — /api/account/me endpoint)"
    - "02-02 (Auth Hub login redirect flow)"
  provides:
    - AuthProvider component with token lifecycle
    - useAuth hook for consuming auth state
    - apiFetch typed fetch wrapper with 401/403 handling
    - AuthGate component for write-gated UI
    - SuspendedNotice component for inline suspension display
  affects:
    - "Phase 5 (Framer UI components consume AuthContext, apiFetch, AuthGate)"

tech-stack:
  added: []
  patterns:
    - "Discriminated union AccessState for type-safe auth branching"
    - "URL hash token extraction + localStorage persistence (ev_token)"
    - "New-tab 401 redirect (window.open) to preserve draft content"
    - "Disabled-not-hidden inform gate (UX: always show write affordance)"

key-files:
  created:
    - frontend-src/tsconfig.json
    - frontend-src/context/AuthContext.tsx
    - frontend-src/lib/apiFetch.ts
    - frontend-src/components/AuthGate.tsx
  modified: []

decisions:
  - id: hash-cleanup-replacestate
    summary: "Use window.history.replaceState for access_token hash removal"
    rationale: "window.location.hash = '' adds a history entry; replaceState does not"
  - id: 401-new-tab
    summary: "apiFetch opens Auth Hub in new tab (window.open) on 401"
    rationale: "Preserves current tab and any unsaved draft content"
  - id: connected-no-compass-can-write
    summary: "connected_no_compass passes through AuthGate without blocking"
    rationale: "Compass calibration is not a write gate — onboarding incomplete != suspended"
  - id: suspended-notice-separate
    summary: "SuspendedNotice is separate from AuthGate; suspension detected at API call time"
    rationale: "Clean separation: AuthGate handles identity/tier, suspension is a 403 response concern"

metrics:
  duration: "~2 min"
  completed: "2026-04-15"
  tasks-completed: 2
  tasks-total: 2
  deviations: 0
---

# Phase 02 Plan 03: Frontend Auth Primitives Summary

**One-liner:** URL-hash token extraction with `window.history.replaceState` cleanup, typed `apiFetch` with new-tab 401 handling, and disabled-not-hidden `AuthGate` component for write-gated Framer UI.

## What Was Built

Three files in `frontend-src/` establishing the complete frontend auth layer for Phase 5 Framer components:

1. **`frontend-src/tsconfig.json`** — Standalone React+TypeScript config (`ESNext` module, `bundler` resolution, `react-jsx`) targeting Framer's build system. Not extending backend tsconfig.

2. **`frontend-src/context/AuthContext.tsx`** — Core auth layer:
   - `AccountUser` interface (id, tier, account_standing, completed_onboarding, display_name — no legal_name or tolerance_rating)
   - `AccessState` discriminated union (loading / inform / connected_no_compass / connected)
   - `AuthProvider`: extracts `access_token` from URL hash on mount, saves to `localStorage.ev_token`, cleans hash with `window.history.replaceState`
   - `detectUserState()`: calls `/api/account/me`, handles 401 by clearing token, maps tier + onboarding to AccessState
   - `signIn()`: redirects to Auth Hub with encoded return URL
   - `signOut()`: clears `ev_token`, sets state to inform
   - `useAuth()`: throws if used outside provider

3. **`frontend-src/lib/apiFetch.ts`** — Typed fetch wrapper:
   - `ApiResult<T>` discriminated union (`ok: true; data: T` | `ok: false; error; status; reason?`)
   - Reads `ev_token` from localStorage, attaches as Bearer token
   - Network errors → `{ ok: false, error: 'Network error', status: 0 }`
   - 401 → `window.open(..., '_blank')` to Auth Hub (preserves tab + draft content), returns expired session error
   - 403 → parses `body.reason` and surfaces it in result
   - Other non-ok → `{ ok: false, error: 'Request failed (N)', status: N }`

4. **`frontend-src/components/AuthGate.tsx`** — Write-gate component + suspension notice:
   - `loading`: renders disabled skeleton div
   - `inform`: renders DISABLED (not hidden) textarea + submit button + inline sign-in prompt
   - `connected_no_compass`: renders children (calibration is NOT a write gate)
   - `connected`: renders children
   - `SuspendedNotice`: standalone inline suspension message (no redirect, no modal, reason not exposed)

## Commits

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | AuthContext with token lifecycle | 1979d6e | frontend-src/tsconfig.json, frontend-src/context/AuthContext.tsx |
| 2 | apiFetch wrapper and AuthGate component | d5e49cf | frontend-src/lib/apiFetch.ts, frontend-src/components/AuthGate.tsx |

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| `window.history.replaceState` for hash cleanup | `window.location.hash = ''` adds a browser history entry; replaceState does not |
| `window.open(..., '_blank')` for 401 in apiFetch | Preserves current tab and any unsaved draft the user was composing |
| `connected_no_compass` passes through AuthGate | Compass calibration status is orthogonal to write permission |
| `SuspendedNotice` is separate from `AuthGate` | Suspension is a runtime API concern (403 response), not an identity-tier concern |

## Deviations from Plan

None — plan executed exactly as written.

## Verification Results

| Check | Result |
|-------|--------|
| All 4 files exist | PASS |
| `window.history.replaceState` in AuthContext | PASS (line 92) |
| No `window.location.hash = ''` in AuthContext | PASS |
| `window.open` in apiFetch for 401 | PASS (line 46) |
| No `window.location.href =` in apiFetch | PASS |
| `disabled` form in AuthGate inform state | PASS |
| `connected_no_compass` renders children | PASS |
| `SuspendedNotice` component exists | PASS |
| No `legal_name` or `tolerance_rating` | PASS |

## Next Phase Readiness

These primitives are ready for Phase 5 Framer component integration:

- Import `AuthProvider` and wrap the Framer app root
- Use `useAuth()` to read auth state and trigger sign-in
- Wrap write forms with `<AuthGate action="reply">` etc.
- Use `apiFetch<T>` for all Express API calls
- Display `<SuspendedNotice />` when `apiFetch` returns `403` with `reason === 'suspended'`

No blockers for Phase 3 or Phase 4. The Framer+Express auth token flow (flagged in STATE.md) still needs verification before Phase 5 planning.
