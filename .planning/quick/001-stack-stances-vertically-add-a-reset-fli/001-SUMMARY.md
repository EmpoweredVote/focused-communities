---
phase: quick
plan: 001
subsystem: ui
tags: [tailwind-v4, dark-mode, brand-tokens, manrope, css-custom-properties, react]

requires:
  - phase: 05-frontend-ui
    provides: all React components and pages in their pre-brand state

provides:
  - EV brand CSS design tokens via Tailwind v4 @theme block
  - Manrope font loaded globally with flash-prevention dark init script
  - Dark mode toggle in Header with localStorage persistence
  - Vertical single-column stance layout with Fisher-Yates shuffle button
  - Semantic color system (surface/text/border custom properties) covering light + dark
  - All 18 frontend files fully re-themed with ev-coral, ev-teal, ev-yellow palette

affects: [future-ui, future-components]

tech-stack:
  added: []
  patterns:
    - "Tailwind v4 @theme block for CSS custom properties consumed as utility classes"
    - "@custom-variant dark for .dark class-based toggle (not prefers-color-scheme)"
    - "Semantic token layering: ev-coral/ev-teal primitives + surface/text/border semantics"
    - "Dark mode via html.dark CSS custom property overrides — no JS class-per-element"
    - "shuffle() exported from useStances.ts; displayedStances local state synced from query"

key-files:
  created:
    - frontend/src/index.css
  modified:
    - frontend/index.html
    - frontend/src/hooks/useStances.ts
    - frontend/src/components/StanceCard.tsx
    - frontend/src/components/SkeletonCard.tsx
    - frontend/src/pages/CommunityHubPage.tsx
    - frontend/src/components/Header.tsx
    - frontend/src/pages/DirectoryPage.tsx
    - frontend/src/pages/ThreadPage.tsx
    - frontend/src/pages/NotFoundPage.tsx
    - frontend/src/components/BackNav.tsx
    - frontend/src/components/AuthGate.tsx
    - frontend/src/components/ThreadListItem.tsx
    - frontend/src/components/ThreadCreateForm.tsx
    - frontend/src/components/ReplyForm.tsx
    - frontend/src/components/ReplyItem.tsx
    - frontend/src/components/EditForm.tsx
    - frontend/src/components/EditHistory.tsx
    - frontend/src/components/CharCounter.tsx
    - frontend/src/components/AppCrashFallback.tsx

key-decisions:
  - "Dark mode flash prevention via inline <script> in <head> before font links — runs synchronously before render"
  - "@custom-variant dark (&:where(.dark, .dark *)) enables dark: prefix off .dark class not prefers-color-scheme"
  - "Semantic surface/text/border tokens override on html.dark — one CSS rule covers every component automatically"
  - "shuffle() exported from useStances.ts; CommunityHubPage owns displayedStances state for re-shuffle without refetch"
  - "Shuffle button uses swap icon + 'Shuffle' label — no numbers, no position indicators ever shown"
  - "StanceCard border-l-4 accent on hover (ev-teal-light) — subtle directional polish for vertical layout"
  - "react-loading-skeleton dark mode via CSS --base-color/--highlight-color overrides in index.css"
  - "max-w-3xl for ThreadPage and DirectoryPage (from max-w-2xl) for better reading width"
  - "Header max-w bumped to 4xl to match CommunityHubPage content width"

patterns-established:
  - "Brand color pattern: ev-coral for primary CTAs, ev-teal for sort/active states, ev-yellow for highlights"
  - "Semantic token pattern: use text-text-body/secondary/muted, bg-surface-primary/hover, border-border-light/medium"
  - "Error states keep text-red-500 (semantic, consistent with EV error token)"
  - "Suspended notice stays red — accessibility-critical state color"

duration: 6min
completed: 2026-04-18
---

# Quick Task 001: Stack Stances Vertically + Brand Theme Summary

**EV brand identity applied across all 19 frontend files: Manrope font, ev-coral/teal/yellow palette via Tailwind v4 CSS tokens, vertical stance layout with shuffle button, and dark mode toggle with localStorage persistence**

## Performance

- **Duration:** ~6 min
- **Started:** 2026-04-18T03:54:30Z
- **Completed:** 2026-04-18T04:00:14Z
- **Tasks:** 3 (+ 1 checkpoint pending user verification)
- **Files modified:** 19

## Accomplishments

- Tailwind v4 @theme block defines all EV brand colors as utility classes (bg-ev-coral, text-ev-teal, etc.) and semantic surface/text/border tokens that auto-switch in dark mode via html.dark overrides
- Stances now display in a single vertical flex-col column with a "Shuffle" button (swap icon, no numbers) that Fisher-Yates re-randomizes the display order from local state without a network request
- Dark mode toggle in Header writes to localStorage (fc-theme key); inline script in index.html prevents flash-of-wrong-theme on page load

## Task Commits

1. **Task 1: Brand theme foundation** - `3982f15` (feat)
2. **Task 2: Vertical stances + shuffle + brand hub/header** - `e714667` (feat)
3. **Task 3: Brand-theme all remaining pages and components** - `45be935` (feat)

## Files Created/Modified

- `frontend/index.html` - Added dark-mode init script, Manrope preconnect + font link
- `frontend/src/index.css` - @theme brand tokens, semantic light/dark variables, skeleton dark overrides
- `frontend/src/hooks/useStances.ts` - Exported shuffle() for re-randomization
- `frontend/src/components/StanceCard.tsx` - ev-yellow-light highlight, surface-card, hover border accent, shadow polish
- `frontend/src/components/SkeletonCard.tsx` - border-border-light replaces gray
- `frontend/src/pages/CommunityHubPage.tsx` - Vertical flex-col stances, shuffle button, full brand colors, ev-teal sort pills
- `frontend/src/components/Header.tsx` - Dark mode toggle (sun/moon), ev-teal brand name, semantic auth controls
- `frontend/src/pages/DirectoryPage.tsx` - max-w-3xl, ev-coral CTA, ev-teal focus ring, semantic tokens
- `frontend/src/pages/ThreadPage.tsx` - max-w-3xl, ev-coral sticky Reply button, ev-teal focus rings
- `frontend/src/pages/NotFoundPage.tsx` - ev-teal-light link, semantic text
- `frontend/src/components/BackNav.tsx` - text-muted hover text-primary
- `frontend/src/components/AuthGate.tsx` - surface-hover disabled, ev-teal-light sign-in
- `frontend/src/components/ThreadListItem.tsx` - border-border-light, semantic text tokens
- `frontend/src/components/ThreadCreateForm.tsx` - ev-coral submit, ev-teal focus, semantic labels
- `frontend/src/components/ReplyForm.tsx` - ev-coral submit, ev-teal focus
- `frontend/src/components/ReplyItem.tsx` - border-border-light, semantic author/timestamp/body
- `frontend/src/components/EditForm.tsx` - ev-coral save, ev-teal focus, surface-hover cancel
- `frontend/src/components/EditHistory.tsx` - surface-hover history items, text-muted toggle
- `frontend/src/components/CharCounter.tsx` - text-text-muted normal state
- `frontend/src/components/AppCrashFallback.tsx` - surface-primary bg, semantic text, surface-hover button

## Decisions Made

- Dark mode flash prevention: inline script in `<head>` before font links runs synchronously — reads localStorage before any rendering occurs
- `@custom-variant dark (&:where(.dark, .dark *))` — enables `dark:` prefix off `.dark` class, not `prefers-color-scheme`; required for manual toggle to work correctly in Tailwind v4
- Semantic token architecture: primitive brand colors (`ev-coral`, `ev-teal`) + semantic surface/text/border tokens that CSS-override on `html.dark` — no per-component dark class needed
- `shuffle()` exported from `useStances.ts`; `CommunityHubPage` owns `displayedStances` state synced from query via `useEffect` — re-shuffle is pure local state operation, no refetch
- Shuffle button strictly "Shuffle" label with swap SVG icon — no numbers, no position indicators, no ordinal language anywhere
- `max-w-3xl` for ThreadPage and DirectoryPage (up from `max-w-2xl`) for better reading line length
- Header `max-w-4xl` matches CommunityHubPage content area width

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All 19 frontend files are fully brand-themed and building cleanly (TypeScript + Vite production build verified)
- Dark mode toggle is functional; all semantic tokens switch automatically via html.dark CSS overrides
- Awaiting user visual verification (checkpoint) before marking complete
- No blockers for future UI work

---
*Phase: quick-001*
*Completed: 2026-04-18*
