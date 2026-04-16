# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-15)

**Core value:** Give every compass topic a home where citizens can understand all five perspectives and debate productively — without tribal noise.
**Current focus:** Phase 2 — Auth Infrastructure

## Current Position

Phase: 2 of 6 (Auth Infrastructure)
Plan: 3 of 3 in current phase (wave 1 — 02-01 and 02-02 may still be in progress)
Status: In progress (02-03 complete; 02-01 and 02-02 parallel plans pending)
Last activity: 2026-04-15 — Completed 02-03-PLAN.md (AuthContext, apiFetch, AuthGate)

Progress: [████░░░░░░] 21% (4/19 plans)

## Performance Metrics

**Velocity:**
- Total plans completed: 4
- Average duration: ~3 min/plan
- Total execution time: ~12 min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1. Foundation + Schema | 3/3 | ~10 min | ~3 min |
| 2. Auth Infrastructure | 1/3 (02-03 done) | ~2 min | — |

**Recent Trend:**
- Last 3 plans: 01-02 (~2 min), 01-03 (~2 min), 02-03 (~2 min)
- Trend: Focused single-concern plans execute in ~2 min

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

Last session: 2026-04-16T02:13:44Z
Stopped at: Completed 02-03-PLAN.md — AuthContext, apiFetch, AuthGate frontend primitives. Phase 2 plan 03 complete.
Resume file: None
