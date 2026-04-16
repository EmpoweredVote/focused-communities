---
phase: 02-auth-infrastructure
plan: 01
subsystem: auth
tags: [jose, jwt, jwks, express, middleware, typescript, esm]
requires:
  - phase: 01-foundation-schema
    provides: Express app scaffold, TypeScript config, package.json
provides:
  - JWKS singleton for ES256 JWT verification
  - requireAuth middleware (JWT + accounts API dual-check)
  - optionalAuth middleware (silently passes through on failure)
  - requireConnected tier/standing guard
  - Express Request.user type augmentation
affects: [02-02, 03-read-api, 04-write-api]
tech-stack:
  added: [jose@6.2.2]
  patterns: [module-level JWKS singleton, dual-check auth (JWKS + accounts API), ESM module type]
key-files:
  created: [src/lib/jwks.ts, src/types/express.d.ts, src/middleware/auth.ts, src/middleware/tierGuards.ts]
  modified: [package.json]
key-decisions:
  - "JWKS singleton at module level, not per-request"
  - "Accounts API called on every write (not just JWT verification) for session revocation"
  - "connected_no_compass users pass requireConnected (calibration is not a write gate)"
  - "Added type:module to package.json — required for jose ESM-only package; entire codebase already uses ESM import syntax with .js extensions"
patterns-established:
  - "Module-level JWKS singleton pattern in src/lib/jwks.ts"
  - "Dual auth check: jwtVerify + accounts API fetch"
  - "Internal verifyToken helper shared between requireAuth and optionalAuth"
duration: 4min
completed: 2026-04-15
---

# Plan 02-01: Backend Auth Middleware Summary

**JWT middleware stack with JWKS singleton and dual-check enforcement (cryptographic verification + accounts API session revocation) using jose@6.2.2.**

## Performance
- **Duration:** ~4 min
- **Tasks:** 2
- **Files modified:** 5 (4 created, 1 modified)

## Accomplishments
- Installed jose@6.2.2 and created module-level JWKS singleton with configurable URL and 10-min cache
- Created Express Request.user type augmentation via global declaration merging
- Implemented requireAuth with both JWKS verification and accounts API session check (both required for writes)
- Implemented optionalAuth that silently swallows all failures without sending a response
- Implemented requireConnected with distinct tier (403) and suspended (403) rejection codes
- Confirmed connected_no_compass users (completed_onboarding: false) pass requireConnected

## Task Commits
1. **Task 1: Install jose and create JWKS singleton + Express type augmentation** - `f17d569` (feat)
2. **Task 2: Create requireAuth, optionalAuth, and requireConnected middleware** - `a6cd864` (feat)
**Plan metadata:** `[hash]` (docs)

## Files Created/Modified
- `src/lib/jwks.ts` - Module-level JWKS singleton using createRemoteJWKSet; URL configurable via JWKS_URL env var
- `src/types/express.d.ts` - Express Request.user type augmentation via global namespace merging
- `src/middleware/auth.ts` - AccountUser interface, requireAuth (dual-check), optionalAuth (silent passthrough)
- `src/middleware/tierGuards.ts` - requireConnected guard checking tier and standing; no onboarding gate
- `package.json` - Added jose dependency and "type": "module" field

## Decisions Made
- **JWKS singleton at module level:** Created once per process at import time, shared across all requests. Never instantiated inside request handlers.
- **Accounts API on every request:** requireAuth calls `/api/account/me` on every authenticated request (not just JWT verification) to support session revocation.
- **optionalAuth internal helper:** Both requireAuth and optionalAuth share a private `verifyToken()` helper that returns AccountUser|null, keeping the optional path clean.
- **No onboarding gate:** requireConnected has no check on completed_onboarding — connected_no_compass users (tier=connected, completed_onboarding=false) are write-eligible.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added "type": "module" to package.json**

- **Found during:** Task 2 TypeScript compilation
- **Issue:** jose is ESM-only. With `module: Node16` in tsconfig.json and no `"type": "module"` in package.json, TypeScript inferred CJS mode and rejected the jose import with TS1479.
- **Fix:** Added `"type": "module"` to package.json. This was clearly correct — all existing source files already used ESM import syntax with `.js` extensions (the Node16 ESM pattern), confirming ESM was always the intended module format.
- **Files modified:** package.json
- **Commit:** a6cd864

## Issues Encountered
None beyond the ESM type field deviation above.

## Next Phase Readiness
- Backend auth middleware ready for test suite (02-02)
- requireConnected ready for write routes (Phase 4)
- JWKS URL and accounts API URL are both env-var configurable for test overrides

---
*Phase: 02-auth-infrastructure*
*Completed: 2026-04-15*
