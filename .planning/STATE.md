# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-15)

**Core value:** Give every compass topic a home where citizens can understand all five perspectives and debate productively — without tribal noise.
**Current focus:** Phase 3 — Read API + Cache (In Progress)

## Current Position

Phase: 3 of 6 (Read API + Cache) — In Progress
Plan: 2 of 4 complete in current phase (03-02 complete)
Status: In progress
Last activity: 2026-04-16 — Completed 03-02-PLAN.md (GET /api/communities list + detail, cursor pagination, cache)

Progress: [████████░░] 42% (8/19 plans)

## Performance Metrics

**Velocity:**
- Total plans completed: 6
- Average duration: ~3 min/plan
- Total execution time: ~21 min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1. Foundation + Schema | 3/3 | ~10 min | ~3 min |
| 2. Auth Infrastructure | 3/3 | ~11 min | ~4 min |
| 3. Read API + Cache | 2/4 | ~17 min | ~8 min |

**Recent Trend:**
- Last 5 plans: 02-01 (~4 min), 02-03 (~2 min), 02-02 (~5 min), 03-01 (~15 min, included checkpoint), 03-02 (~2 min)
- Trend: Focused single-concern plans execute in ~2-5 min; plans with checkpoints add ~10 min

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
- [02-02]: Mock global.fetch (not msw/nock) intercepts both JWKS lazy-load and accounts API with one stub — works because createRemoteJWKSet fetches keys lazily on first jwtVerify
- [02-02]: Real jose ES256 keypair in beforeAll for authentic JWT signing in tests — no hardcoded token strings
- [02-02]: afterEach vi.unstubAllGlobals() prevents fetch mock leaking between tests
- [02-02]: Pure makeMocks() for sync tierGuards tests — no Express app overhead needed
- [03-01]: inform.compass_stances uses column 'value' (integer) not 'position' — RPC aliases s.value AS position in RETURNS TABLE contract
- [03-01]: RPC function lives in connect schema with SECURITY DEFINER so anon role can read inform.* without direct schema grants
- [03-01]: Cache key format fc:{req.path}:{JSON.stringify(req.query)} prevents route collisions between endpoints with identical empty query strings
- [03-01]: jose v6 removed KeyLike type — use native CryptoKey (Web Crypto API) in test files
- [03-02]: GET /api/communities/:id maps both Supabase error and null data to 404 (COMMUNITY_NOT_FOUND) — no distinction between DB error and not-found at route layer
- [03-02]: Cursor encodes sort column value + id; cursor is sort-mode-specific (not interchangeable between ?sort=newest and ?sort=popular)
- [03-02]: Response envelopes: list → { data, meta: { cursor, hasMore } }, single → { data } — established for all remaining read endpoints

### Pending Todos

None yet.

### Blockers/Concerns

- [Pre-Phase 5]: Framer + Express auth token flow is unverified — how Framer production frontend passes Supabase JWT to Express write endpoints needs research before Phase 5 planning. Flag: run /gsd:research-phase before planning Phase 5.
- [Pre-Phase 3]: RESOLVED — inform.compass_stances confirmed to exist with columns: id, topic_id, value, text. Cross-schema join via SECURITY DEFINER RPC is functional.

## Session Continuity

Last session: 2026-04-16T14:08:45Z
Stopped at: Completed 03-02-PLAN.md — GET /api/communities (paginated, searchable, sortable) and GET /api/communities/:id (detail + 404). All 15 tests pass.
Resume file: None
