# Project Research Summary

**Project:** Focused Communities
**Domain:** Civic deliberation forum -- structured discussion hubs tied to Empowered Compass topics
**Researched:** 2026-04-15
**Confidence:** HIGH

## Executive Summary

Focused Communities is a civic deliberation platform where each hub maps to one Empowered Compass topic and contains two fixed surfaces: five preset stance cards (policy positions in neutral language) and an open forum (read by anyone, posted to only by Connected Accounts). Experts build this type of platform on a shallow thread-reply model (threads + flat replies, no deep nesting), with read-open / write-gated access enforced at both the application layer and the database layer via Supabase RLS. The full mandated stack -- Supabase, Express/TypeScript on Render, Upstash Redis, React/Tailwind/Vite (dev) / Framer (prod) -- is well-suited to this domain and validated against current stable versions.

The recommended approach is a strictly layered build: schema and RLS first, auth middleware second, read API third, write API fourth, Redis cache fifth, frontend last. This ordering is non-negotiable because the RLS policies and soft-delete patterns have subtle interdependencies that become expensive to retrofit. The memory-over-moderation design principle (no hard deletes, all edits versioned and public) must be baked into the schema from day one -- specifically using a moderation_status column rather than deleted_at in RLS USING clauses, and post_edits/thread_edits history tables created before any write paths are implemented.

The primary risks are: (1) RLS misconfiguration -- missing WITH CHECK on INSERT/UPDATE policies is the most common Supabase security failure and trivial to miss; (2) the soft-delete + RLS deadlock, where deleted_at IS NULL in a USING clause breaks UPDATE operations entirely (documented Supabase bug #1941); and (3) anti-pattern drift -- the platform value proposition depends on deliberate exclusions (no downvotes, no algorithmic sort, no real-name display, no user-delete) that must be treated as hard constraints, not optional cuts. Both the schema and the feature set are intentionally simple; implementation risk is almost entirely in getting the foundational wiring right.

---

## Key Findings

### Recommended Stack

The mandated stack is validated and well-matched to the domain. All core packages are at current stable versions: @supabase/supabase-js 2.99.3, @tanstack/react-query 5.99.0, Tailwind CSS v4, @upstash/ratelimit 2.0.8. Node.js 20+ is required (supabase-js dropped Node 18 at 2.79.0). Zod v3 is the right choice now -- Zod v4 released August 2025 but ecosystem adapters (drizzle-zod, etc.) are not yet stable; plan migration in ~Q3 2026. Tailwind v4 is a breaking change from v3 -- no tailwind.config.js, CSS-based @theme directive, @tailwindcss/vite plugin required. For Realtime, use Broadcast (not postgres_changes) if/when Realtime is ever added -- but for v1, skip Realtime entirely and use polling via refetchInterval.

**Core technologies:**
- **Supabase (managed, @supabase/supabase-js ^2.99):** PostgreSQL + Auth + RLS -- service role key on backend only; publishable key in browser for auth sign-in/out only
- **Express/TypeScript ^4.x (Render):** All business logic, auth enforcement, rate limiting, cache; all data mutations through /api/*; never expose service role key to any client
- **Upstash Redis (@upstash/ratelimit ^2.0.8):** Sliding window rate limiting on post creation; cache-aside for thread/community lists with in-memory Map fallback when Redis unavailable
- **React 19 + TanStack Query v5 (@tanstack/react-query ^5.99):** useInfiniteQuery for cursor-paginated thread lists; invalidateQueries on write; optimistic mutation with rollback
- **Tailwind CSS v4 + Vite v6:** Dev environment; Framer production consumes built React components -- all components must be self-contained with no direct Supabase data calls
- **Zod v3:** Request body validation with TypeScript type inference; use v3 now, migrate to v4 when ecosystem adapters stabilize (~Q3 2026)
- **date-fns v3:** Post timestamps -- tree-shakeable, Moment.js replacement

**Critical version constraints:**
- Node.js 20+ required (supabase-js dropped Node 18 at 2.79.0)
- Tailwind v4: do NOT follow v3 setup guides; no tailwind.config.js; use @tailwindcss/vite plugin
- Supabase Realtime: skip entirely in v1; use React Query polling; if added later use Broadcast not postgres_changes
- Pagination: keyset/cursor only -- OFFSET degrades linearly and must never be used for forum content

### Expected Features

The feature set is intentionally constrained. The platform differentiation is not in feature volume but in deliberate exclusions and principled design. No other reference platform combines authenticated pseudonymity + full public edit history + chronological-only sort + anti-partisan preset positions.

**Must have for launch (v1 P1):**
- Community directory -- list of all hubs, one per Compass topic
- Hub page -- 5 stance cards (preset policy positions, neutral language, no party labels ever) + forum entry point
- Thread list -- read-open, chronological, cursor-paginated
- Thread creation -- title + body, requires Connected Account
- Thread view -- full post + flat replies, chronological
- Reply to thread -- flat model (no deep nesting), requires Connected Account
- Edit with versioned history -- all edits logged to thread_edits/post_edits tables, history publicly visible with diff
- Pseudonymous identity -- display_name from Connected Account, snapshot at post time, never email or UUID
- Entry points -- Compass spoke link (with stance pre-selection), Civic Spaces nav, user Profile page
- No user delete capability -- deleted_at audit metadata only; moderation_status column controls visibility

**Should have -- add after validation (v1.x P2):**
- @mention notifications -- when user base makes mentions meaningful
- Thread search -- when thread volume makes discovery difficult
- Stance-aware thread tagging -- poster stance card position shown on post
- Report/flag for moderation -- before significant user volume

**Defer to v2+ (P3):**
- Badges, Symposiums, Argument maps (Kialo-style), Veracity Rating integration, Maturity tiers, AI moderation assistant

**Hard exclusions -- deliberate anti-features, not scope cuts:**
- Downvotes / dislike buttons -- suppresses minority viewpoints; use reply as disagreement mechanism
- Karma / reputation score -- users optimize for score not argument; dominant views accumulate voting power
- Algorithmic feed or Hot sort -- core engagement-bait mechanism; chronological only
- Post deletion by users -- context-washing; destroys accountability; violates Memory over Moderation
- Silent editing -- stealth position changes after replies; trust collapse; all edits must be versioned and public
- Anonymous posting -- disposable anonymity produces worst discourse quality per research
- Party/ideology labels on stance cards -- triggers tribal heuristics; policy substance text only
- Real-name display -- chilling effect; stable pseudonym produces better discourse quality per research
- Private messaging / DMs -- harassment vector; removes transparency; all discourse must be public
- Infinite scroll -- paginated thread list with URL-based position tracking instead
- Share-to-social buttons -- strips context; invites brigading from engagement-optimized platforms

### Architecture Approach

The architecture is a strict three-tier system: React/Framer frontend -> Express API (Render) -> Supabase (PostgreSQL + Auth). All data fetching routes through /api/* on Express -- the frontend never queries Supabase directly for forum data. The Supabase JS client in the browser is used only for supabase.auth.signIn() and supabase.auth.signOut(). The backend holds the service role key (bypasses RLS -- backend enforces authz manually via requireConnectedAccount middleware). Forum data lives in a connect.* schema; Compass topics and stances live in an existing inform.* schema (read-only from this app). Redis is cache-aside with TTL-based invalidation on writes and in-memory Map fallback.

**Major components:**
1. **React frontend (Vite dev / Framer prod)** -- UI rendering, form state, auth token management; Supabase JS publishable key for auth only; all data via typed fetch wrapper to /api/*
2. **Express API (Render)** -- auth middleware (JWT -> getUser() -> connected_profiles lookup), route handlers, Redis cache layer, rate limiting; single source of business logic
3. **Supabase Auth** -- JWT issuance, session management; getUser(token) on every authenticated request (authoritative -- detects revoked sessions; local JWT decode is insufficient per official docs)
4. **PostgreSQL connect.* schema** -- communities, threads, posts, post_edits, thread_edits; RLS on all tables; moderation_status column (published | hidden | removed) controls SELECT policy visibility; deleted_at is audit metadata only, never in USING clauses
5. **PostgreSQL inform.* schema** -- existing compass_topics and compass_stances; read-only via FK join; no writes from this app
6. **Upstash Redis** -- cache-aside (communities 5 min TTL, stances 30 min, thread lists 30 sec); sliding window rate limiting; in-memory Map fallback

**Key patterns to follow:**
- (SELECT auth.uid()) not bare auth.uid() in all RLS policy expressions -- Postgres caches per statement not per row; 99%+ performance improvement per Supabase official docs
- SECURITY DEFINER function connect.has_connected_profile() for Connected Account check in INSERT policies -- prevents RLS recursion on connected_profiles table
- post_edits and thread_edits tables created in foundation migration -- adding retroactively creates a trust gap (all prior posts have no history)
- Published content views (published_posts, published_replies) with security_invoker = true -- all read API paths target views, not raw tables; only moderation paths use raw tables
- Keyset pagination on created_at -- OFFSET must never be used

**Anti-patterns to avoid:**
- Frontend querying Supabase directly for forum data -- bypasses cache, rate limiting, auth enforcement; breaks Framer production (no Supabase client in Framer)
- Service role key anywhere client-side -- complete database compromise, bypasses all RLS
- Hard deletes on forum content -- violates Memory over Moderation; use UPDATE ... SET deleted_at = now()
- Bare auth.uid() in RLS policy expressions -- evaluated per row not per statement; severe performance impact at scale
- Manual schema changes on production Supabase console -- all changes via migration files applied with supabase db push

### Critical Pitfalls

1. **RLS WITH CHECK omission** -- Every INSERT policy needs WITH CHECK (author_id = ...), every UPDATE needs both USING and WITH CHECK. Omitting WITH CHECK lets users insert/update rows attributed to others. The Supabase SQL Editor runs as superuser and bypasses RLS -- use the RLS Tester tool or explicit role-setting in test queries. Grep every migration for FOR INSERT and FOR UPDATE -- each must have WITH CHECK. Phase: schema/foundation.

2. **Soft-delete + RLS deadlock** -- USING (deleted_at IS NULL) in a SELECT policy causes UPDATE operations that set deleted_at to fail with 403 (documented bug #1941 -- row becomes invisible to the UPDATE internal SELECT mid-operation). Prevention: never use deleted_at in a USING clause; use moderation_status column in SELECT policies; deleted_at is audit metadata only. Phase: schema/foundation.

3. **Missing indexes on RLS policy columns** -- Every column in USING or WITH CHECK requires an index; unindexed policy columns cause full sequential scans on every read. posts.author_id, posts.community_id, replies.post_id, replies.author_id must be indexed in the same migration that creates policies. Phase: schema/foundation.

4. **Supabase Realtime dropping at ~30 minutes** -- postgres_changes subscriptions drop after ~30 minutes in production; no reconnection handling in basic implementation. For v1, skip Realtime entirely and use React Query refetchInterval polling -- simpler, predictable, no WebSocket management bugs. If Realtime added later, use Broadcast with exponential backoff reconnection. Phase: forum UI (document polling decision explicitly).

5. **Throwaway account brigading** -- Without friction on Connected Account creation, bad actors create many accounts to brigade threads. Prevention from day one: Upstash Redis sliding window rate limiting on post endpoints (5 posts/hour per user_id); 24-hour account age gate before posting; IP + email-domain rate limiting on account creation. Harder to retrofit than build in. Phase: forum write API.

---

## Implications for Roadmap

Based on combined research, the build order is well-defined by hard dependencies. Six phases are recommended.

### Phase 1: Foundation + Schema

**Rationale:** RLS policies, moderation_status column, and edit history tables cannot be retrofitted without data integrity gaps. The three schema-level pitfalls are cheap to prevent and expensive to fix.

**Delivers:** Repo scaffold; Supabase project connected; connect.* schema with all five tables, all indexes, all RLS policies (WITH CHECK on every INSERT/UPDATE), moderation_status column, schema grants, published_posts/published_replies views with security_invoker = true; database.types.ts committed; Express skeleton with /api/health.

**Features addressed:** Hub structure (communities table), thread + post data model, edit history storage from day one, Memory over Moderation at schema level.

**Pitfalls avoided:** RLS WITH CHECK omission; soft-delete + RLS deadlock; missing indexes on policy columns; soft-delete leaking into queries.

**Research flag:** Standard patterns -- well-documented in Supabase official docs. Skip /gsd:research-phase. Resolve display_name snapshot strategy (trigger vs. application layer) during this phase; trigger approach is more robust.

---

### Phase 2: Auth Infrastructure

**Rationale:** Connected Account is the hard prerequisite for every write action. Auth middleware must be correct before write routes are built.

**Delivers:** authMiddleware (JWT -> getUser() -> connected_profiles lookup) and requireConnectedAccount guard; service role client on backend (never browser); frontend publishable key auth client (sign-in/out only); typed fetch wrapper for /api/*; integration tests for all four access scenarios.

**Features addressed:** Read-open / write-gated access model; pseudonymous identity enforcement.

**Pitfalls avoided:** Read-open / write-gated misimplemented; display name leaking real identity; service role key leaking to browser.

**Research flag:** Standard patterns. Skip /gsd:research-phase.

---

### Phase 3: Read API + Redis Cache

**Rationale:** Read routes can be built and tested before any write paths exist. Surfaces RLS anon-role issues early. Establishes cache layer before writes add invalidation complexity.

**Delivers:** GET /api/communities (cached 5 min), GET /api/communities/:id, GET /api/communities/:id/stances (join to inform.*, cached 30 min), GET /api/communities/:id/threads (cursor-paginated, cached 30 sec), GET /api/threads/:id/posts; Upstash Redis client with in-memory Map fallback; cache middleware with per-route TTL configuration; anon read verified.

**Features addressed:** Community directory, hub page stance cards, thread list (read-open), thread view.

**Pitfalls avoided:** OFFSET pagination (keyset only from start); N+1 queries on thread listing (reply count aggregated); eager-loading full reply bodies in list endpoint.

**Research flag:** Standard patterns. Skip /gsd:research-phase. Action item: confirm connect.communities can reference inform.compass_topics via FK in this Supabase project -- verify during Phase 3 implementation.

---

### Phase 4: Write API + Rate Limiting

**Rationale:** Write routes depend on working auth (Phase 2) and established schema (Phase 1). Rate limiting must be added simultaneously with write routes -- not retrofitted. Edit flow requires an atomic transaction.

**Delivers:** POST /api/communities/:id/threads (requireConnectedAccount + rate limit + display_name snapshot); POST /api/threads/:id/posts (same); PATCH /api/posts/:id (author check + post_edits INSERT + posts UPDATE in transaction); PATCH /api/threads/:id (same pattern); cache invalidation wired to all writes; Upstash Redis sliding window rate limiting (5 posts/hour, 20 replies/hour per user_id); 24-hour account age gate enforced.

**Features addressed:** Thread creation, reply to thread, edit with versioned history, no user-delete enforcement.

**Pitfalls avoided:** Throwaway account brigading (rate limiting + age gate from day one); edit history missing (transactional write); optimistic UI without rollback.

**Research flag:** Needs /gsd:research-phase for: (1) display_name snapshot -- trigger vs. application layer; (2) Supabase transaction pattern for atomically inserting edit history + updating post body in a single Express route handler.

---

### Phase 5: Frontend UI

**Rationale:** With schema, auth, read API, write API, and cache all working, the frontend can be built against stable contracts. Framer production constraint means all components must be self-contained and use /api/* exclusively.

**Delivers:** DirectoryPage, CommunityPage (5 StanceCard components + ThreadList), ThreadPage (ThreadView + PostForm + edit history display); StanceCard component (policy substance text only, numerical 1-5 labels, no party labels ever); ThreadList with useInfiniteQuery cursor pagination and refetch polling (no Realtime); PostForm with auth gate UI (disabled with tooltip for unauthenticated users); edit history UI (edited indicator + expandable version diff); session expiry detection with localStorage draft preservation; URL-based scroll position tracking; no vote buttons, no engagement metrics, no share-to-social.

**Features addressed:** All v1 P1 features; Compass spoke entry point with stance pre-selection; anti-partisan UX constraints throughout.

**Pitfalls avoided:** Partisan attribution in UI; display name leaking real identity; silent auth expiry mid-posting; anonymous-looking write-gate; infinite scroll without position restoration; Realtime connection management (polling used instead).

**Research flag:** Needs /gsd:research-phase for Framer + Express auth token flow. How the Framer production frontend passes the Supabase JWT to Express write endpoints is not documented for this specific architecture. Confirm pattern before Phase 5 begins. This is the highest-risk unknown in the project.

---

### Phase 6: Entry Points + Deployment

**Rationale:** Wire the external entry points and run the full production deployment checklist before launch.

**Delivers:** Compass spoke link -> hub page URL with stance pre-selection query param; Civic Spaces nav link to community directory; Profile page link to user forum post history; Cache-Control: private, no-store on all API responses; production deployment checklist (service role key absent from client bundles, RLS verified for anon + authenticated roles, rate limiting verified with 429 test in staging, edit history transaction verified).

**Features addressed:** Compass integration entry point (full user journey); user post history in Profile.

**Pitfalls avoided:** CDN caching session tokens (Cache-Control headers); service role key in client bundle (final bundle scan).

**Research flag:** Standard deployment patterns. Skip /gsd:research-phase.

---

### Phase Ordering Rationale

- **Schema before everything:** The three schema-phase pitfalls are cheap to prevent and expensive to fix. Edit history tables and moderation_status column create irrecoverable trust gaps if added retroactively. Highest-leverage phase.
- **Auth before writes:** Write routes require requireConnectedAccount, which depends on the auth middleware connected_profiles lookup. Building writes without working auth requires a full rewrite.
- **Reads before writes:** Read API + cache tested end-to-end with real data before write paths exist. Surfaces RLS anon-role issues early.
- **Rate limiting with writes, not after:** Brigading protection is tempting to defer. Must be in Phase 4 alongside write routes -- adding it after a brigading incident damages early user trust.
- **Frontend last:** Building UI against stable /api/* contracts produces working screens in one pass. Framer component-paste production model makes incremental UI development harder anyway.
- **Deployment last:** Entry points depend on all surfaces existing; deployment checklist depends on the full system being built.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Core stack mandated; all library versions verified against npm and official docs; Tailwind v4, Zod v3/v4, Realtime Broadcast recommendations from primary official sources |
| Features | HIGH (table stakes/anti-features), MEDIUM (differentiators) | Table stakes and anti-features cross-validated against academic research, platform post-mortems, and multiple platforms; civic-specific differentiators are newer patterns with strong internal rationale but less external validation |
| Architecture | HIGH | Core patterns (RLS policy structure, custom schema grants, auth middleware, cache-aside with TTLs) verified against Supabase official docs; build order derived from hard dependency graph |
| Pitfalls | HIGH (RLS/Supabase), MEDIUM (civic design) | RLS pitfalls from official docs + real-world security research (170+ exposed apps); Realtime 30-min drop and brigading patterns from community reports only -- test in staging |

**Overall confidence:** HIGH

### Gaps to Address

- **Framer + Express auth token flow (Phase 5):** How the Framer production frontend passes the Supabase JWT to Express write endpoints is not documented for this specific architecture. The assumed pattern (JWT in localStorage, sent as Authorization: Bearer header in fetch calls from Framer-hosted React components) needs confirmation. Flag for /gsd:research-phase before Phase 5 planning begins. This is the highest-risk unknown in the project.

- **inform.* cross-schema FK access (Phase 3):** Verify that connect.communities can reference inform.compass_topics via FK and that connect schema queries can JOIN to inform.*. Confirm during Phase 3 implementation -- if it fails, use a denormalized topic_id UUID with no FK constraint.

- **Display name snapshot strategy (Phase 1):** Schema must store display_name at post time (not a live FK to connected_profiles.display_name, which can change). Two options: application layer sets it on INSERT (simpler, possible to miss in future routes), or a Postgres AFTER INSERT trigger copies it (safer, enforced at DB level). Decide in Phase 1 before any write routes are built. Trigger approach is recommended.

- **Supabase Realtime Broadcast authorization for v2+:** When Realtime is eventually added, it requires private channels + Realtime Authorization (RLS on realtime.messages). Verify the Supabase plan tier supports this feature before scheduling any Realtime work.

- **Zod v4 migration timing:** Zod v4 (August 2025) has 14x faster parsing. Monitor ecosystem adapter stability for upgrade opportunity in Q3 2026. Not urgent; Zod v3 is fully supported and stable.

---

## Sources

### Primary (HIGH confidence)
- Supabase RLS official docs -- https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase Realtime: Broadcast -- https://supabase.com/docs/guides/realtime/broadcast
- Supabase Realtime: Subscribing to DB Changes -- https://supabase.com/docs/guides/realtime/subscribing-to-database-changes
- Supabase Custom Schema docs -- https://supabase.com/docs/guides/api/using-custom-schemas
- Supabase API Keys docs -- https://supabase.com/docs/guides/api/api-keys
- Supabase JWT docs -- https://supabase.com/docs/guides/auth/jwts
- Supabase Auth Sessions docs -- https://supabase.com/docs/guides/auth/sessions
- Supabase Soft Delete Discussion #2799 -- https://github.com/supabase/supabase/discussions/2799
- Supabase Realtime Limits -- https://supabase.com/docs/guides/realtime/limits
- @supabase/supabase-js npm (2.99.3 verified current stable)
- @tanstack/react-query npm (5.99.0 verified current stable)
- @upstash/ratelimit npm (2.0.8 verified current)
- Tailwind CSS v4 blog -- https://tailwindcss.com/blog/tailwindcss-v4
- Stable pseudonyms and discourse quality -- https://theconversation.com/online-anonymity-study-found-stable-pseudonyms-created-a-more-civil-environment-than-real-user-names-171374

### Secondary (MEDIUM confidence)
- Precursor Security: Row-Level Recklessness -- https://www.precursorsecurity.com/blog/row-level-recklessness-testing-supabase-security
- byteiota: 170+ Apps Exposed by Missing RLS -- https://byteiota.com/supabase-security-flaw-170-apps-exposed-by-missing-rls/
- Supabase Soft Delete + RLS bug #1941 -- https://github.com/supabase/supabase-js/issues/1941
- EA Forum: Karma system revisited -- https://forum.effectivealtruism.org/posts/SApmQrKdvgccmH2yF/revisiting-the-karma-system
- ProMarket: Toxic content and engagement divergence -- https://www.promarket.org/2025/07/16/how-toxic-content-drives-user-engagement-on-social-media/
- Kialo Edu features -- https://www.kialo-edu.com/features
- Discourse features -- https://www.discourse.org/features
- Academic study on pseudonymity vs real name in deliberation -- https://journals.sagepub.com/doi/abs/10.1177/0032321719891385
- AppSignal: cursor vs offset pagination -- https://blog.appsignal.com/2024/05/15/understanding-offset-and-cursor-based-pagination-in-nodejs.html

### Tertiary (LOW confidence -- validate before relying on)
- Supabase Realtime ~30-minute drop in production -- multiple community reports, not officially documented; test in staging before deciding
- Account-age gating effectiveness against brigading -- community convention, not empirically validated for this user base

---

*Research completed: 2026-04-15*
*Ready for roadmap: yes*
