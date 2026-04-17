# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-15)

**Core value:** Give every compass topic a home where citizens can understand all five perspectives and debate productively — without tribal noise.
**Current focus:** Phase 5 — Frontend UI

## Current Position

Phase: 5 of 6 (Frontend UI) — In progress
Plan: 1 of 5 complete in current phase
Status: Plan 05-01 complete — Vite/React app scaffolded, provider stack wired, types defined, by-slug route added
Last activity: 2026-04-17 — Completed 05-01-PLAN.md (app scaffold)

Progress: [████████████████░] 73% (16/22 plans)

## Performance Metrics

**Velocity:**
- Total plans completed: 7
- Average duration: ~4 min/plan
- Total execution time: ~28 min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1. Foundation + Schema | 3/3 | ~10 min | ~3 min |
| 2. Auth Infrastructure | 3/3 | ~11 min | ~4 min |
| 3. Read API + Cache | 4/4 | ~28 min | ~7 min |
| 4. Write API | 3/3 | ~12 min | ~4 min |
| 4.5. Stance Content Enrichment | 2/2 | ~35 min | ~17 min |
| 5. Frontend UI | 1/5 | ~7 min | ~7 min |

**Recent Trend:**
- Last 5 plans: 03-04 (~8 min), 04-01 (~3 min), 04-02 (~4 min), 04-03 (~5 min)
- Trend: Focused single-concern plans execute in ~2-5 min; integration test creation ~5 min; plans with checkpoints add ~10 min

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
- [03-03]: supabase.schema('connect').rpc() not supabase.rpc(..., { schema }) — schema option does not exist on SupabaseClient.rpc() third-arg options in v2; use .schema() chain
- [03-03]: Thread pagination uses two-column cursor (sortColumn, id) to prevent gaps when multiple threads share the same timestamp
- [03-03]: Thread sort: active=last_activity_at DESC (default), newest=created_at DESC; unknown values fall back silently to active
- [03-04]: supabase-js (postgrest-js) uses res.text() not res.json(); fetch mocks must provide text: async () => JSON.stringify(body)
- [03-04]: In-memory Redis fallback (module-level Map) persists across tests; use unique resource IDs per test to avoid cache hits
- [03-04]: vitest.config.ts test.env field satisfies module-level env var checks before module evaluation (correct approach over .env.test)
- [03-04]: Hidden content returns 404 not 403 — avoids revealing existence of moderated threads/posts
- [04-01]: Validation runs before rate limiting — invalid requests do not consume rate limit quota
- [04-01]: Thread existence check runs before validation in POST /threads/:id/posts — fail fast before I/O
- [04-01]: reset from @upstash/ratelimit is milliseconds; Retry-After header divides by 1000 for seconds
- [04-01]: cacheDel Redis error is warn-and-continue — in-memory store always cleared regardless of Redis outcome
- [04-01]: Dev/test stub for postRateLimiter: always returns { success: true } when Upstash env vars absent
- [04-02]: Non-author PATCH returns 404 (not 403) — consistent with Phase 3 hidden-content approach, hides existence
- [04-02]: PATCH has no rate limit — editing is not new feed content
- [04-02]: isEdited derived from updated_at !== created_at — no extra column needed
- [04-02]: Edit history GET endpoints are unauthenticated — Memory over Moderation, all edits are public
- [04-02]: 405 DELETE uses Allow: GET, PATCH header — RFC 7231 compliant
- [04-03]: URL-routing fetch mock routes JWKS vs Supabase DB by checking supabase.co without /rest/ — DB calls use /rest/v1/ path
- [04-03]: vi.mock top-level hoisting required for rate limiter mock — must be declared before createApp() call resolves module
- [04-03]: Non-author test: JWT sub overrides accounts API id field in requireAuth — signToken('user-uuid-2') sets req.user.id regardless of accounts API body
- [04.5-01]: description is nullable TEXT (not NOT NULL) — shared inform schema may have rows from other products; enforce non-null via seed data, not schema constraint
- [04.5-01]: example_perspectives is TEXT[] NOT NULL DEFAULT '{}' — empty array is a safe default for unauthored rows
- [04.5-01]: RPC connect.get_stances_for_community required DROP + CREATE (not CREATE OR REPLACE) — PostgreSQL cannot change RETURNS TABLE column list in place
- [04.5-02]: description maps to empty string fallback (?? ''), examplePerspectives to empty array (?? []) — API never returns null to frontend consumers
- [05-01]: Tailwind v4 needs no tailwind.config.js — @tailwindcss/vite plugin handles all config; index.css has only @import "tailwindcss"
- [05-01]: VITE_API_BASE_URL defaults to empty string — relative /api/* paths use Vite proxy in dev; set to absolute URL in production
- [05-01]: vite-env.d.ts not generated by Vite 9 template — covered by "types": ["vite/client"] in tsconfig.app.json; no manual creation needed
- [05-01]: Provider nesting order: QueryClientProvider > BrowserRouter > AuthProvider > ErrorBoundary — QueryClient outside router so queries survive navigation

### Roadmap Evolution

- Phase 4.5 inserted after Phase 4 (2026-04-16): Stance Content Enrichment — extend inform.compass_stances with description + example_perspectives fields, author content for all stances before Phase 5 frontend renders them (URGENT — frontend StanceCard depends on this data)

### Pending Todos

None yet.

### Blockers/Concerns

- [Pre-Phase 5]: Framer + Express auth token flow is unverified — how Framer production frontend passes Supabase JWT to Express write endpoints needs research before Phase 5 planning. Flag: run /gsd:research-phase before planning Phase 5 (after Phase 4.5 completes).
- [Pre-Phase 3]: RESOLVED — inform.compass_stances confirmed to exist with columns: id, topic_id, value, text. Cross-schema join via SECURITY DEFINER RPC is functional.

## Session Continuity

Last session: 2026-04-17T02:08:00Z
Stopped at: Completed 05-01 — frontend/ Vite/React app scaffolded, Tailwind v4 configured, provider stack wired, shared types created, auth primitives migrated, placeholder pages for all routes, backend by-slug route added. Build: green.
Resume file: None
