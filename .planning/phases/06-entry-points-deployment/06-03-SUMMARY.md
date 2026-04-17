---
phase: 06-entry-points-deployment
plan: 03
subsystem: infra
tags: [cache-control, security, rls, bundle-scan, uptimerobot, deployment]

# Dependency graph
requires:
  - phase: 06-01-entry-points-deployment
    provides: requireAuth middleware and GET /api/users/:id/posts endpoint
  - phase: 05-frontend-ui
    provides: frontend Vite build pipeline and VITE_API_BASE_URL env var convention
provides:
  - Cache-Control: private, no-store on all requireAuth-gated API responses
  - Bundle scan verification (no Supabase secrets in client bundle)
  - RLS access pattern verification against production
  - UptimeRobot monitoring initiated on /api/health
affects: []

# Tech tracking
tech-stack:
  added: [UptimeRobot (external monitoring)]
  patterns:
    - "requireAuth sets Cache-Control: private, no-store before calling next() — one location covers all auth-gated routes"

key-files:
  created: []
  modified:
    - src/middleware/auth.ts

key-decisions:
  - "Cache-Control: private, no-store added to requireAuth success path — prevents CDN caching of auth-gated responses"
  - "Frontend bundle verified clean — VITE_API_BASE_URL is the only env var exposed; no Supabase keys in client bundle"

patterns-established:
  - "Central middleware Cache-Control: one res.setHeader in requireAuth covers every existing and future auth-gated route without per-route changes"

# Metrics
duration: 10min
completed: 2026-04-17
---

# Phase 6 Plan 03: Production Deployment Checklist Summary

**Cache-Control: private, no-store hardened into requireAuth middleware; frontend bundle verified clean; RLS access patterns confirmed against production; post history endpoint and header link verified live**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-04-17
- **Completed:** 2026-04-17
- **Tasks:** 2 (1 auto + 1 human-verify checkpoint)
- **Files modified:** 1

## Accomplishments

- `src/middleware/auth.ts` — `res.setHeader('Cache-Control', 'private, no-store')` added to requireAuth success path; every auth-gated route (POST threads, POST posts, PATCH threads, PATCH posts, GET /users/:id/posts) now sends this header automatically
- Frontend bundle scan CLEAN — grep for `service_role`, `SUPABASE_SERVICE`, and `SUPABASE_KEY` patterns returned no matches in `frontend/dist/assets/`; `VITE_API_BASE_URL` is the only env var exposed to the client bundle
- RLS verification confirmed against production: anon GET /api/communities → 200, GET /api/health → 200, unauthenticated POST → 401, unauthenticated GET /api/users/:id/posts → 401
- Post history endpoint verified live with real data — returns `{ data: Array(3), meta: {...} }` with `authorPseudonym`, `threadTitle`, `communityName` correctly populated
- Header "Your activity" link verified: visible when signed in, navigates correctly to accounts.empowered.vote/profile
- UptimeRobot monitoring initiated by user on /api/health (5-minute interval, alert to bfranklin@empowered.vote)

## Task Commits

Each task was committed atomically:

1. **Task 1: Cache-Control header + bundle scan + RLS verification** - `6bc30e7` (feat)
2. **Task 2: checkpoint:human-verify** - approved by user

**Plan metadata:** (this commit)

## Files Created/Modified

- `src/middleware/auth.ts` — Added `res.setHeader('Cache-Control', 'private, no-store')` to requireAuth success path before `req.user = user; next()`

## Decisions Made

- **Cache-Control placement:** Added to requireAuth success path only (not error paths) — the header is semantically about the authenticated response content, not error responses. A future improvement could add it to 401 responses too but is not required for security.
- **Single middleware location:** One line in requireAuth covers all current and future auth-gated routes — POST /threads, POST /posts, PATCH /threads, PATCH /posts, GET /users/:id/posts. No per-route changes needed.
- **Bundle scan scope:** Scanned `dist/assets/` directory after fresh `npm run build`. Confirmed `VITE_API_BASE_URL` is the only Vite-exposed env var; Supabase URL and anon key are never referenced in the frontend codebase (all API calls go through the Express backend).

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

UptimeRobot monitoring requires manual configuration (no API for free-tier setup):
- URL: `https://fc.empowered.vote/api/health`
- Interval: 5 minutes
- Alert: bfranklin@empowered.vote

User confirmed this was in progress at checkpoint time.

## Next Phase Readiness

All six phases are complete. The Focused Communities platform is fully deployed and production-ready:

- Schema, RLS, and auth infrastructure: complete
- Read API with Redis cache: complete
- Write API with rate limiting and edit history: complete
- Stance content enrichment: complete
- Frontend UI: complete and verified on fc.empowered.vote
- Entry points, external wiring specs, and deployment hardening: complete

Remaining external wiring (Compass integration, Civic Spaces nav link) depends on third-party teams and is documented in 06-02-PLAN.md integration specs. No application code changes required from this repository.

---
*Phase: 06-entry-points-deployment*
*Completed: 2026-04-17*
