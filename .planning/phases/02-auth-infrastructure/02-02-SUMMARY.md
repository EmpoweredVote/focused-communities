---
phase: 02-auth-infrastructure
plan: 02
subsystem: testing
tags: [vitest, supertest, jose, jwt, express, middleware, mocking]

# Dependency graph
requires:
  - phase: 02-auth-infrastructure/02-01
    provides: requireAuth, optionalAuth, requireConnected middleware, JWKS singleton
provides:
  - vitest test runner configured with node environment
  - auth middleware test suite (8 tests covering all 401/200 scenarios)
  - tier guard test suite (6 tests covering all 403/next() scenarios)
  - global fetch mock pattern for JWKS + accounts API interception
affects: [future middleware, 03-communities-api, 04-posts-api]

# Tech tracking
tech-stack:
  added: [vitest, @vitest/coverage-v8, supertest, @types/supertest]
  patterns:
    - vi.stubGlobal fetch mock intercepts JWKS lazy-load and accounts API in same handler
    - Real ES256 keypair via jose generateKeyPair for authentic JWT signing in tests
    - Minimal Express app-per-test via makeApp() for isolated middleware integration tests
    - Pure unit test pattern for sync guards (no network, no Express overhead)

key-files:
  created:
    - vitest.config.ts
    - src/middleware/__tests__/auth.test.ts
    - src/middleware/__tests__/tierGuards.test.ts
  modified:
    - package.json

key-decisions:
  - "Mock global.fetch (not msw or nock) — intercepts both JWKS lazy-load and accounts API with one stub"
  - "Real jose keypair for test JWT signing — no hardcoded token strings"
  - "afterEach vi.unstubAllGlobals() ensures test isolation between mock-fetch tests"
  - "Pure makeMocks() for tierGuards (no supertest) — sync guard needs no HTTP stack"

patterns-established:
  - "Auth integration tests: makeApp(middleware) + supertest + mockFetchWith()"
  - "JWKS mock: intercept URLs containing .well-known/jwks.json or supabase.co"
  - "Accounts API mock: intercept URLs containing account/me"

# Metrics
duration: 5min
completed: 2026-04-15
---

# Phase 2 Plan 02: Auth Middleware Test Suite Summary

**Vitest test suite proving all auth middleware behaviors using real ES256 keypairs, global fetch mocking for JWKS interception, and supertest for integration-style Express testing**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-04-15T23:20:00Z
- **Completed:** 2026-04-15T23:25:00Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Configured vitest with node environment, 15s timeout, and test/test:watch npm scripts
- Built auth.test.ts with 8 tests covering every requireAuth and optionalAuth scenario
- Built tierGuards.test.ts with 6 tests covering every requireConnected branch
- Established global fetch mock pattern that intercepts JWKS lazy-load and accounts API simultaneously — all 15 tests pass with exit code 0

## Task Commits

Each task was committed atomically:

1. **Task 1: Install test dependencies and configure vitest** - `e1b77ba` (chore)
2. **Task 2: Write auth middleware and tier guard test suites** - `5a377b9` (test)

**Plan metadata:** _(pending docs commit)_

## Files Created/Modified
- `vitest.config.ts` - Vitest config: node environment, 15s timeout, src/**/*.test.ts include
- `package.json` - Added test and test:watch scripts; vitest/supertest in devDependencies
- `src/middleware/__tests__/auth.test.ts` - 8 integration tests for requireAuth + optionalAuth
- `src/middleware/__tests__/tierGuards.test.ts` - 6 unit tests for requireConnected

## Decisions Made

- **Mock fetch globally, not per-module**: `vi.stubGlobal('fetch', ...)` is called before each test that needs network mocking. This works because `createRemoteJWKSet` fetches JWKS keys lazily (on first `jwtVerify` call), so the mock is in place before keys are ever retrieved.
- **Single fetch stub handles both endpoints**: The mock inspects the URL string — `.well-known/jwks.json` / `supabase.co` routes to JWKS response; `account/me` routes to configurable accounts response. This avoids needing two separate mocks.
- **Real ES256 keypair generated in `beforeAll`**: Uses jose's `generateKeyPair('ES256')` — no hardcoded JWT strings. Tests will catch real signature validation failures.
- **`afterEach(() => vi.unstubAllGlobals())`**: Prevents fetch mock leaking between tests that don't need it (e.g., no-header tests should hit real path, not a stale mock).
- **Pure makeMocks() for tierGuards**: Since `requireConnected` is synchronous and has no network calls, no Express app or supertest is needed — direct function call with mock req/res/next is simpler and faster.

## Deviations from Plan

None - plan executed exactly as written. The recommended mock strategy (vi.stubGlobal fetch) worked correctly on first attempt.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All auth middleware is fully tested and verified correct
- 02-02 completes Phase 2 (all three plans: 02-01, 02-02, 02-03 done)
- Phase 3 (Communities API) can begin — requireAuth and requireConnected are proven correct

---
*Phase: 02-auth-infrastructure*
*Completed: 2026-04-15*
