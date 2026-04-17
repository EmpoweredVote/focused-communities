---
phase: 06-entry-points-deployment
plan: 01
subsystem: api
tags: [express, supabase, cursor-pagination, react, typescript, header]

# Dependency graph
requires:
  - phase: 05-frontend-ui
    provides: DirectoryPage, CommunityHubPage, ThreadPage pages that receive Header
  - phase: 04-write-api
    provides: posts table and cursor pagination patterns in threads.ts
  - phase: 02-auth-infrastructure
    provides: requireAuth middleware, AuthContext with useAuth hook
provides:
  - GET /api/users/:id/posts — cursor-paginated post history endpoint (self-only, auth-gated)
  - Header.tsx shared component with Your activity link on all three pages
  - ACCOUNTS-HANDOFF-SPEC.md — complete API contract for Accounts team
affects: [06-02-compass-integration, 06-03-deployment-checklist, accounts-team]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Self-only auth gate: requireAuth + req.params.id !== req.user!.id → 403"
    - "!inner join on posts→threads→communities excludes moderated content at join time"
    - "Named export Header component renders on all page entry points"

key-files:
  created:
    - src/routes/users.ts
    - frontend/src/components/Header.tsx
    - .planning/phases/06-entry-points-deployment/ACCOUNTS-HANDOFF-SPEC.md
  modified:
    - src/app.ts
    - frontend/src/pages/DirectoryPage.tsx
    - frontend/src/pages/CommunityHubPage.tsx
    - frontend/src/pages/ThreadPage.tsx

key-decisions:
  - "No cacheMiddleware on /users/:id/posts — auth-gated user-specific data must never be cached"
  - "!inner joins (not explicit moderation_status filter on joined tables) — avoids Supabase JS nested filter limitation"
  - "Header renders on all three early-return paths (loading, error) plus main return — no page state skips the header"

patterns-established:
  - "Pattern: Self-only gate — requireAuth then req.params.id !== req.user!.id → 403"

# Metrics
duration: 5min
completed: 2026-04-17
---

# Phase 6 Plan 01: Entry Points - API + Header + Handoff Spec Summary

**Cursor-paginated GET /api/users/:id/posts endpoint (self-only, 403 gate), shared Header.tsx on all three pages with auth-aware Your activity link, and complete Accounts handoff spec document**

## Performance

- **Duration:** 5 min
- **Started:** 2026-04-17T17:22:50Z
- **Completed:** 2026-04-17T17:27:50Z
- **Tasks:** 3
- **Files modified:** 7

## Accomplishments

- `GET /api/users/:id/posts` endpoint with cursor pagination following threads.ts pattern exactly — 403 for id mismatch, no cacheMiddleware, response shape matches spec (postId, threadId, threadTitle, communityId, communityName, communitySlug, postExcerpt, createdAt, isEdited, authorPseudonym)
- Shared `Header.tsx` named export renders on all three pages (DirectoryPage, CommunityHubPage, ThreadPage) including all early-return paths (loading, error states) — Your activity link points to `https://accounts.empowered.vote/profile` in teal (#03b9d2), visible to connected and connected_no_compass auth states
- `ACCOUNTS-HANDOFF-SPEC.md` covers endpoint contract, display requirements, pseudonym rules, thread link construction, pagination lifecycle, error handling, and EV Post History Standard cross-product vision

## Task Commits

Each task was committed atomically:

1. **Task 1: GET /api/users/:id/posts endpoint** - `0be1ca3` (feat)
2. **Task 2: Shared Header component + pages** - `c525566` (feat)
3. **Task 3: Accounts handoff spec** - `4187e9e` (docs)

**Plan metadata:** (following this summary)

## Files Created/Modified

- `src/routes/users.ts` — usersRouter with GET /users/:id/posts, self-only gate, cursor pagination, !inner joins
- `src/app.ts` — added usersRouter import and `app.use('/api', usersRouter)` registration
- `frontend/src/components/Header.tsx` — named export Header with auth-state-conditional rendering
- `frontend/src/pages/DirectoryPage.tsx` — added Header import and `<Header />` as first element in all return paths
- `frontend/src/pages/CommunityHubPage.tsx` — added Header to loading, error, and main return paths
- `frontend/src/pages/ThreadPage.tsx` — added Header to loading, error, and main return paths
- `.planning/phases/06-entry-points-deployment/ACCOUNTS-HANDOFF-SPEC.md` — complete handoff spec

## Decisions Made

- **No cacheMiddleware on /users/:id/posts:** Consistent with the Phase 6 decision (Cache-Control: private, no-store on auth-touching routes). Applied here by simply omitting cacheMiddleware from the route chain — the Cache-Control header itself is added by requireAuth (see Phase 6 deployment checklist task).
- **!inner joins, not explicit moderation_status filter on joined tables:** Supabase JS v2 PostgREST nested select `.eq('thread.moderation_status', 'visible')` is unreliable as a top-level filter. Using `threads!inner(...)` and `communities!inner(...)` excludes posts whose thread or community is hidden/deleted at join time, achieving the same safety guarantee without relying on nested column filtering.
- **Header renders on all early-return paths:** Each page has loading and error early returns that previously bypassed any shared layout. Adding Header to all three paths ensures no page state ever shows the user a headerless screen.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

Two pre-existing test failures in `write-api.test.ts` (tests 2b and 4b — validation ordering in POST /threads/:id/posts and PATCH /posts/:id) were present before this plan. Not introduced by this plan's changes. Verified by stashing changes and confirming failures existed on clean HEAD.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `GET /api/users/:id/posts` is live and ready for Accounts team integration
- Header.tsx renders correctly on all pages; Accounts profile page can be built at any time
- ACCOUNTS-HANDOFF-SPEC.md is complete and ready to share with Accounts team
- Ready for 06-02: Compass integration spec (topic-to-slug mapping + entry point spec document)

---
*Phase: 06-entry-points-deployment*
*Completed: 2026-04-17*
