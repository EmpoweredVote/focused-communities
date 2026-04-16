---
phase: 03-read-api-cache
plan: "02"
subsystem: api
tags: [express, supabase, cursor-pagination, cache, communities, search]

requires:
  - phase: 03-01
    provides: cacheMiddleware, TTL constants, encodeCursor/decodeCursor/parseLimit utils, communitiesRouter stub, app.ts mounting

provides:
  - GET /api/communities — paginated community list with ?q= search, ?sort= ordering, cursor pagination
  - GET /api/communities/:id — single community detail with 404 envelope
  - Both routes cached at 5-minute TTL via cacheMiddleware(TTL.COMMUNITIES)

affects: [03-03, 03-04, phase-5-frontend]

tech-stack:
  added: []
  patterns:
    - "limit+1 keyset pagination pattern: fetch N+1 rows to detect hasMore without COUNT(*)"
    - "Cursor encodes sort value + id as base64url JSON for stable pagination across sort modes"
    - "Response envelope: list → { data, meta: { cursor, hasMore } }, single → { data }"
    - "snake_case DB columns mapped to camelCase in all API responses"
    - "Supabase .or() filter for multi-column ILIKE search"

key-files:
  created: []
  modified:
    - src/routes/communities.ts

key-decisions:
  - "Cursor encodes both sort column value and id for stable tie-breaking pagination"
  - "Sort column selected at runtime (member_count vs created_at) based on ?sort= param"
  - "GET /api/communities/:id uses .single() and maps Supabase error to 404 (no distinction between DB error and not-found — both return 404 with COMMUNITY_NOT_FOUND)"

patterns-established:
  - "Cursor pagination: order by sort col DESC, then id DESC; cursor filters on (sort_col < t) OR (sort_col = t AND id < id)"
  - "Error envelope: { error: { code: string, message: string } } for all error responses"
  - "Data envelope: { data: T } for single resources, { data: T[], meta } for collections"

duration: 2min
completed: 2026-04-16
---

# Phase 3 Plan 02: Communities Endpoints Summary

**Paginated community directory with cursor keyset pagination, ILIKE multi-column search, dual sort modes, and 5-minute Redis cache**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-04-16T14:07:30Z
- **Completed:** 2026-04-16T14:08:45Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments

- Implemented GET /api/communities with ?q= search, ?sort=newest|popular, cursor-based keyset pagination, and limit+1 hasMore detection
- Implemented GET /api/communities/:id returning single community or 404 error envelope
- Both routes wrapped with cacheMiddleware(TTL.COMMUNITIES) — 300-second TTL
- Full snake_case → camelCase field mapping including memberCount, threadCount, sliceLabel, topicId

## Task Commits

Each task was committed atomically:

1. **Task 1: Implement GET /api/communities and GET /api/communities/:id** - `0832432` (feat)

**Plan metadata:** (docs commit — see below)

## Files Created/Modified

- `src/routes/communities.ts` — Full implementation of both community endpoints (96 lines, replacing 2-line stub)

## Decisions Made

- GET /api/communities/:id maps both Supabase error and null data to 404 with COMMUNITY_NOT_FOUND code — no distinction between "DB error" and "not found" at this layer, matching plan spec
- Cursor encodes the sort column value (created_at or member_count) + id so pagination remains stable when switching between sort modes (cursor is sort-mode-specific)
- Used `.or()` Supabase filter for ILIKE search rather than two `.ilike()` calls to match the plan's `name.ilike.%q%.description.ilike.%q%` pattern exactly

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Communities list and detail endpoints are ready for 03-03 (stances) and 03-04 (threads)
- Cursor pagination pattern established here should be reused for thread list endpoint in 03-04
- Error envelope pattern (code + message) established here applies to all remaining read endpoints

---
*Phase: 03-read-api-cache*
*Completed: 2026-04-16*
