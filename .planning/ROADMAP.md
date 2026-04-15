# Roadmap: Focused Communities

## Overview

Focused Communities is a civic deliberation platform giving every Empowered Compass topic a dedicated hub with five preset stance positions and an open forum. The build is strictly layered — schema correctness first, auth second, read API third, write API fourth, frontend fifth, external wiring last — because the RLS policies and memory-over-moderation schema have interdependencies that are cheap to get right and expensive to retrofit.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation + Schema** - Repo, Supabase schema, RLS policies, and edit history tables wired correctly from day one
- [ ] **Phase 2: Auth Infrastructure** - Connected Account middleware and two-client auth pattern established before any write routes
- [ ] **Phase 3: Read API + Cache** - All read paths live and tested against real data; Redis cache layer operational
- [ ] **Phase 4: Write API + Rate Limiting** - Thread/reply creation and editing with atomic history and brigading protection
- [ ] **Phase 5: Frontend UI** - Full UI built against stable /api/* contracts; all v1 surfaces in Framer-compatible components
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
  2. An authenticated request from a user without a connected_profiles record is rejected with a clear error (not granted write access)
  3. The service role key is present only on the backend; the browser Supabase client uses only the publishable (anon) key for auth sign-in/out
  4. A valid JWT from Supabase Auth is verified on the backend via getUser() (not local decode) on every authenticated request, detecting revoked sessions
**Plans**: TBD

Plans:
- [ ] 02-01: Backend auth middleware (JWT -> getUser() -> connected_profiles lookup) and requireConnectedAccount guard
- [ ] 02-02: Frontend Supabase auth client (publishable key, sign-in/out only) and typed fetch wrapper for /api/*

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
**Plans**: TBD

Plans:
- [ ] 03-01: Upstash Redis client with in-memory fallback and cache middleware (per-route TTL configuration)
- [ ] 03-02: GET /api/communities and GET /api/communities/:id (with search/filter support and slice-aware listing)
- [ ] 03-03: GET /api/communities/:id/stances (join to inform.*) and GET /api/communities/:id/threads (cursor-paginated)
- [ ] 03-04: GET /api/threads/:id and GET /api/threads/:id/posts (flat replies); verify anon RLS end-to-end

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
**Plans**: TBD

Plans:
- [ ] 04-01: POST /api/communities/:id/threads and POST /api/threads/:id/posts (requireConnectedAccount + display_name snapshot + rate limiting)
- [ ] 04-02: PATCH /api/threads/:id and PATCH /api/posts/:id (author check + atomic transaction writing edit history + body update)
- [ ] 04-03: Cache invalidation wired to all write routes; no-delete enforcement; Upstash sliding window rate limiting

---

### Phase 5: Frontend UI
**Goal**: The complete v1 UI exists as self-contained, Framer-compatible React components using absolute /api/* URLs — every user-facing surface works end-to-end
**Depends on**: Phase 4
**Requirements**: (All frontend-facing behaviors delivered by DIR, HUB, THRD, REPL, EDIT, AUTH read-side)
**Success Criteria** (what must be TRUE):
  1. A visitor can browse the community directory, filter by keyword, click into a community hub, and read the five stance cards — all without signing in
  2. A visitor can navigate from a community hub into its thread list, click a thread, and read all replies — all without signing in
  3. An unauthenticated user who clicks "reply" or "start thread" sees an auth gate (disabled form with tooltip) and is redirected to sign-in — not a broken UI
  4. A Connected Account can create a thread or reply, then immediately see it appear in the list with their pseudonym and timestamp
  5. A Connected Account can edit their own post, see the "edited" indicator, and expand the full version history — all edits visible publicly
**Plans**: TBD

Plans:
- [ ] 05-01: DirectoryPage with search/filter and CommunityPage with StanceCard components (no party labels, numerical 1-5 positions)
- [ ] 05-02: ThreadListPage with useInfiniteQuery cursor pagination and refetch polling; ThreadPage with flat reply list
- [ ] 05-03: PostForm with auth gate UI; edit form with history display (edited indicator + expandable version diff)
- [ ] 05-04: Session management (expiry detection, localStorage draft preservation, URL-based scroll position tracking)

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
**Plans**: TBD

Plans:
- [ ] 06-01: GET /api/users/:id/posts (profile post history API) and Profile page UI (pseudonym display, community thread links)
- [ ] 06-02: Compass spoke -> hub URL wiring; Civic Spaces nav link; profile page community participation links
- [ ] 06-03: Production deployment checklist (Cache-Control headers, bundle scan, RLS anon/authenticated verification, rate limit 429 test in staging, UptimeRobot setup)

---

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation + Schema | 3/3 | Complete | 2026-04-15 |
| 2. Auth Infrastructure | 0/2 | Not started | - |
| 3. Read API + Cache | 0/4 | Not started | - |
| 4. Write API + Rate Limiting | 0/3 | Not started | - |
| 5. Frontend UI | 0/4 | Not started | - |
| 6. Entry Points + Deployment | 0/3 | Not started | - |
