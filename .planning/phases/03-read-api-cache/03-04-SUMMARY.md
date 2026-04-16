---
phase: 03-read-api-cache
plan: "04"
subsystem: api
tags: [express, supabase, typescript, vitest, supertest, cache, integration-tests]

# Dependency graph
requires:
  - phase: 03-01
    provides: cache middleware (cacheMiddleware, TTL constants), supabase client
  - phase: 03-02
    provides: communities and community-detail endpoints, response envelope patterns (list/single)
  - phase: 03-03
    provides: stances RPC endpoint, threads cursor-paginated endpoint, correct supabase schema chaining
provides:
  - GET /api/threads/:id — thread detail with full markdown body, 404 for hidden threads
  - GET /api/threads/:id/posts — flat chronological reply list, 404 for hidden threads
  - 15 vitest integration tests covering all 6 Phase 3 read endpoints
  - vitest.config.ts env stubs for test-environment Supabase initialization
affects: [04-write-api, 05-framer-frontend, 06-deploy]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Integration tests mock supabase-js via vi.stubGlobal('fetch'); supabase uses res.text() not res.json()"
    - "Unique resource IDs per test prevent in-memory cache hits between tests"
    - "vitest.config.ts env field satisfies module-level env var checks without real credentials"

key-files:
  created:
    - src/routes/posts.ts
    - src/routes/__tests__/read-api.test.ts
  modified:
    - vitest.config.ts

key-decisions:
  - "In-memory cache persists between test runs (module-level Map); use unique IDs per test, not shared fixture IDs"
  - "supabase-js uses res.text() (not res.json()); fetch mock must return objects with .text() returning JSON string"
  - "vitest env field (not .env.test) is the correct way to set env vars at test startup before module evaluation"
  - "Hidden thread returns 404 not 403 — avoids revealing existence of moderated content"
  - "Posts list: no cursor/meta envelope (flat list v1), default limit 50"

patterns-established:
  - "Test isolation pattern: unique UUID-style IDs per test prevent cache collisions in integration tests"
  - "supabase fetch mock pattern: makeResponse() returns {text, json, headers.get, ok, status}"

# Metrics
duration: 8min
completed: 2026-04-16
---

# Phase 3 Plan 04: Thread Detail and Integration Tests Summary

**Thread detail (full markdown body) and flat posts list endpoints complete, plus 15 vitest integration tests covering all 6 Phase 3 read endpoints with supabase-js fetch mock pattern**

## Performance

- **Duration:** 8 min
- **Started:** 2026-04-16T14:15:44Z
- **Completed:** 2026-04-16T14:23:33Z
- **Tasks:** 3 (2 implementation + 1 verification)
- **Files modified:** 3

## Accomplishments
- Implemented `GET /api/threads/:id` returning full markdown body (never excerpt), 404 for hidden threads
- Implemented `GET /api/threads/:id/posts` with thread visibility pre-check, flat chronological list, default limit 50
- Created 15 integration tests covering all 6 Phase 3 read endpoints with correct supabase-js mock pattern
- Established the vitest.config.ts env stub pattern so Supabase module initializes cleanly in test environment

## Task Commits

Each task was committed atomically:

1. **Task 1: Implement GET /api/threads/:id and GET /api/threads/:id/posts** - `f166e2d` (feat)
2. **Task 2: Create vitest integration tests for all 6 Phase 3 read endpoints** - `7ab1c0e` (test)
3. **Task 3: End-to-end verification** - (no commit — verification only, no new files)

**Plan metadata:** (docs: complete plan — see below)

## Files Created/Modified
- `src/routes/posts.ts` — Thread detail and flat posts list endpoints, both cached at TTL.THREAD_DETAIL (30s)
- `src/routes/__tests__/read-api.test.ts` — 15 integration tests for all 6 Phase 3 read endpoints
- `vitest.config.ts` — Added env stubs for SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY

## Decisions Made

- **supabase-js fetch mock uses `.text()` not `.json()`**: postgrest-js calls `res.text()` then JSON.parses the result. The mock response object must provide `text: async () => JSON.stringify(body)`, not just `json: async () => body`. Tests initially written with `json` only; corrected after reading postgrest-js source.

- **Unique IDs per test to avoid cache collisions**: The in-memory Redis fallback (active when UPSTASH env vars absent) uses a module-level `Map` that persists across tests. Tests that share the same path (`/api/threads/t1`) hit each other's cached responses. Fixed by giving each test a unique resource ID (e.g., `thread-hidden-1`, `thread-detail-1`).

- **vitest `env` field, not `.env.test`**: Setting env vars via `vitest.config.ts` `test.env` field ensures they are present before module-level code runs (Supabase client init). A `.env.test` file would also work but the config approach is self-documenting.

- **Hidden content: 404 not 403**: Thread detail endpoint returns 404 for `moderation_status !== 'visible'` to avoid revealing existence of hidden threads. Same pattern applied to posts list thread pre-check.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] vitest.config.ts env stubs needed for test environment**
- **Found during:** Task 2 (integration test creation)
- **Issue:** `createApp()` import triggers `src/lib/supabase.ts` module-level evaluation which throws `Missing required environment variable: SUPABASE_URL` — tests couldn't even load
- **Fix:** Added `test.env` to vitest.config.ts with dummy SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY values; all actual network calls are intercepted by vi.stubGlobal('fetch')
- **Files modified:** vitest.config.ts
- **Verification:** Tests load and pass; fetch mock intercepts supabase calls
- **Committed in:** 7ab1c0e (Task 2 commit)

**2. [Rule 1 - Bug] Test mock used json() but supabase-js needs text()**
- **Found during:** Task 2 — initial test run showed stances/hidden-thread tests failing
- **Issue:** The plan's suggested mock used `json: async () => r.body`; postgrest-js calls `res.text()` then parses, so the mock returned `undefined` from `text()`
- **Fix:** Created `makeResponse()` helper returning `{ text: async () => JSON.stringify(body), json: async () => body, headers: { get: () => null }, ok, status, statusText }`
- **Files modified:** src/routes/__tests__/read-api.test.ts
- **Verification:** All 15 new tests pass
- **Committed in:** 7ab1c0e (Task 2 commit)

**3. [Rule 1 - Bug] In-memory cache caused test interference**
- **Found during:** Task 2 — stances "with data" test returned empty array; hidden-thread test returned 200
- **Issue:** In-memory fallback Map persists across tests; first test caches a response, second test for same path hits cache
- **Fix:** Used unique resource IDs per test (e.g., `comm-stances-data`, `thread-hidden-1`) instead of shared fixture IDs
- **Files modified:** src/routes/__tests__/read-api.test.ts
- **Verification:** All 30 tests pass including second/third tests per endpoint
- **Committed in:** 7ab1c0e (Task 2 commit)

---

**Total deviations:** 3 auto-fixed (3 bugs discovered during integration test creation)
**Impact on plan:** All three bugs were discovered and fixed within Task 2. No scope creep. The mock pattern corrections and cache isolation pattern are now established for future test additions.

## Issues Encountered
- Initial mock pattern from plan spec used `json()` method which supabase-js doesn't call — caught immediately on first test run, diagnosed by reading postgrest-js source code, fixed in same task.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All 6 Phase 3 read endpoints complete and tested
- Phase 3 (Read API + Cache) is fully complete
- Phase 4 (Write API) can begin immediately
- Key patterns for Phase 4 testing: use makeResponse() mock pattern from read-api.test.ts; use unique IDs per test to avoid cache collisions
- No blockers

---
*Phase: 03-read-api-cache*
*Completed: 2026-04-16*
