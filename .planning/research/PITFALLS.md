# Pitfalls Research

**Domain:** Civic deliberation forum — Supabase/Express/React/Tailwind stack
**Researched:** 2026-04-15
**Confidence:** HIGH (RLS/Supabase pitfalls from official docs + verified community reports), MEDIUM (civic discourse design pitfalls from academic research + platform post-mortems)

---

## Critical Pitfalls

### Pitfall 1: RLS WITH CHECK Omission on INSERT and UPDATE

**What goes wrong:**
INSERT policies without `WITH CHECK` allow users to insert rows with any `user_id` — including someone else's. UPDATE policies without `WITH CHECK` let users change `user_id` to another person's UUID, silently transferring ownership of posts. The `USING` clause controls row visibility; the `WITH CHECK` clause enforces what values the new/modified row may have. Omitting `WITH CHECK` means visibility rules exist but write-content rules do not.

**Why it happens:**
The Supabase Studio policy builder defaults often produce `USING`-only policies. Developers test in the SQL Editor (which runs as the postgres superuser, bypassing all RLS) and see expected results — then ship code that real users discover is broken or exploitable.

**How to avoid:**
- Every INSERT policy needs `WITH CHECK (auth.uid() = user_id)`.
- Every UPDATE policy needs both `USING (auth.uid() = user_id)` AND `WITH CHECK (auth.uid() = user_id)`.
- Never test RLS policies in the Supabase SQL Editor — it bypasses RLS. Use the "Row Level Security Tester" in the dashboard, or write explicit test queries with `SET ROLE authenticated; SET request.jwt.claim.sub = '...'`.
- Code review checklist: every table mutation policy must have both clauses.

**Warning signs:**
- Users can edit or delete each other's posts.
- Inserted rows appear with incorrect `user_id` values.
- No `WITH CHECK` clause found in migration files for any forum table.

**Phase to address:** Database/schema foundation phase (before any forum write paths are built).

---

### Pitfall 2: Soft Delete + RLS Deadlock on UPDATE

**What goes wrong:**
A `SELECT` policy like `USING (deleted_at IS NULL)` hides soft-deleted rows, but UPDATE operations perform an internal SELECT to locate target rows before applying changes. If you soft-delete a post by setting `deleted_at = now()`, the row becomes invisible to the UPDATE policy's `USING` check — the update that sets `deleted_at` fails because the row is already "not visible" at the moment the policy re-evaluates the post-update state. This is an official Supabase-documented bug pattern (GitHub Issue #1941).

**Why it happens:**
PostgreSQL UPDATE internally runs: SELECT (find rows) → apply changes → WITH CHECK (validate result). Filtering soft-deleted rows from SELECT makes the row disappear mid-update cycle.

**How to avoid:**
Use a separate `moderation_status` enum column (`published | hidden | removed`) rather than basing SELECT policies on `deleted_at`. The `SELECT` policy uses `moderation_status = 'published'`, and `deleted_at` is a separate audit timestamp that is never in a policy `USING` clause. Alternatively, perform soft-deletes exclusively via a Postgres function called with `SECURITY DEFINER` that bypasses RLS, keeping RLS policies clean.

Concrete pattern:
```sql
-- Use status column in RLS, not deleted_at
CREATE POLICY "posts_select_public" ON posts
  FOR SELECT
  USING (moderation_status = 'published' OR auth.uid() = author_id);

-- deleted_at is audit metadata only, never in USING
ALTER TABLE posts ADD COLUMN deleted_at timestamptz;
ALTER TABLE posts ADD COLUMN moderation_status text NOT NULL DEFAULT 'published'
  CHECK (moderation_status IN ('published', 'hidden', 'removed'));
```

**Warning signs:**
- 403 errors when trying to soft-delete a post via supabase-js client.
- UPDATE operations returning 0 rows affected on rows that exist.
- RLS policies referencing `deleted_at IS NULL` in USING clause.

**Phase to address:** Database/schema foundation phase. This constraint must be locked in before any moderation logic is built.

---

### Pitfall 3: Missing Index on RLS Policy Columns

**What goes wrong:**
A policy like `USING (author_id = auth.uid())` triggers a full sequential scan on every query if `author_id` is not indexed. At 10,000 posts this is noticeable (50ms per query); at 100,000 it's severe. Forum listing queries — which check every visible post against the policy — are hit hardest.

**Why it happens:**
Developers focus on application-level query performance (and add indexes for `ORDER BY` columns) but forget that every RLS policy condition is also a filter executed per-row on every read.

**How to avoid:**
Every column referenced in an RLS USING or WITH CHECK clause must have an index. For this project:
```sql
CREATE INDEX posts_author_id_idx ON posts (author_id);
CREATE INDEX posts_community_id_idx ON posts (community_id);
CREATE INDEX replies_post_id_idx ON replies (post_id);
CREATE INDEX replies_author_id_idx ON replies (author_id);
```
Additionally, specify `TO authenticated` on policies that should only run for logged-in users — policies without a `TO` clause execute for all roles, including anonymous, wasting evaluations.

**Warning signs:**
- EXPLAIN ANALYZE shows "Seq Scan" on posts or replies tables.
- API response times grow linearly with row count, not staying flat.
- pg_stat_user_tables shows high `seq_scan` count on forum tables.

**Phase to address:** Database/schema foundation phase. Add indexes in the same migration that creates policies.

---

### Pitfall 4: Soft-Delete Leaking Into Every Query

**What goes wrong:**
"Memory over moderation" (no hard deletes) means the application must filter out logically deleted content everywhere — thread listings, reply counts, search, author profiles, notification generation. Without a structural solution, every query that touches forum data acquires a `WHERE moderation_status = 'published'` clause. When that clause is forgotten once, deleted content surfaces in production.

**Why it happens:**
Application-layer filtering is easy to add to the first query and easy to forget on the tenth. The problem compounds when new query paths are added (e.g., a notification that references a post without realizing it could be hidden).

**How to avoid:**
Create a Postgres view (`published_posts`, `published_replies`) that pre-filters on `moderation_status = 'published'` and expose these views via the API, not the raw tables. All read paths target the view. Only moderation and audit paths go to the raw table.
```sql
CREATE VIEW published_posts AS
  SELECT * FROM posts WHERE moderation_status = 'published';

CREATE VIEW published_replies AS
  SELECT * FROM replies WHERE moderation_status = 'published';
```
Apply `security_invoker = true` (Postgres 15+) so the view respects underlying RLS:
```sql
ALTER VIEW published_posts SET (security_invoker = true);
```

**Warning signs:**
- More than one query in the codebase manually appends `moderation_status = 'published'`.
- A bug report: "I can see a post that was supposed to be hidden."
- Notification emails or reply counts include removed content.

**Phase to address:** Database/schema foundation phase (views defined upfront), enforced during forum API phase.

---

### Pitfall 5: read-open / write-gated Misimplemented in RLS

**What goes wrong:**
The design principle is: anyone can read (including anonymous visitors), but only Connected Accounts can post. A common mistake is writing a SELECT policy that requires `auth.uid() IS NOT NULL`, which accidentally gates reading behind authentication. The inverse mistake — no policy at all on INSERT — allows unauthenticated users to post if they can craft raw API calls.

**Why it happens:**
Developers conflate "auth is required to use the app" with "auth is required by RLS." Supabase's anon key is public by design; without a correct SELECT policy, anonymous API calls return nothing (too restrictive) or everything (too permissive).

**How to avoid:**
```sql
-- Anonymous users can READ published posts
CREATE POLICY "posts_select_open" ON posts
  FOR SELECT
  TO anon, authenticated
  USING (moderation_status = 'published');

-- Only connected accounts can INSERT (check handled in app + RLS)
CREATE POLICY "posts_insert_connected" ON posts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = author_id
    AND EXISTS (
      SELECT 1 FROM connected_profiles cp WHERE cp.user_id = auth.uid()
    )
  );
```

The `EXISTS (SELECT 1 FROM connected_profiles ...)` check enforces the Connected Account requirement at the database layer, not just the application layer.

**Warning signs:**
- Anonymous visitors get empty responses instead of the post list.
- A user without a `connected_profiles` record can create posts.
- The anon role has no policies on the posts table.

**Phase to address:** Auth + schema foundation phase. Must be verified with integration tests that test anon and authenticated roles separately.

---

### Pitfall 6: CDN-Cached SSR Responses Leaking Session Tokens

**What goes wrong:**
When Supabase SSR refreshes a session token server-side, it writes the updated JWT to the HTTP response via `Set-Cookie`. If a CDN (or a misconfigured Render proxy) caches that response and serves it to a different user, that user's browser stores the cached token and is signed in as the wrong person. This is an officially documented Supabase edge case.

**Why it happens:**
SSR auth flows refresh tokens server-side before responding. Without explicit `Cache-Control: private, no-store` headers on any response that touches auth state, CDN layer caching can intercept session cookies.

**How to avoid:**
- Set `Cache-Control: private, no-store` on all API responses and any SSR route that reads auth context.
- Never cache responses that contain `Set-Cookie` headers.
- In Render configuration, disable response caching on `/api/*` routes.

**Warning signs:**
- Users intermittently signed in as wrong person.
- Session state differs between first load and refresh.
- Network inspector shows cached responses with `Set-Cookie` headers.

**Phase to address:** Infrastructure/deployment phase.

---

### Pitfall 7: Supabase Realtime Subscriptions Dropping at ~30 Minutes

**What goes wrong:**
Supabase Realtime `Postgres Changes` subscriptions drop connections after approximately 30 minutes in production without proper reconnection handling. The naive implementation (copy-paste from docs) has no exponential backoff, no channel cleanup, and produces duplicate events from non-unique channel names.

**Why it happens:**
The Supabase Realtime docs show the simplest working example, not a production-grade implementation. Long-lived connections require heartbeat acknowledgment and reconnection logic that isn't included by default.

**How to avoid:**
For a pilot-scale civic forum, avoid Supabase Realtime entirely in v1. Use polling (`setInterval` + React Query `refetchInterval`) for thread and reply refresh. This is simpler, predictable, and eliminates an entire class of connection management bugs. Realtime can be added as an optimization after the product is validated.

If Realtime is eventually needed, use `Broadcast` (not `Postgres Changes`) for better scalability, and implement self-healing channels with exponential backoff.

**Warning signs:**
- Users report needing to refresh to see new replies.
- Browser console shows WebSocket close events after 30 minutes.
- Channel names are hard-coded strings (collision risk in multi-tab scenarios).

**Phase to address:** Forum UI phase — make a deliberate choice to use polling for v1.

---

### Pitfall 8: Authenticated-But-Throwaway Account Brigading

**What goes wrong:**
The write-gate requires a Connected Account, but if Connected Account creation has no friction, bad actors create many accounts to brigading threads or vote-stuff. Pseudonymous forums are especially vulnerable because there's no real-identity accountability.

**Why it happens:**
Email + password signup with disposable email services takes 30 seconds per account. Upstash Redis rate limiting on signup is often forgotten or scoped only to IP (which is trivially bypassed with VPNs).

**How to avoid:**
- Rate limit Connected Account creation per IP AND per email domain (flag/block known disposable email domains via a maintained blocklist).
- Implement account age gating: require the Connected Account to be at least N hours old before it can post (configurable, start at 24 hours).
- Track `created_at` on `connected_profiles` and enforce in the INSERT policy's `WITH CHECK`.
- Use Upstash Redis sliding window rate limiting on the `/api/forum/posts` endpoint: max 5 posts per hour per user_id, max 20 replies per hour per user_id.

**Warning signs:**
- Multiple `connected_profiles` records created within seconds from the same IP.
- Burst of posts from accounts created within the last hour.
- Disposable email domains in `auth.users.email`.

**Phase to address:** Forum API phase — rate limiting from day one, not retrofitted.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| App-layer soft-delete filtering only (no view) | Faster to build | Every new query is a bug waiting to happen; hidden content surfaces unexpectedly | Never — create the view in the foundation phase |
| No `WITH CHECK` on UPDATE policies | Simpler policy code | Users can change `user_id` on their posts, anonymously claim others' content | Never |
| Use `deleted_at IS NULL` in RLS USING clause | Intuitive pattern | Breaks all UPDATE operations that set `deleted_at` | Never — use `moderation_status` column instead |
| Realtime subscriptions in v1 | Live updates feel polished | Reconnection failures, channel leaks, 30-min drops degrade UX; debugging cost is high | Defer to v2 after validation |
| Hard-coded rate limits in middleware (no Redis) | Zero infrastructure dependency | Rate limits reset on every deploy; coordinated attacks not tracked cross-request | Acceptable in test environments only |
| Skipping account-age gate on posting | Lower friction for legitimate users | Brigading via throwaway accounts with no friction | Never for pilot launch |
| Single combined RLS policy for anon + authenticated | Fewer policy objects | anon users accidentally blocked from reads when auth logic changes | Never — use `TO anon` and `TO authenticated` separately |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Supabase anon key in frontend | Assuming it's secret | It is public by design — RLS is the security layer, not key secrecy |
| Supabase service role key | Used in frontend code or committed to repo | Server-side only (Express), never in any client bundle, treated as master credential |
| Supabase `auth.uid()` in RLS | Assuming it's never null | When anon user calls the API, `auth.uid()` returns null; SQL `null = column` is always false — no rows returned |
| Supabase `raw_user_meta_data` in RLS policies | Using it for role/permission checks | Users can modify their own `user_meta_data`; use `raw_app_meta_data` (admin-only write) |
| Upstash Redis with Render | Assuming Redis is always reachable | Always implement in-memory fallback (as the project constraint specifies); Redis failures must not crash the API |
| Connected Account check in Express middleware | Performing it only in app code | RLS `WITH CHECK` must also enforce it — defense in depth, not OR logic |
| Supabase Realtime + RLS | Assuming RLS applies to Realtime events | `Postgres Changes` subscriptions require separate RLS evaluation; events can leak if RLS is not explicitly tested on the Realtime channel |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| `OFFSET`-based pagination on threads | Thread list page 50+ loads slowly; queries scan entire table | Use keyset (cursor) pagination: `WHERE created_at < :cursor ORDER BY created_at DESC LIMIT 20` | ~5,000+ threads |
| No composite index on `(community_id, created_at)` | Thread listings for a community do full scans | `CREATE INDEX posts_community_created_idx ON posts (community_id, created_at DESC)` | ~1,000+ posts |
| Counting replies per thread in a loop | N+1 queries: 1 query for threads + 1 per thread for reply count | Aggregate reply count in the main thread query: `LEFT JOIN (SELECT post_id, COUNT(*) FROM replies GROUP BY post_id) r ON r.post_id = posts.id` | Immediate — even 20 threads = 21 queries |
| Eager-loading full reply bodies in thread list | Bandwidth waste; large payload for list view | Thread list endpoint returns only metadata (title, author, reply count, last activity); reply bodies loaded in thread detail endpoint only | At any scale |
| Sequential scan on `author_id` for user post history | User profile page "their posts" query times out | Index on `posts(author_id)` — also required by RLS policy | ~10,000+ posts |
| `COUNT(*)` for total thread count in every listing response | Expensive full-count query on every page load | Never show exact total; use `has_more` boolean from keyset pagination | ~50,000+ rows |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Service role key in Framer/frontend bundle | Complete database compromise — bypasses all RLS | Service role key lives only in Express environment variables, never in any client-side code |
| No rate limiting on `/api/forum/posts` endpoint | Flooding: one account posts thousands of threads | Upstash Redis sliding window: 5 posts/hour, 20 replies/hour per user |
| Displaying `auth.users.email` in post attribution | Exposes legal identity in a pseudonymous context | Show only `connected_profiles.display_name`; never expose email, UUID, or legal name in forum UI |
| RLS policies that check `user_metadata` | Users modify their own metadata to escalate privileges | Use `raw_app_meta_data` for any server-set claims; never trust `raw_user_meta_data` in policy logic |
| Views without `security_invoker = true` | Views created by `postgres` user run as security definer, bypassing RLS on underlying tables | `ALTER VIEW published_posts SET (security_invoker = true)` (Postgres 15+) |
| Partisan content detection via username pattern matching | Pseudonymous system broken: users enumerate who is "partisan" via display names | No algorithmic amplification or suppression based on content analysis; let moderation be human and contextual |
| Storing moderator action reasons without access control | Bad actors query moderation log to reverse-engineer flag criteria | Moderation reason/history table has RLS restricting access to admin role only |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Showing party labels on stance cards | Destroys anti-partisan design principle; users respond to party, not policy content | Stance cards show only policy substance text, numerical position labels (1–5), no party attribution ever |
| Thread sort by "popularity" or engagement score | Creates engagement-bait dynamics; controversial posts rise; measured, substantive posts disappear | Default to chronological (newest first); offer sort by "recent activity" only — no upvote-based ranking |
| Allowing post edits without showing edit history | Undermines deliberation integrity; users gaslight each other about what they said | Every edit creates an immutable history entry; UI shows "edited" indicator with expandable diff |
| Silent auth expiry mid-posting | User writes long reply, submits, gets signed out, loses content | Detect auth state before form submission; warn if session expires mid-compose; preserve draft in localStorage |
| Optimistic UI updates without rollback | Post appears submitted, then silently vanishes when the API fails | Implement rollback on failed mutations (TanStack Query handles this); show error state explicitly |
| Anonymous-looking UX for write-gated actions | Visitors try to post, get opaque error, don't understand they need a Connected Account | Gate UI: disable post button for non-authenticated users with tooltip "Create a Connected Account to join the discussion" |
| Infinite scroll without position restoration | User reads thread, navigates away, returns to top of list | Use URL-based state for scroll position; keyset cursor in query params enables browser back-navigation |

---

## "Looks Done But Isn't" Checklist

- [ ] **RLS on every table:** Check that `ALTER TABLE posts ENABLE ROW LEVEL SECURITY` (and all forum tables) appears in migrations. Tables without RLS enabled expose all rows to the anon key.
- [ ] **WITH CHECK on every INSERT/UPDATE policy:** Grep migrations for `FOR INSERT` and `FOR UPDATE` — every one must have a `WITH CHECK` clause.
- [ ] **Soft-delete view created:** Confirm `published_posts` and `published_replies` views exist and that `security_invoker = true` is set.
- [ ] **Indexes on policy columns:** Confirm indexes on `posts.author_id`, `posts.community_id`, `replies.post_id`, `replies.author_id` exist in migrations.
- [ ] **Read-open verified for anon role:** Send a `GET /api/forum/posts` request with no auth header — should return published posts, not empty or error.
- [ ] **Write-gate verified for anon role:** `POST /api/forum/posts` with no auth header must return 401, not 200.
- [ ] **Connected Account gate verified:** Auth token from an account WITHOUT a `connected_profiles` record must be rejected on post creation.
- [ ] **Display name only:** Search frontend code for `email`, `user_id`, and `uuid` — none should appear in post attribution UI components.
- [ ] **Edit history stored:** Verify that `PATCH /api/forum/posts/:id` writes to a `post_edits` history table before updating the main post.
- [ ] **Rate limiting active:** POST endpoints for creating threads/replies must return 429 after threshold is exceeded in staging.
- [ ] **Service role key absent from client bundle:** Search built Framer/React output for `service_role` string — must not appear.
- [ ] **Health endpoint responds:** `GET /api/health` returns `{ status: 'ok', timestamp: ... }` with no auth.

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Missing WITH CHECK on INSERT — users assigned wrong author_id | HIGH | Audit all posts with `author_id != actual_author_id` (requires secondary evidence); correct with admin migration; add `WITH CHECK` immediately |
| Soft-delete via RLS causing 403 errors | MEDIUM | Switch moderation actions to SECURITY DEFINER function; deploy as migration; no data loss |
| Missing indexes discovered in production | LOW | `CREATE INDEX CONCURRENTLY` — safe to run without table lock on Postgres 9.5+; no downtime |
| CDN caching session tokens | HIGH | Immediately purge CDN cache; add `Cache-Control: private, no-store` to all auth-touching endpoints; audit for any user session cross-contamination |
| Realtime connections dropping | LOW | Switch to polling (React Query `refetchInterval`); remove Realtime subscription code; users notice improvement not regression |
| Brigading via throwaway accounts | MEDIUM | Enable account-age gate retroactively; suspend confirmed bad-actor accounts (soft-disable `connected_profiles` record); posts remain visible per "memory over moderation" principle but marked as from suspended account |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| RLS WITH CHECK omission | Schema/foundation phase | Automated migration linter checks for `WITH CHECK` on all mutation policies |
| Soft delete + RLS deadlock | Schema/foundation phase | Integration test: soft-delete a post via API as the author; confirm 200 not 403 |
| Missing indexes on policy columns | Schema/foundation phase | EXPLAIN ANALYZE on thread listing query shows index scans, not seq scans |
| Soft-delete leaking into queries | Schema/foundation phase | All read queries go through `published_posts` view; grep for raw `posts` table references in Express route handlers |
| read-open / write-gated misimplemented | Auth + schema phase | Automated tests for anon read (pass), anon write (fail), auth read (pass), auth without Connected Account write (fail), auth with Connected Account write (pass) |
| CDN caching session tokens | Infrastructure/deployment phase | `Cache-Control` header audit on all API responses |
| Realtime drop at 30 minutes | Forum UI phase | Decision documented: polling used in v1; no Realtime subscription code |
| Throwaway account brigading | Forum API phase | Account age gate enforced; rate limit returns 429 after threshold; disposable domain blocklist active |
| N+1 queries on thread listing | Forum API phase | Thread list endpoint verified with single query (EXPLAIN shows one plan node, no loops) |
| Edit history missing | Forum content phase | `PATCH /api/forum/posts/:id` integration test verifies `post_edits` row created before post update |
| Partisan attribution in UI | Forum UI phase | UI review: no party labels, no algorithmic ranking UI, no upvote counts |
| Display name leaking real identity | Forum UI phase | Search all forum UI components for email/UUID render paths |

---

## Sources

### Primary (HIGH confidence)
- [Supabase RLS Official Docs](https://supabase.com/docs/guides/database/postgres/row-level-security) — WITH CHECK vs USING, role scoping, performance, view security
- [Supabase Auth Sessions Docs](https://supabase.com/docs/guides/auth/sessions) — clock skew, CDN caching, refresh token reuse window
- [Supabase Soft Delete GitHub Discussion #2799](https://github.com/supabase/supabase/discussions/2799) — soft delete patterns and RLS interactions
- [Supabase RLS + Soft Delete Bug Report #1941](https://github.com/supabase/supabase-js/issues/1941) — WITH CHECK failure on soft delete UPDATE
- [Supabase Realtime Limits](https://supabase.com/docs/guides/realtime/limits) — connection constraints and Postgres Changes limitations

### Secondary (MEDIUM confidence)
- [ProsperaSoft: Supabase RLS Misconfigurations](https://prosperasoft.com/blog/database/supabase/supabase-rls-issues/) — verified against official docs
- [Precursor Security: Row-Level Recklessness](https://www.precursorsecurity.com/blog/row-level-recklessness-testing-supabase-security) — RLS security testing patterns, verified common failure mode (INSERT without WITH CHECK)
- [byteiota: 170+ Apps Exposed by Missing RLS](https://byteiota.com/supabase-security-flaw-170-apps-exposed-by-missing-rls/) — scale of real-world RLS omission problem
- [Cybertec: Pagination Total Count Problem](https://www.cybertec-postgresql.com/en/pagination-problem-total-result-count/) — offset vs keyset pagination tradeoffs
- [Frontiers: Deliberation and Polarization](https://www.frontiersin.org/journals/political-science/articles/10.3389/fpos.2023.1127372/full) — engagement-bait algorithm effects on civic discourse

### Tertiary (LOW confidence — flagged for validation)
- Production Supabase Realtime ~30-minute drop behavior (multiple community reports, not officially documented as a known issue — test in staging)
- Account-age gating effectiveness against brigading (community convention, not empirically validated for this platform's user base)

---
*Pitfalls research for: Focused Communities — civic deliberation forum*
*Researched: 2026-04-15*
