---
phase: 03-read-api-cache
plan: 01
subsystem: api
tags: [express, redis, supabase, migrations, postgres, typescript, cursor-pagination, cache]

# Dependency graph
requires:
  - phase: 02-auth-infrastructure
    provides: requireAuth/optionalAuth middleware, tier guards, redis cacheGet/cacheSet
  - phase: 01-foundation-schema
    provides: connect.* schema tables (communities, threads, posts), inform.compass_stances
provides:
  - Schema migration closing all Phase 3 column gaps (slice_label, last_activity_at, supporting_points)
  - connect.get_stances_for_community RPC function (cross-schema SECURITY DEFINER join)
  - cacheMiddleware factory with TTL constants (COMMUNITIES/STANCES/THREAD_LIST/THREAD_DETAIL)
  - Shared utils: encodeCursor, decodeCursor, generateExcerpt, parseLimit
  - Route stubs: communitiesRouter, stancesRouter, threadsRouter, postsRouter
  - app.ts wiring with global error handler last
affects:
  - 03-02-communities-stances (uses cacheMiddleware, TTL, communitiesRouter, stancesRouter)
  - 03-03-threads (uses cacheMiddleware, TTL, threadsRouter, encodeCursor, decodeCursor)
  - 03-04-posts (uses cacheMiddleware, TTL, postsRouter, generateExcerpt, parseLimit)

# Tech tracking
tech-stack:
  added: [remove-markdown@0.6.3]
  patterns:
    - Cache middleware factory pattern (cacheMiddleware(ttl) returns Express middleware)
    - Cache key includes req.path + JSON.stringify(req.query) to prevent route collisions
    - Fire-and-forget cacheSet (write failures never block response)
    - SECURITY DEFINER RPC in connect schema for cross-schema inform.* reads
    - base64url cursor encoding with compact keys (t, id) for pagination

key-files:
  created:
    - supabase/migrations/20260416074245_phase3_schema_gaps.sql
    - src/middleware/cache.ts
    - src/lib/utils.ts
    - src/routes/communities.ts
    - src/routes/stances.ts
    - src/routes/threads.ts
    - src/routes/posts.ts
  modified:
    - src/app.ts
    - src/middleware/__tests__/auth.test.ts
    - package.json
    - package-lock.json

key-decisions:
  - "inform.compass_stances uses column 'value' (integer) not 'position' — aliased as position in RPC RETURNS TABLE"
  - "RPC function lives in connect schema (not inform) so SECURITY DEFINER allows anon role to read inform.*"
  - "Cache key includes req.path (not just query) to prevent /communities and /threads having same key with empty query"
  - "jose v6 removed KeyLike type — test file updated to use CryptoKey (native Web Crypto API type)"

patterns-established:
  - "Cache middleware pattern: cacheMiddleware(TTL.X) composed inline in route definition"
  - "Cursor pagination: base64url-encoded JSON {t, id} for keyset pagination across all list endpoints"
  - "Excerpt generation: strip markdown → collapse whitespace → truncate at word boundary → Unicode ellipsis"
  - "Route stubs first: all routers mounted in app.ts before handlers exist, enabling parallel plan execution"

# Metrics
duration: ~15min
completed: 2026-04-16
---

# Phase 3 Plan 01: Read API Foundation Summary

**Schema migration closing connect.* column gaps + cross-schema RPC function + cache middleware factory + shared cursor/excerpt utilities wired into Express app**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-04-16T07:00:00Z (continuation from previous checkpoint)
- **Completed:** 2026-04-16T07:10:00Z
- **Tasks:** 2 (Task 1 completion + Task 2 full)
- **Files modified:** 11

## Accomplishments

- Completed the schema migration: connect.communities.slice_label, connect.threads.last_activity_at, inform.compass_stances.supporting_points, and connect.get_stances_for_community RPC function (SECURITY DEFINER, cross-schema join)
- Cache middleware factory with four TTL constants usable by all Phase 3 route plans
- Shared utilities covering cursor pagination (base64url keyset), excerpt generation (markdown-stripped, word-boundary truncated), and query param limit parsing
- All four route stubs created and mounted in app.ts with global error handler registered last

## Task Commits

Each task was committed atomically:

1. **Task 1 (partial, prior agent): Schema migration connect.* only** - `0ee4435` (chore)
2. **Task 1 completion: inform.compass_stances + RPC function** - `0778660` (feat)
3. **Task 2: cache middleware + utils + routes + app.ts** - `9166f38` (feat)

## Files Created/Modified

- `supabase/migrations/20260416074245_phase3_schema_gaps.sql` - Full migration: slice_label, last_activity_at, supporting_points, get_stances_for_community RPC
- `src/middleware/cache.ts` - cacheMiddleware factory + TTL constants
- `src/lib/utils.ts` - encodeCursor, decodeCursor, generateExcerpt, parseLimit
- `src/routes/communities.ts` - communitiesRouter stub
- `src/routes/stances.ts` - stancesRouter stub
- `src/routes/threads.ts` - threadsRouter stub
- `src/routes/posts.ts` - postsRouter stub
- `src/app.ts` - All 4 routers mounted + global error handler
- `src/middleware/__tests__/auth.test.ts` - Fixed jose v6 KeyLike → CryptoKey
- `package.json` / `package-lock.json` - remove-markdown added

## Decisions Made

- `inform.compass_stances.value` (integer) is the position column — aliased as `position` in the RPC RETURNS TABLE contract. Callers see `position` regardless of underlying column name.
- RPC function placed in `connect` schema with `SECURITY DEFINER` so the `anon` role can execute cross-schema reads on `inform.*` without direct grants on the inform schema.
- Cache key format `fc:{req.path}:{JSON.stringify(req.query)}` prevents key collisions between routes that share identical query strings.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed jose v6 KeyLike type removal in auth.test.ts**
- **Found during:** Task 2 verification (npx tsc --noEmit)
- **Issue:** auth.test.ts imported `type KeyLike` from jose, but jose v6 removed this type in favor of native `CryptoKey`. Caused TS2305 error.
- **Fix:** Removed `type KeyLike` from jose import; replaced `let privateKey: KeyLike` with `let privateKey: CryptoKey`
- **Files modified:** `src/middleware/__tests__/auth.test.ts`
- **Verification:** `npx tsc --noEmit` passes with zero errors; `npm test` passes 15/15
- **Committed in:** `9166f38` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Essential correctness fix — TypeScript compilation would have failed without it. No scope creep.

## Issues Encountered

None beyond the jose v6 type fix documented above.

## User Setup Required

None - no external service configuration required. The migration SQL file is ready for deployment via Supabase CLI (`supabase db push`) when the team is ready.

## Next Phase Readiness

- Plans 03-02 (communities + stances), 03-03 (threads), 03-04 (posts) can all proceed independently — router stubs are mounted and middleware is importable
- Schema migration must be applied to the live database before stances endpoint works (connect.get_stances_for_community must exist)
- All TypeScript types pass; existing 15 auth tests still pass — no regressions

---
*Phase: 03-read-api-cache*
*Completed: 2026-04-16*
