---
phase: 04-write-api
plan: 03
subsystem: testing
tags: [vitest, supertest, jose, express, integration-tests, fetch-mock, url-routing-mock]

# Dependency graph
requires:
  - phase: 04-write-api/04-01
    provides: POST /api/communities/:id/threads, POST /api/threads/:id/posts, postRateLimiter
  - phase: 04-write-api/04-02
    provides: PATCH /api/threads/:id, PATCH /api/posts/:id, DELETE 405 routes, edit history GET endpoints, isEdited on reads
  - phase: 02-auth
    provides: requireAuth + requireConnected middleware pattern, jose ES256 test key pattern

provides:
  - Integration test suite covering all 10 Phase 4 write endpoint groups (30 tests)
  - URL-routing fetch mock pattern for authenticated endpoints (JWKS + accounts API + DB queue)
  - vi.mock hoisting pattern for rate limiter control per test

affects:
  - 05-frontend (verified API contracts — shapes and status codes frontend can rely on)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "URL-routing fetch mock: routes JWKS/accounts/DB by URL substring matching"
    - "vi.mock top-level hoisting for rate limiter — declared before createApp() call"
    - "beforeAll keypair generation + validToken — reused across all auth tests"
    - "Unique resource IDs per test — prevents in-memory cache hits between tests"
    - "mockRoutedFetch for auth endpoints; mockFetch (sequential) for unauthenticated reads"

key-files:
  created:
    - src/routes/__tests__/write-api.test.ts
  modified: []

key-decisions:
  - "URL-routing mock checks supabase.co without /rest/ to identify JWKS vs DB calls"
  - "JWKS cached by jose after first test — subsequent tests skip JWKS fetch transparently"
  - "Non-author test (3d) signs token with different sub; JWT sub overrides accounts API id"
  - "Rate limiter mock via vi.mock (not env var) — covers both dev stub and real Upstash paths"
  - "DELETE tests (5a, 6a) need no fetch mock — 405 handler returns before any middleware"

patterns-established:
  - "mockRoutedFetch pattern: URL-routing for authenticated write endpoint tests"
  - "Rate limiter test control: mockLimit.mockResolvedValueOnce per test, reset in afterEach"

# Metrics
duration: ~5min
completed: 2026-04-16
---

# Phase 4 Plan 03: Write API Integration Tests Summary

**30-test suite covering all Phase 4 write endpoints using URL-routing fetch mock for JWKS + accounts API + DB call interception**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-04-16T16:49:41Z
- **Completed:** 2026-04-16T16:54:00Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments

- 30 integration tests across 10 describe blocks — all passing alongside 30 existing read tests (60 total)
- URL-routing fetch mock pattern handles jose JWKS lazy-load, accounts API, and sequential Supabase DB calls in one stub
- Rate limiter fully controlled per-test via vi.mock hoisting (RATE_LIMIT_OK / RATE_LIMIT_BLOCKED constants)
- Coverage: 201/200 happy paths, 422 field-level validation, 401 unauthenticated, 403 suspended, 429 rate-limited with Retry-After, 404 not-found and non-author, 405 DELETE rejection, edit history arrays, isEdited indicator on reads
- TypeScript passes clean (npx tsc --noEmit)

## Task Commits

1. **Task 1: Create write-api.test.ts — 10 endpoint groups, 30 tests** - `dd77667` (test)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `src/routes/__tests__/write-api.test.ts` — 30 integration tests covering all Phase 4 write API contracts

## Decisions Made

- URL-routing mock checks `supabase.co && !includes('/rest/')` to distinguish JWKS fetch from Supabase DB calls — DB calls go through postgrest-js which uses `/rest/v1/` in the path
- JWKS fetched once by jose (cached in module); subsequent tests skip the JWKS fetch — mock handles both cases transparently
- Non-author test uses `signToken('user-uuid-2')` — JWT sub overrides accounts API id field per requireAuth implementation
- `validToken` generated once in `beforeAll`, reused across all authenticated tests
- DELETE tests need no fetch mock — 405 handler fires before requireAuth touches fetch

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None.

## Next Phase Readiness

- Phase 4 Write API complete — all 3 plans done
- 60 tests passing (15 middleware + 15 read routes + 30 write routes)
- All write API contracts locked down (shapes, status codes, error envelopes)
- Ready for Phase 5: Frontend (Framer + React components consuming these APIs)
- Blocker to address pre-Phase 5: research how Framer production frontend passes Supabase JWT to Express write endpoints

---
*Phase: 04-write-api*
*Completed: 2026-04-16*
