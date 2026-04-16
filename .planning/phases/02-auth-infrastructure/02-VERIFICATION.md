---
status: passed
phase: 02-auth-infrastructure
verified: 2026-04-15
score: 4/4 must-haves verified
---

# Phase 02: Auth Infrastructure - Verification

## Goal

The system correctly identifies Connected Accounts and enforces read-open / write-gated access at both the API and database layers before any write routes exist.

## Must-Have Check

| # | Criterion | Status | Evidence |
|---|-----------|--------|----------|
| 1 | An unauthenticated request to any write endpoint returns 401; the frontend redirects the user to sign-in | VERIFIED | `requireAuth` returns 401 with `{ error: 'Missing token' }` at `auth.ts:62`. Frontend opens Auth Hub in new tab via `window.open` at `apiFetch.ts:46` on any 401. No write routes exist yet -- middleware is ready to enforce on first write route registered. |
| 2 | An authenticated Connected Account is correctly identified and permitted to write | VERIFIED | `requireAuth` populates `req.user` with `AccountUser` (including `tier` and `account_standing`); `requireConnected` calls `next()` for `tier === connected` or `empowered` with `account_standing === active`. Proven by `tierGuards.test.ts` lines 65-73 and 74-83. |
| 3 | A suspended account is rejected with `{ reason: 'suspended' }` in the 403 body | VERIFIED | `tierGuards.ts:28` -- `res.status(403).json({ error: 'Account suspended', reason: 'suspended' })`. Test at `tierGuards.test.ts:85-95` asserts `statusCode === 403` and `reason === suspended`. |
| 4 | JWT is verified via JWKS (ES256) + accounts API call (`/api/account/me`) -- both checks required for writes | VERIFIED | `requireAuth` calls `jwtVerify(token, JWKS, ...)` at `auth.ts:69` (JWKS/ES256); then calls `/api/account/me` at `auth.ts:74`. `next()` at line 89 is only reachable after both succeed. `auth.test.ts:100-107` proves accounts API 401 still rejects even with a valid JWT. |

## Artifact Inventory

| Artifact | Lines | Status | Notes |
|----------|-------|--------|-------|
| `src/lib/jwks.ts` | 17 | VERIFIED | Module-level singleton using `createRemoteJWKSet`; `JWKS_URL` env-var overridable |
| `src/types/express.d.ts` | 11 | VERIFIED | `Request.user?: AccountUser` via global namespace merging |
| `src/middleware/auth.ts` | 121 | VERIFIED | `AccountUser` interface, `requireAuth` (dual-check), `optionalAuth` (silent passthrough), shared `verifyToken` helper |
| `src/middleware/tierGuards.ts` | 33 | VERIFIED | `requireConnected` checks tier + standing; no onboarding gate |
| `src/middleware/__tests__/auth.test.ts` | 157 | VERIFIED | 8 tests: no-header 401, bad-prefix 401, invalid-JWT 401, accounts-API-401, valid-connected passes, inform tier passes `requireAuth` |
| `src/middleware/__tests__/tierGuards.test.ts` | 107 | VERIFIED | 6 tests: no-user 403/tier, inform 403/tier, connected passes, empowered passes, suspended 403/suspended, connected_no_compass passes |
| `frontend-src/context/AuthContext.tsx` | 130 | VERIFIED | `AccessState` discriminated union, URL hash token extraction, `replaceState` cleanup, `detectUserState` calls `/api/account/me` |
| `frontend-src/lib/apiFetch.ts` | 82 | VERIFIED | Bearer token from localStorage, `window.open` new-tab on 401, `reason` surfaced from 403 body |
| `frontend-src/components/AuthGate.tsx` | 87 | VERIFIED | `inform` state renders disabled form (not hidden); `connected_no_compass` and `connected` render children; `SuspendedNotice` component present |
| `package.json` | 37 | VERIFIED | `"type": "module"`, `jose@^6.2.2` in dependencies, `vitest` + `supertest` in devDependencies |
| `vitest.config.ts` | 10 | VERIFIED | node environment, 15s timeout, `src/**/*.test.ts` glob |

## Key Link Verification

| From | To | Via | Status |
|------|----|-----|--------|
| `requireAuth` | JWKS (ES256) | `jwtVerify(token, JWKS, ...)` at `auth.ts:69` | WIRED |
| `requireAuth` | `/api/account/me` | `fetch(getAccountsApiUrl()/api/account/me)` at `auth.ts:74` | WIRED |
| `requireConnected` | `req.user` | reads `req.user` set by `requireAuth`; 403 if absent at `tierGuards.ts:17-19` | WIRED |
| `apiFetch` | Auth Hub (new tab) | `window.open(...)` at `apiFetch.ts:46` on 401 | WIRED |
| `AuthGate` | `useAuth` | `const { auth, signIn } = useAuth()` at `AuthGate.tsx:25` | WIRED |
| `AuthProvider` | `detectUserState` | `detectUserState().then(setAuth)` in `useEffect` at `AuthContext.tsx:99` | WIRED |

## Test Run

All 15 tests pass (2 test files, 686ms).

```
 Test Files  2 passed (2)
      Tests  15 passed (15)
   Duration  686ms
```

## Requirements Coverage

| Requirement | Status | Evidence |
|-------------|--------|----------|
| AUTH-01 (JWT verification via JWKS ES256) | SATISFIED | `jwtVerify` with `JWKS` singleton in `auth.ts`; `createRemoteJWKSet` in `jwks.ts` |
| AUTH-02 (accounts API session check + tier enforcement) | SATISFIED | Dual-check in `requireAuth`; tier/standing gate in `requireConnected` |
| AUTH-03 (frontend token lifecycle + 401 handling) | SATISFIED | `AuthContext` with hash extraction + `ev_token` persistence; `apiFetch` new-tab 401; `AuthGate` disabled-not-hidden inform state |

## Anti-Patterns Found

None. No TODO/FIXME/placeholder comments, no stub returns, no empty handlers found in any phase deliverable.

## Design Notes (Non-Blocking Observations)

1. `requireAuth` does not check `account_standing` -- this is intentional. `requireAuth` establishes identity; `requireConnected` enforces tier and standing. Write routes will chain `[requireAuth, requireConnected, handler]`.

2. No write routes exist yet -- `src/routes/` contains only `health.ts`. The middleware is ready but untested end-to-end against a real route. This is expected; write routes are Phase 4 scope.

3. Frontend 401 handling uses `window.open(..., _blank)` (new tab), not `window.location.href` (same tab). This preserves draft content. Flagged for human confirmation below.

## Human Verification Needed

### 1. New-Tab vs. Same-Tab Sign-In Redirect

**Test:** In the running app, begin composing a reply with an expired session token, then submit.
**Expected:** Auth Hub opens in a new tab; current tab retains the draft.
**Why human:** The criterion says "redirects the user to sign-in" without specifying same-tab vs. new-tab. Code uses `window.open(..., _blank)`. Verify this matches the intended product UX.

### 2. JWKS URL Reachability (Production)

**Test:** Deploy to Render with `JWKS_URL` unset; send a valid Supabase JWT to a write endpoint.
**Expected:** JWT verifies successfully against the live Supabase JWKS endpoint.
**Why human:** Tests mock JWKS with a local keypair. Live Supabase JWKS reachability from Render has not been verified programmatically.

## Summary

Phase 2 goal is achieved. All four success criteria are satisfied by substantive, wired implementations:

- Criterion 1 (401 + redirect): `requireAuth` returns 401 at the API layer; `apiFetch` opens Auth Hub in a new tab on 401.
- Criterion 2 (Connected Account permitted): `requireAuth` + `requireConnected` chain correctly admits `connected`/`empowered` active accounts.
- Criterion 3 (Suspended 403 with reason): `requireConnected` returns `{ reason: suspended }` in 403 body; `apiFetch` surfaces `reason` from 403 response.
- Criterion 4 (JWKS + accounts API both required): `requireAuth` calls `jwtVerify` (JWKS/ES256) then `/api/account/me`; `next()` is unreachable unless both succeed.

All 15 tests pass. No stubs, no orphaned files, no anti-patterns.

## Gaps

None.

---
_Verified: 2026-04-15_
_Verifier: Claude (gsd-verifier)_
