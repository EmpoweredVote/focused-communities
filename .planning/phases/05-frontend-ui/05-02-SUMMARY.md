---
phase: 05-frontend-ui
plan: 02
subsystem: ui
tags: [react, tanstack-query, react-router, tailwind, typescript, vite]

# Dependency graph
requires:
  - phase: 05-01
    provides: Vite/React app scaffold, types.ts, apiFetch, AuthContext, placeholder pages
  - phase: 04.5-stance-enrichment
    provides: description and examplePerspectives fields on stances API
  - phase: 03-read-api-cache
    provides: GET /api/communities, GET /api/communities/by-slug/:slug, GET /api/communities/:id/stances
provides:
  - DirectoryPage with keyword search, infinite scroll pagination, loading/error states
  - CommunityHubPage with community header and 5 expandable stance cards in responsive grid
  - StanceCard component (expand/collapse, no position field)
  - SkeletonCard family (community, stance, thread-list variants)
  - BackNav component
  - useCommunities, useCommunityBySlug, useStances data hooks
affects: [05-03, 05-04, 05-05]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - useInfiniteQuery for cursor-paginated community list
    - Omit<Stance, 'position'> as DisplayStance — position stripped at hook boundary before any render
    - Fisher-Yates shuffle in useStances before returning DisplayStance[]
    - Inline useDebounce (useState + useEffect) — no library
    - Default exports for page components, named exports for shared components

key-files:
  created:
    - frontend/src/hooks/useCommunities.ts
    - frontend/src/hooks/useCommunityBySlug.ts
    - frontend/src/hooks/useStances.ts
    - frontend/src/components/StanceCard.tsx
    - frontend/src/components/SkeletonCard.tsx
    - frontend/src/components/BackNav.tsx
  modified:
    - frontend/src/pages/DirectoryPage.tsx
    - frontend/src/pages/CommunityHubPage.tsx
    - frontend/src/App.tsx

key-decisions:
  - "Default exports for page components; App.tsx updated to match"
  - "position field stripped in useStances via Omit<Stance, 'position'> — TypeScript enforces no position prop reaches StanceCard"
  - "Fisher-Yates shuffle applied after shuffle to stances array each query load"

patterns-established:
  - "Hook boundary enforcement: useStances returns DisplayStance[], never Stance[] — enforces stance model invariant at type level"
  - "Inline useDebounce pattern for search inputs (no library)"
  - "Skeleton loading via react-loading-skeleton, CSS imported once in main.tsx"

# Metrics
duration: 8min
completed: 2026-04-17
---

# Phase 5 Plan 02: Directory and Hub Summary

**Read-only community browsing: DirectoryPage with keyword filter + infinite scroll, CommunityHubPage with 5 expandable stance cards (position stripped at hook boundary via DisplayStance type)**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-04-17T02:15:00Z
- **Completed:** 2026-04-17T02:23:00Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments

- Three TanStack Query data hooks: useCommunities (infinite), useCommunityBySlug (single), useStances (shuffled, position-stripped)
- DirectoryPage: live keyword filter (300ms debounce), skeleton loading, error retry, load-more pagination
- CommunityHubPage: community header, responsive 1/2/5-column stance grid, expand/collapse StanceCard, thread section placeholder
- StanceCard: zero access to position field — enforced by TypeScript via DisplayStance type
- Build: 312 kB bundle, 0 TypeScript errors

## Task Commits

1. **Task 1: Data hooks** - `c15cb56` (feat)
2. **Task 2: Components and pages** - `b7d9ba8` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `frontend/src/hooks/useCommunities.ts` - useInfiniteQuery for community list with optional keyword filter and cursor pagination
- `frontend/src/hooks/useCommunityBySlug.ts` - Single community fetch by slug, 5-min staleTime
- `frontend/src/hooks/useStances.ts` - Stances fetch with Fisher-Yates shuffle and position field stripped; exports DisplayStance type
- `frontend/src/components/StanceCard.tsx` - Expandable card for a DisplayStance; no position prop; smooth scroll on expand
- `frontend/src/components/SkeletonCard.tsx` - CommunityCardSkeleton, StanceCardSkeleton, ThreadListItemSkeleton
- `frontend/src/components/BackNav.tsx` - Back link with arrow for hub and thread pages
- `frontend/src/pages/DirectoryPage.tsx` - Full directory page (replaced placeholder)
- `frontend/src/pages/CommunityHubPage.tsx` - Full hub page (replaced placeholder)
- `frontend/src/App.tsx` - Updated DirectoryPage and CommunityHubPage imports to default exports

## Decisions Made

- **Default exports for pages:** Plan specified `export default function`. App.tsx was updated to use default imports. Named exports remain for shared components (StanceCard, BackNav, SkeletonCard family).
- **BackNav uses HTML entity for arrow:** Used `&#8592;` (left arrow) instead of the raw `←` character to avoid potential encoding issues in JSX.
- **Quote glyphs in StanceCard:** Used `&ldquo;` / `&rdquo;` for example perspectives instead of raw straight quotes — cleaner typography.

## Deviations from Plan

None — plan executed exactly as written (the JSX comment fix in CommunityHubPage was already noted in the plan and applied).

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- DirectoryPage and CommunityHubPage are complete read-only surfaces
- CommunityHubPage has a thread list placeholder at the bottom — ready for Plan 05-03 (ThreadListSection)
- StanceCard's `isHighlighted` prop accepts `false` hardcoded now — Plan 05-05 (compass integration) will pass the real value
- All components accept the types defined in types.ts; no breaking changes needed for future plans

---
*Phase: 05-frontend-ui*
*Completed: 2026-04-17*
