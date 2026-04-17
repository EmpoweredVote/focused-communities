---
phase: 05-frontend-ui
plan: 04
subsystem: ui
tags: [react, tanstack-query, optimistic-updates, auth-gate, form-validation, character-counter]

# Dependency graph
requires:
  - phase: 05-03
    provides: CommunityHubPage + ThreadPage read-only shells with placeholder reply section; usePosts hook storing Post[] directly
  - phase: 02-03
    provides: AuthGate component, SuspendedNotice, apiFetch with 401 window.open behavior
  - phase: 04-01
    provides: POST /api/communities/:id/threads and POST /api/threads/:id/posts endpoints
provides:
  - useCreateThread hook (mutation, navigate on success, invalidates thread list)
  - useCreateReply hook (optimistic Post[] update, rollback on error, onSettled invalidation)
  - CharCounter component (hidden when empty, red at 90% limit)
  - ThreadCreateForm component (title + body, validation, char counters, auth-gated)
  - ReplyForm component (body, optimistic submit, clears on success, auth-gated)
  - ThreadPage with functional ReplyForm replacing placeholder + sticky Reply shortcut button
  - CommunityHubPage with ThreadCreateForm below thread list
affects: [05-05]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Mutation hooks co-locate error handling, navigation, and optimistic updates"
    - "Optimistic updates match exact cache shape stored by read hooks (Post[] directly)"
    - "SuspendedNotice surfaced at form level from per-call onError callback, not from mutation hook state"
    - "AuthGate wraps entire form — unauthenticated users see disabled textarea + sign-in button, not a broken layout"

key-files:
  created:
    - frontend/src/components/CharCounter.tsx
    - frontend/src/hooks/useCreateThread.ts
    - frontend/src/hooks/useCreateReply.ts
    - frontend/src/components/ThreadCreateForm.tsx
    - frontend/src/components/ReplyForm.tsx
  modified:
    - frontend/src/pages/CommunityHubPage.tsx
    - frontend/src/pages/ThreadPage.tsx

key-decisions:
  - "useCreateReply optimistic update uses Post[] (not { data: Post[] }) — matches usePosts queryFn which returns res.data.data directly"
  - "ReplyForm suspended state managed in component via per-call onError, not exposed from useCreateReply hook — keeps suspension UI local"
  - "useCreateThread suspended state managed in hook via useState — thread form has no per-call callbacks"
  - "Sticky Reply button uses document.getElementById scrollIntoView — no router dependency, works with any layout"

patterns-established:
  - "CharCounter: returns null when empty (no visual noise), red font-medium at 90% threshold"
  - "canSubmit: trim().length >= min && !isPending — prevents whitespace-only submissions"
  - "Toast errors for rate limit, validation, generic; SuspendedNotice for suspension (inline in form)"

# Metrics
duration: 8min
completed: 2026-04-16
---

# Phase 5 Plan 04: Write Forms Summary

**Thread creation form (title+body, char counters, validation) and reply form (optimistic update, rollback) with AuthGate, toast errors, and sticky Reply button — unauthenticated users see disabled form, connected accounts write immediately**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-04-16T00:10:00Z
- **Completed:** 2026-04-16T00:18:00Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- Mutation hooks: useCreateThread (navigate on success, invalidate list) and useCreateReply (optimistic Post[] update matching usePosts cache shape, rollback + toast on error)
- CharCounter component that hides at 0 characters and turns red at 90% of limit
- ThreadCreateForm and ReplyForm fully wrapped in AuthGate — unauthenticated users see disabled textarea + sign-in link, no broken layout
- CommunityHubPage has "Start a New Thread" section below thread list; ThreadPage has "Leave a Reply" section replacing placeholder and a fixed sticky Reply button
- Build green at 328 kB (up 9 kB from 319 kB)

## Task Commits

1. **Task 1: Mutation hooks + CharCounter** - `d4d8a28` (feat)
2. **Task 2: ThreadCreateForm, ReplyForm, page integration** - `20ce0eb` (feat)

**Plan metadata:** (committed separately as docs(05-04))

## Files Created/Modified
- `frontend/src/components/CharCounter.tsx` - Counter display, null at 0, red at 90%
- `frontend/src/hooks/useCreateThread.ts` - Thread creation mutation with navigate + invalidation
- `frontend/src/hooks/useCreateReply.ts` - Reply creation with optimistic Post[] update + rollback
- `frontend/src/components/ThreadCreateForm.tsx` - Auth-gated thread form with title/body validation
- `frontend/src/components/ReplyForm.tsx` - Auth-gated reply textarea, clears on success
- `frontend/src/pages/CommunityHubPage.tsx` - Added ThreadCreateForm section below thread list
- `frontend/src/pages/ThreadPage.tsx` - Replaced placeholder with ReplyForm + sticky button

## Decisions Made
- useCreateReply optimistic update uses `Post[]` directly (not `{ data: Post[] }`) because usePosts.queryFn returns `res.data.data` (Post[]) — the cache shape must match exactly for rollback to work
- ReplyForm suspension state lives in the component via per-call `onError` callback rather than in the hook — lets the hook stay stateless and suspension stays co-located with the form UI
- useCreateThread suspension state lives in the hook (via useState) because ThreadCreateForm uses the hook return value directly without per-call callbacks
- Sticky Reply button uses `document.getElementById('reply-form')?.scrollIntoView` — no router side-effect, simple, works with any scroll container

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Write experience complete: thread creation and reply submission functional
- Auth gating verified at AuthGate component level — unauthenticated users see disabled form with sign-in link
- Ready for Plan 05-05 (edit/delete UX or final polish pass)

---
*Phase: 05-frontend-ui*
*Completed: 2026-04-16*
