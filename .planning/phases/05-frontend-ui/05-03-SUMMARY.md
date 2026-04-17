---
phase: 05-frontend-ui
plan: 03
subsystem: ui
tags: [react, tanstack-query, react-router, typescript, tailwind, cursor-pagination, polling]

# Dependency graph
requires:
  - phase: 05-02
    provides: CommunityHubPage scaffold, useCommunityBySlug, useStances, SkeletonCard family, BackNav, types.ts
  - phase: 03-03
    provides: GET /api/communities/:id/threads (cursor-paginated), GET /api/threads/:id, GET /api/threads/:id/posts
provides:
  - useThreads hook with infinite cursor pagination and 30s polling
  - useThread hook for single thread detail
  - usePosts hook with 30s polling
  - formatRelativeTime utility (sec/min/hour/day/date display)
  - ThreadListItem component linking to /communities/:slug/threads/:id
  - ReplyItem component (flat chronological, dividers, edited indicator)
  - CommunityHubPage thread section (sort toggle, pagination, skeletons, error/empty states)
  - ThreadPage (full thread body + reply list, loading/error states, reply form placeholder)
affects: [05-04, 05-05]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - useInfiniteQuery with initialPageParam null and getNextPageParam for cursor pagination
    - 30s polling via refetchInterval on thread list and posts (no background polling)
    - isAuthor prop accepted but prefixed _isAuthor — reserved for Plan 05-04 edit button
    - Default exports for page components; named exports for shared components

key-files:
  created:
    - frontend/src/lib/formatTime.ts
    - frontend/src/hooks/useThreads.ts
    - frontend/src/hooks/useThread.ts
    - frontend/src/hooks/usePosts.ts
    - frontend/src/components/ThreadListItem.tsx
    - frontend/src/components/ReplyItem.tsx
  modified:
    - frontend/src/pages/CommunityHubPage.tsx
    - frontend/src/pages/ThreadPage.tsx
    - frontend/src/App.tsx

key-decisions:
  - "ThreadPage converted to default export to match page component convention (App.tsx import updated)"
  - "_refetchThread prefixed with underscore — refetch wired but not surfaced in UI yet (no retry button on thread header error in normal flow)"
  - "isAuthor in ReplyItem accepts authorName === post.authorPseudonym comparison — pseudonym matching used because display_name IS the pseudonym stored at post time"

patterns-established:
  - "Sort toggle: pill buttons with bg-gray-900 active state, gray-600 hover inactive"
  - "Thread list container: border + rounded-lg + divide-y for list grouping"
  - "Load more button: disabled when isFetchingNextPage, shows Loading... text"

# Metrics
duration: 8min
completed: 2026-04-16
---

# Phase 5 Plan 03: Thread List and Thread Page Summary

**Cursor-paginated thread list on CommunityHubPage with sort toggle + full ThreadPage with flat chronological replies, both polling every 30s**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-04-16T00:00:00Z
- **Completed:** 2026-04-16T00:08:00Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments
- Data layer: three hooks (useThreads with infinite cursor pagination, useThread, usePosts) and formatRelativeTime utility
- CommunityHubPage: Discussion section with Most Active / Newest sort toggle, skeleton loading, error retry, empty state, "Load more threads" pagination
- ThreadPage: full thread body with author/timestamp/edited indicator, flat chronological reply list with ReplyItem dividers, inline skeleton loading states
- Build: green at 319 kB (7 kB increase from 05-02's 312 kB)

## Task Commits

Each task was committed atomically:

1. **Task 1: Data hooks — useThreads, useThread, usePosts + formatTime utility** - `55b73ed` (feat)
2. **Task 2: ThreadListItem, ReplyItem, CommunityHubPage thread section, ThreadPage** - `a558ff9` (feat)

**Plan metadata:** (docs commit — see below)

## Files Created/Modified
- `frontend/src/lib/formatTime.ts` - Relative time formatter (sec/min/hour/day/localeDate)
- `frontend/src/hooks/useThreads.ts` - Infinite query with cursor, 30s polling, enabled guard
- `frontend/src/hooks/useThread.ts` - Single thread detail, staleTime 30s
- `frontend/src/hooks/usePosts.ts` - Post list with 30s polling
- `frontend/src/components/ThreadListItem.tsx` - Linked list item with title/excerpt/meta
- `frontend/src/components/ReplyItem.tsx` - Post row with divider, edited indicator, isAuthor reserved
- `frontend/src/pages/CommunityHubPage.tsx` - Added thread section with sort, pagination, states
- `frontend/src/pages/ThreadPage.tsx` - Full implementation replacing placeholder
- `frontend/src/App.tsx` - Updated ThreadPage import to default

## Decisions Made
- ThreadPage converted from named to default export to match CommunityHubPage and DirectoryPage convention — App.tsx updated accordingly
- `_refetchThread` prefixed with underscore: the refetch function is wired but not yet surfaced in ThreadPage UI (thread error state shows a static message; retry button not in scope for 05-03)
- `isAuthor` in ReplyItem compares `authorName === post.authorPseudonym` — pseudonym matching works because display_name is the pseudonym captured at post time per the snapshot trigger design

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Thread list and read-only ThreadPage complete — success criterion #2 delivered
- Plan 05-04 can wire the reply form (POST /api/communities/:id/threads, POST /api/threads/:id/posts) and the edit flow using the `isAuthor` prop already accepted by ReplyItem
- ThreadListItemSkeleton already existed in SkeletonCard.tsx from 05-02 — confirmed and used

---
*Phase: 05-frontend-ui*
*Completed: 2026-04-16*
