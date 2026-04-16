---
phase: 03-read-api-cache
plan: 03
subsystem: api
tags: [express, supabase, rpc, cursor-pagination, caching, redis, typescript]

# Dependency graph
requires:
  - phase: 03-01
    provides: cache middleware (TTL constants), shared utils (encodeCursor, decodeCursor, generateExcerpt, parseLimit), route stubs, supabase client
  - phase: 01-02
    provides: connect.threads and connect.communities tables, moderation_status enum, connect.get_stances_for_community RPC function
affects:
  - 03-04 (thread detail endpoint builds on same routing pattern)
  - phase-5 (Framer frontend calls these endpoints for Inform/Connect views)

provides:
  - GET /api/communities/:id/stances — cross-schema RPC join returning stance cards in position order
  - GET /api/communities/:id/threads — cursor-paginated thread list with markdown-stripped excerpts

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Cross-schema RPC via supabase.schema('connect').rpc() for SECURITY DEFINER functions"
    - "Two-column keyset cursor (sortColumn, id) for gap-free pagination on timestamp ties"
    - "Fetch limit+1 pattern to determine hasMore without a separate COUNT query"
    - "Sort column aliasing: active=last_activity_at, newest=created_at with unknown values falling back to active"
    - "Body fetched for excerpt generation but excluded from API response"

key-files:
  created: []
  modified:
    - src/routes/stances.ts
    - src/routes/threads.ts

key-decisions:
  - "supabase.schema('connect').rpc() not supabase.rpc(..., { schema: 'connect' }) — the latter is not a valid option in @supabase/supabase-js v2"
  - "sort=active (default) maps to last_activity_at DESC; sort=newest maps to created_at DESC; all other values fall back to active silently"
  - "Two-column cursor prevents pagination gaps when two threads share the same timestamp"

patterns-established:
  - "RPC calls in non-public schema use supabase.schema(schemaName).rpc(fnName, args)"
  - "Thread pagination: fetch limit+1, slice to limit, derive hasMore from overflow"
  - "Cursor encodes { t: sortTimestamp, id: lastId } as base64url JSON"

# Metrics
duration: 3min
completed: 2026-04-16
---

# Phase 3 Plan 03: Stances and Threads Endpoints Summary

**Cross-schema stance cards via SECURITY DEFINER RPC and cursor-paginated thread list with markdown-stripped excerpts, both cached via Redis middleware**

## Performance

- **Duration:** 3 min
- **Started:** 2026-04-16T14:08:11Z
- **Completed:** 2026-04-16T14:12:01Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Implemented GET /api/communities/:id/stances using `supabase.schema('connect').rpc('get_stances_for_community')` — the SECURITY DEFINER RPC reads inform.compass_stances without requiring direct schema grants on anon role
- Community existence validated before RPC call; 404 returned for unknown community; empty stances return `{ data: [] }` with 200 (not an error)
- Implemented GET /api/communities/:id/threads with two-column keyset cursor pagination, moderation_status filter, default sort by last_activity_at DESC with ?sort=newest override
- Thread excerpts strip markdown (remove-markdown library) and truncate at 200 chars at word boundary; body field excluded from API response

## Task Commits

Each task was committed atomically:

1. **Task 1: GET /api/communities/:id/stances** - `8d485bb` (feat)
2. **Task 2: GET /api/communities/:id/threads** - `7098eb9` (feat)

**Plan metadata:** _(committed after SUMMARY.md)_

## Files Created/Modified

- `src/routes/stances.ts` — Full implementation: community existence check, cross-schema RPC call, camelCase response mapping, 30-min cache
- `src/routes/threads.ts` — Full implementation: cursor pagination, sort/limit params, moderation filter, excerpt generation, 30-sec cache

## Decisions Made

- **supabase.schema('connect').rpc()** — Plan specified `supabase.rpc(..., { schema: 'connect' })` but the v2 Supabase JS client does not accept `schema` in RPC options. The correct API is chaining `.schema()` before `.rpc()`. This is a deviation from the plan's implementation guidance but preserves the intended behavior exactly. [Rule 1 - Bug in plan code]
- **sort fallback is silent** — Unknown ?sort values silently default to `active` (last_activity_at). Standard REST behavior; no 400 error for unrecognized sort params.
- **Two-column cursor** — `(sortColumn, id)` rather than `(sortColumn)` alone prevents pagination gaps when multiple threads share the same timestamp.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed RPC schema option in supabase.rpc() call**

- **Found during:** Task 1 (Implement GET /api/communities/:id/stances)
- **Issue:** Plan's implementation code used `supabase.rpc('get_stances_for_community', args, { schema: 'connect' })`. TypeScript compilation failed: `Object literal may only specify known properties, and 'schema' does not exist in type '{ head?: boolean | undefined; ... }'`. The `schema` property does not exist on the third-argument options type for `SupabaseClient.rpc()` in v2.
- **Fix:** Changed to `supabase.schema('connect').rpc('get_stances_for_community', args)` — the `.schema()` method on SupabaseClient returns a PostgrestClient scoped to that schema, whose `.rpc()` method correctly routes to the connect schema.
- **Files modified:** src/routes/stances.ts
- **Verification:** `npx tsc --noEmit` passes without errors; behavior preserved (RPC executes in connect schema context)
- **Committed in:** 8d485bb (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug — incorrect API usage in plan's implementation example)
**Impact on plan:** Fix necessary for compilation; intended behavior and contract are identical. No scope creep.

## Issues Encountered

None — both endpoints compiled cleanly and all 15 existing tests continued to pass.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Stances endpoint ready: GET /api/communities/:id/stances returns `{ data: [{ position, text, supportingPoints }] }` cached 30 min
- Threads endpoint ready: GET /api/communities/:id/threads returns `{ data: [...], meta: { cursor, hasMore } }` cached 30 sec
- Both endpoints are unauthenticated (public reads)
- 03-04 (thread detail endpoint) can proceed immediately — same routing patterns established here

---
*Phase: 03-read-api-cache*
*Completed: 2026-04-16*
