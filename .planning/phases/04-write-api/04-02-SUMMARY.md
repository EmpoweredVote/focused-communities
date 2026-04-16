---
phase: 04-write-api
plan: 02
subsystem: api
tags: [express, supabase, edit-history, cache-invalidation, typescript, ownership-check]

# Dependency graph
requires:
  - phase: 04-write-api/04-01
    provides: requireAuth/requireConnected middleware chain, cacheDel, POST endpoints pattern
  - phase: 01-foundation-schema
    provides: thread_edits + post_edits tables, trg_log_thread_edit + trg_log_post_edit triggers

provides:
  - PATCH /api/threads/:id — ownership-checked thread editing with atomic DB-trigger edit history
  - PATCH /api/posts/:id — ownership-checked reply editing with atomic DB-trigger edit history
  - DELETE /api/threads/:id → 405 Method Not Allowed
  - DELETE /api/posts/:id → 405 Method Not Allowed
  - GET /api/threads/:id/edits — public edit history (newest-first)
  - GET /api/posts/:id/edits — public edit history (newest-first)
  - isEdited + updatedAt fields added to GET /api/threads/:id and GET /api/threads/:id/posts items

affects:
  - 04-write-api/04-03 (integration tests cover all endpoints built in 04-01 + 04-02)
  - 05-frontend (edit form, version history display, isEdited indicator)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Ownership check pattern: fetch-then-compare author_id, return 404 (not 403) for non-author"
    - "Partial PATCH: only provided fields are updated; at least one required"
    - "DB trigger handles edit history atomically — PATCH just does UPDATE, trigger fires on content change"
    - "isEdited derived from updated_at !== created_at timestamp comparison"
    - "DELETE rejection: 405 with Allow: GET, PATCH header"
    - "Edit history endpoints: unauthenticated, no cache, fresh always"

key-files:
  created: []
  modified:
    - src/routes/threads.ts
    - src/routes/posts.ts

key-decisions:
  - "404 returned for non-author PATCH (not 403) — hides content existence, consistent with Phase 3 moderation approach"
  - "PATCH does not use rate limiter — editing is unlimited per CONTEXT.md"
  - "isEdited derived from timestamp comparison: updated_at !== created_at"
  - "Edit history GET endpoints are unauthenticated — Memory over Moderation, all edits are public"
  - "No cache on edit history routes — always fresh, low traffic"
  - "405 DELETE uses Allow: GET, PATCH header — RFC 7231 compliant"

patterns-established:
  - "Ownership check: fetch record → compare author_id → 404 if mismatch"
  - "PATCH validation: check at-least-one field present → validate present fields only"
  - "isEdited: data.updated_at !== data.created_at"

# Metrics
duration: ~4min
completed: 2026-04-16
---

# Phase 4 Plan 02: Edit Endpoints + History Summary

**Ownership-checked PATCH edit routes with atomic DB-trigger history, 405 DELETE rejection, public edit history GET endpoints, and isEdited indicators on read responses**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-04-16T16:30:00Z
- **Completed:** 2026-04-16T16:34:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- PATCH /api/threads/:id: partial update (title, body, or both), ownership check returns 404 for non-author, DB trigger atomically writes to thread_edits on content change, cacheDel, returns 200 with isEdited
- PATCH /api/posts/:id: body update, ownership check, DB trigger writes to post_edits, cacheDel with thread_id for posts list invalidation, returns 200 with isEdited
- DELETE /api/threads/:id and DELETE /api/posts/:id both return 405 with Allow: GET, PATCH header
- GET /api/threads/:id/edits: public, uncached, returns {data: [{id, oldTitle, oldBody, editedAt}]} newest-first
- GET /api/posts/:id/edits: public, uncached, returns {data: [{id, oldBody, editedAt}]} newest-first
- GET /api/threads/:id now includes isEdited and updatedAt
- GET /api/threads/:id/posts items now include isEdited

## Task Commits

1. **Task 1: PATCH edit + DELETE 405 for threads and posts** - `9d816e1` (feat)
2. **Task 2: Edit history GET endpoints + isEdited on read responses** - `41bec04` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `src/routes/threads.ts` — Added PATCH /threads/:id, DELETE /threads/:id (405), GET /threads/:id/edits
- `src/routes/posts.ts` — Added PATCH /posts/:id, DELETE /posts/:id (405), GET /posts/:id/edits, isEdited + updatedAt on GET /threads/:id and GET /threads/:id/posts

## Decisions Made

- Non-author PATCH returns 404 (not 403) — consistent with Phase 3 hidden-content behavior, doesn't reveal content existence
- PATCH has no rate limit — editing is not new feed content per CONTEXT.md decision
- isEdited derived from `data.updated_at !== data.created_at` — simple, no extra column needed
- Edit history is always fresh (no cacheMiddleware) — low traffic, correctness matters more than performance here
- The DB trigger handles edit history atomically; application code just does the UPDATE

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None.

## Next Phase Readiness

- All write endpoints complete (POST create + PATCH edit + DELETE rejection)
- Edit history publicly accessible
- isEdited indicator present on all read responses
- All 30 existing tests still pass
- Ready for plan 04-03: integration test suite for all write endpoints

---
*Phase: 04-write-api*
*Completed: 2026-04-16*
