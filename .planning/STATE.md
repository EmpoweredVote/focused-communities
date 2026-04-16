# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-15)

**Core value:** Give every compass topic a home where citizens can understand all five perspectives and debate productively — without tribal noise.
**Current focus:** Phase 2 — Auth Infrastructure

## Current Position

Phase: 2 of 6 (Auth Infrastructure)
Plan: 1 of 3 in current phase (02-01 complete; 02-02 pending; 02-03 complete)
Status: In progress (02-01 and 02-03 complete; 02-02 pending)
Last activity: 2026-04-16 — Completed 02-01-PLAN.md (JWKS singleton, requireAuth, optionalAuth, requireConnected)

Progress: [█████░░░░░] 26% (5/19 plans)

## Performance Metrics

**Velocity:**
- Total plans completed: 5
- Average duration: ~3 min/plan
- Total execution time: ~16 min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1. Foundation + Schema | 3/3 | ~10 min | ~3 min |
| 2. Auth Infrastructure | 2/3 (02-01, 02-03 done) | ~6 min | ~3 min |

**Recent Trend:**
- Last 4 plans: 01-02 (~2 min), 01-03 (~2 min), 02-03 (~2 min), 02-01 (~4 min)
- Trend: Focused single-concern plans execute in ~2-4 min

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Foundation]: Use moderation_status enum (NOT deleted_at) in all RLS USING clauses — avoids Supabase soft-delete deadlock bug #1941
- [Foundation]: Display name must be snapshotted at post time (trigger approach recommended over application layer)
- [Foundation]: connect.* schema requires explicit GRANT USAGE ON SCHEMA connect TO anon, authenticated
- [Foundation]: (SELECT auth.uid()) not bare auth.uid() in all RLS policy expressions — statement-level caching
- [Foundation]: All schema changes via Supabase CLI migrations only — no manual console changes
- [01-02]: moderation_status enum has only 'visible' and 'hidden' — no speculative values (enum values cannot be removed in PostgreSQL)
- [01-02]: topic_id UUID NOT NULL without FK constraint — inform schema cross-schema FK deferred to Phase 3
- [01-02]: connected_profiles in public schema so connect.* trigger functions can read it regardless of schema grants
- [01-02]: SECURITY DEFINER on all trigger functions (snapshot + edit history) to bypass RLS at trigger time
- [01-02]: WHEN clause on AFTER UPDATE edit triggers prevents spurious audit rows on metadata-only updates
- [Phase 5]: Framer components must use absolute URLs for /api/* calls (self-contained, no direct Supabase queries)
- [Phase 5]: Skip Supabase Realtime in v1; use React Query refetchInterval polling instead
- [Phase 6]: Cache-Control: private, no-store on all auth-touching routes
- [02-01]: "type": "module" added to package.json — jose is ESM-only; entire codebase already used ESM import syntax confirming this was always the intended module format
- [02-01]: JWKS singleton at module level, not per-request — one instance per process
- [02-01]: Accounts API called on every requireAuth request for session revocation (not just JWT verification)
- [02-01]: requireConnected does NOT gate on completed_onboarding — connected_no_compass users are write-eligible
- [02-03]: window.history.replaceState for hash cleanup (not window.location.hash = '' which adds history entry)
- [02-03]: apiFetch uses window.open(..., '_blank') for 401 — preserves tab + draft content
- [02-03]: connected_no_compass users pass through AuthGate (calibration is NOT a write gate)
- [02-03]: SuspendedNotice is separate from AuthGate — suspension detected at API call time (403 response)

### Pending Todos

None yet.

### Blockers/Concerns

- [Pre-Phase 5]: Framer + Express auth token flow is unverified — how Framer production frontend passes Supabase JWT to Express write endpoints needs research before Phase 5 planning. Flag: run /gsd:research-phase before planning Phase 5.
- [Pre-Phase 3]: Confirm connect.communities can reference inform.compass_topics via FK (cross-schema JOIN). If not, use denormalized topic_id UUID with no FK constraint. Verify during Phase 3 implementation.

## Session Continuity

Last session: 2026-04-16T02:14:36Z
Stopped at: Completed 02-01-PLAN.md — JWKS singleton, requireAuth/optionalAuth, requireConnected. Phase 2 plans 02-01 and 02-03 complete; 02-02 pending.
Resume file: None
