# Roadmap: Focused Communities

## Overview

Focused Communities is a civic deliberation platform giving every Empowered Compass topic a dedicated hub with five preset stance positions and an open forum. The build is strictly layered — schema correctness first, auth second, read API third, write API fourth, frontend fifth, external wiring last — because the RLS policies and memory-over-moderation schema have interdependencies that are cheap to get right and expensive to retrofit.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation + Schema** - Repo, Supabase schema, RLS policies, and edit history tables wired correctly from day one
- [x] **Phase 2: Auth Infrastructure** - JWKS-based JWT verification, accounts API tier lookup, frontend token lifecycle, and typed fetch wrapper
- [x] **Phase 3: Read API + Cache** - All read paths live and tested against real data; Redis cache layer operational
- [x] **Phase 4: Write API + Rate Limiting** - Thread/reply creation and editing with atomic history and brigading protection
- [x] **Phase 4.5: Stance Content Enrichment** (INSERTED) - Extend inform.compass_stances with description and example perspectives fields; author content for all stances before frontend renders them
- [x] **Phase 5: Frontend UI** - Standalone React/Vite app with all v1 surfaces working end-to-end against /api/* contracts
- [ ] **Phase 6: Entry Points + Deployment** - Profile history, external wiring (Compass, Civic Spaces, Profile), and production deployment checklist

## Phase Details

### Phase 1: Foundation + Schema
**Goal**: The database is correct, complete, and secure — all tables, RLS policies, indexes, and edit history structures exist before any application code is written
**Depends on**: Nothing (first phase)
**Requirements**: INFRA-01, INFRA-02, INFRA-03, INFRA-04, INFRA-05, INFRA-06
**Success Criteria** (what must be TRUE):
  1. GET /api/health returns `{ status: 'ok', timestamp: Date.now() }` and all /api/* routes exist at the correct prefix
  2. The connect.* schema contains communities, threads, posts, thread_edits, post_edits tables with moderation_status enum (not deleted_at) in all USING clauses — soft-hide works without RLS deadlock
  3. Every RLS policy on INSERT and UPDATE has a WITH CHECK clause; every policy column (author_id, community_id, thread_id) has an index in the same migration
  4. GRANT USAGE ON SCHEMA connect TO anon, authenticated is applied; anon role can SELECT from published_posts and published_replies views (security_invoker = true)
  5. All schema changes exist as Supabase CLI migration files — no manual console changes; supabase db push applies cleanly to a fresh project
**Plans**: 3 plans

Plans:
- [x] 01-01-PLAN.md — Repo scaffold, Express skeleton with /api/health, Supabase CLI init, Redis cache module
- [x] 01-02-PLAN.md — connect.* schema migration: tables, enum, triggers, edit history, connected_profiles
- [x] 01-03-PLAN.md — RLS policies (WITH CHECK on every INSERT/UPDATE), schema grants, indexes, security-invoker views

---

### Phase 2: Auth Infrastructure
**Goal**: The system correctly identifies Connected Accounts and enforces read-open / write-gated access at both the API and database layers before any write routes exist
**Depends on**: Phase 1
**Requirements**: AUTH-01, AUTH-02, AUTH-03
**Success Criteria** (what must be TRUE):
  1. An unauthenticated request to any write endpoint returns 401; the frontend redirects the user to sign-in
  2. An authenticated Connected Account is correctly identified and permitted to write
  3. A suspended account is rejected with `{ reason: 'suspended' }` in the 403 body
  4. JWT is verified via JWKS (ES256) + accounts API call (`/api/account/me`) — both checks required for writes
**Plans**: 3 plans

Plans:
- [x] 02-01-PLAN.md — Backend auth middleware: JWKS singleton, requireAuth/optionalAuth, tierGuards with suspended detection
- [x] 02-02-PLAN.md — Auth middleware test suite: mock-jwks/vitest tests proving all 401/403 scenarios
- [x] 02-03-PLAN.md — Frontend auth primitives: AuthContext with token lifecycle, apiFetch with new-tab 401, AuthGate component

---

### Phase 3: Read API + Cache
**Goal**: All read paths are live, tested with real data, and cached — anyone can browse communities, read stances, and read threads without authentication
**Depends on**: Phase 2
**Requirements**: DIR-01, DIR-02, DIR-03, DIR-04, DIR-05, HUB-01, HUB-02, HUB-03, HUB-04, HUB-05, THRD-01, THRD-02, THRD-05, REPL-01, REPL-03
**Success Criteria** (what must be TRUE):
  1. An unauthenticated user can retrieve a paginated community list (cursor-based, not OFFSET) with topic description, member count, and slice info for any sharded topics
  2. An unauthenticated user can retrieve a community hub page including five stance cards joined from inform.* — no party labels, no auth required
  3. An unauthenticated user can retrieve a thread list for any community (cursor-paginated, newest first) showing title, excerpt, author pseudonym, reply count, and timestamp
  4. An unauthenticated user can retrieve all replies in a thread (flat, chronological) showing author pseudonym and timestamp
  5. Community lists are cached for 5 minutes, stance data for 30 minutes, and thread lists for 30 seconds; in-memory Map fallback is active when Redis is unavailable
**Plans**: 4 plans

Plans:
- [x] 03-01-PLAN.md — Schema gap migrations (slice_label, last_activity_at, supporting_points) + cache middleware factory + shared utils + app.ts route wiring
- [x] 03-02-PLAN.md — GET /api/communities and GET /api/communities/:id (search, filter, cursor pagination, slice-aware listing)
- [x] 03-03-PLAN.md — GET /api/communities/:id/stances (RPC join to inform.*) and GET /api/communities/:id/threads (cursor-paginated with excerpts)
- [x] 03-04-PLAN.md — GET /api/threads/:id and GET /api/threads/:id/posts (flat replies); end-to-end verification of all read endpoints

---

### Phase 4: Write API + Rate Limiting
**Goal**: Connected Accounts can create threads, post replies, and edit their content — every write is rate-limited, every edit is atomically versioned, and no content can be deleted
**Depends on**: Phase 3
**Requirements**: THRD-03, THRD-04, REPL-02, EDIT-01, EDIT-02, EDIT-03, EDIT-04
**Success Criteria** (what must be TRUE):
  1. A Connected Account can create a new thread in a community; the thread records their display_name as a snapshot at post time (not a live FK), surviving future profile name changes
  2. A Connected Account can reply to an existing thread; reply is visible immediately in the flat chronological list
  3. A Connected Account can edit their own thread or reply; the edit atomically writes to post_edits/thread_edits AND updates the posts/threads body in a single transaction — no partial state possible
  4. Edited posts display a visible "edited" indicator; the full version history is publicly retrievable
  5. Posts cannot be deleted by users; the API rejects DELETE requests; only moderation_status can be changed (and only by moderators in v2+)
  6. Post creation is rate-limited to 5 posts/hour per user_id via Upstash Redis sliding window; a 429 is returned with Retry-After when exceeded
**Plans**: 3 plans

Plans:
- [x] 04-01-PLAN.md — POST /api/communities/:id/threads and POST /api/threads/:id/posts with rate limiting, cache invalidation, display_name snapshot
- [x] 04-02-PLAN.md — PATCH /api/threads/:id and PATCH /api/posts/:id with ownership check, edit history endpoints, DELETE rejection, isEdited on reads
- [x] 04-03-PLAN.md — Integration tests for all write endpoints (POST, PATCH, DELETE, edit history, isEdited)

---

### Phase 4.5: Stance Content Enrichment (INSERTED)
**Goal**: The inform.compass_stances table is extended with description and example_perspectives fields, and all stance rows are authored with real content — so the frontend has rich stance data to display before Phase 5 begins
**Depends on**: Phase 4
**Requirements**: (Content prerequisite for Phase 5 StanceCard components)
**Success Criteria** (what must be TRUE):
  1. inform.compass_stances has a non-null description column (short narrative, 2-4 sentences) and an example_perspectives column (array or JSONB) on every row
  2. The GET /api/communities/:id/stances endpoint returns description and example_perspectives in each stance object
  3. All five stance rows for every seeded topic have authored description and example_perspectives content — no nulls in production data
  4. Migration applies cleanly via MCP apply_migration; no manual console changes
**Plans**: 2 plans

Plans:
- [x] 04.5-01-PLAN.md — Schema migration: ADD COLUMN (description, example_perspectives), RPC function replacement, authored seed content for all stance rows
- [x] 04.5-02-PLAN.md — Route update: stances.ts response map extension + test assertions for new fields

---

### Phase 5: Frontend UI
**Goal**: The complete v1 UI exists as a standalone React/Vite app using absolute /api/* URLs — every user-facing surface works end-to-end
**Depends on**: Phase 4
**Requirements**: (All frontend-facing behaviors delivered by DIR, HUB, THRD, REPL, EDIT, AUTH read-side)
**Success Criteria** (what must be TRUE):
  1. A visitor can browse the community directory, filter by keyword, click into a community hub, and read the five stance cards — all without signing in
  2. A visitor can navigate from a community hub into its thread list, click a thread, and read all replies — all without signing in
  3. An unauthenticated user who clicks "reply" or "start thread" sees an auth gate (disabled form with tooltip) and is redirected to sign-in — not a broken UI
  4. A Connected Account can create a thread or reply, then immediately see it appear in the list with their pseudonym and timestamp
  5. A Connected Account can edit their own post, see the "edited" indicator, and expand the full version history — all edits visible publicly
**Plans**: 5 plans

Plans:
- [x] 05-01-PLAN.md — App scaffold + Vite config + Tailwind v4 + provider stack + route tree + migrated primitives + shared types + backend slug route
- [x] 05-02-PLAN.md — DirectoryPage with keyword filter + CommunityHubPage with expandable StanceCards (randomized, no position numbers)
- [x] 05-03-PLAN.md — Thread list on hub with cursor pagination and 30s polling + ThreadPage with flat reply list
- [x] 05-04-PLAN.md — Write forms: thread creation + reply with auth gate, optimistic updates, character counters, toast errors
- [x] 05-05-PLAN.md — Inline edit forms + expandable edit history + localStorage draft preservation

---

### Phase 6: Entry Points + Deployment
**Goal**: The site is reachable from all external entry points, user post history is accessible from their profile, and the system passes the full production deployment checklist
**Depends on**: Phase 5
**Requirements**: PROF-01, PROF-02, PROF-03, ENTR-01, ENTR-02, ENTR-03, ENTR-04
**Success Criteria** (what must be TRUE):
  1. Tapping a spoke on the Empowered Compass opens that topic's community hub at its stable, shareable URL
  2. The Current Civic Spaces site displays a working nav link to the Focused Communities directory
  3. A user's profile page shows their post history across all communities, with each post linking back to its originating thread; the pseudonym (never legal name) is displayed throughout
  4. All API responses that touch auth have Cache-Control: private, no-store — CDN session token leakage is impossible
  5. UptimeRobot or equivalent monitors /api/health; the service role key is absent from all client-side bundles (verified by bundle scan)
**Plans**: 3 plans

Plans:
- [x] 06-01-PLAN.md — Post history API (GET /api/users/:id/posts), shared Header with "Your activity" link, Accounts handoff spec
- [x] 06-02-PLAN.md — Compass integration spec (topic-to-slug mapping), Civic Spaces nav spec, EV Post History Standard
- [ ] 06-03-PLAN.md — Production deployment checklist (Cache-Control headers, bundle scan, RLS verification, health monitoring)

---

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation + Schema | 3/3 | Complete | 2026-04-15 |
| 2. Auth Infrastructure | 3/3 | Complete | 2026-04-15 |
| 3. Read API + Cache | 4/4 | Complete | 2026-04-16 |
| 4. Write API + Rate Limiting | 3/3 | Complete | 2026-04-16 |
| 4.5. Stance Content Enrichment (INSERTED) | 2/2 | Complete | 2026-04-16 |
| 5. Frontend UI | 5/5 | Complete | 2026-04-17 |
| 6. Entry Points + Deployment | 2/3 | In progress | - |
