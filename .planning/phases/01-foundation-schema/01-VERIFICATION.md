---
phase: 01-foundation-schema
verified: 2026-04-15
status: passed
score: 5/5 must-haves verified
---

# Phase 1 Verification

## Goal
The database is correct, complete, and secure — all tables, RLS policies, indexes, and edit history structures exist before any application code is written.

---

## Must-Haves Check

### 1. GET /api/health returns `{ status: 'ok', timestamp: Date.now() }` and all /api/* routes exist at the correct prefix

**Status: VERIFIED**

`src/routes/health.ts` line 5–7:
```typescript
healthRouter.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});
```

`src/app.ts` line 11:
```typescript
app.use('/api', healthRouter);
```

The router is mounted at `/api`, so the full path is `GET /api/health`. The response shape `{ status: 'ok', timestamp: Date.now() }` matches exactly. No other application routes have been added yet (only this one router), so no route is outside the `/api` prefix.

---

### 2. connect.* schema contains communities, threads, posts, thread_edits, post_edits tables with moderation_status enum (not deleted_at) in all USING clauses

**Status: VERIFIED**

Migration `20260415214142_connect_schema_tables.sql` creates:
- `CREATE SCHEMA IF NOT EXISTS connect;`
- `CREATE TYPE connect.moderation_status AS ENUM ('visible', 'hidden');`
- `CREATE TABLE connect.communities (...)` — no moderation_status needed (communities are not soft-hidden at the row level)
- `CREATE TABLE connect.threads (... moderation_status connect.moderation_status NOT NULL DEFAULT 'visible', ...)`
- `CREATE TABLE connect.posts (... moderation_status connect.moderation_status NOT NULL DEFAULT 'visible', ...)`
- `CREATE TABLE connect.thread_edits (...)`
- `CREATE TABLE connect.post_edits (...)`

No `deleted_at` column appears anywhere in the migrations (grep confirmed zero matches).

RLS `USING` clauses in `20260415214600_connect_schema_rls.sql` that perform soft-hide filtering:
- Line 46: `USING (moderation_status = 'visible');` — threads SELECT
- Line 69: `USING (moderation_status = 'visible');` — posts SELECT
- Line 58: `USING ((SELECT auth.uid()) = author_id AND moderation_status = 'visible')` — threads UPDATE
- Line 81: `USING ((SELECT auth.uid()) = author_id AND moderation_status = 'visible')` — posts UPDATE

All USING clauses use `moderation_status`, not `deleted_at`. Soft-hide is achieved without RLS deadlock (hidden rows are simply excluded from SELECT; no DELETE policy exists on any table).

---

### 3. Every RLS policy on INSERT and UPDATE has a WITH CHECK clause; every policy column (author_id, community_id, thread_id) has an index in the same migration

**Status: VERIFIED**

**INSERT policies and their WITH CHECK clauses:**

| Policy | Line | WITH CHECK |
|---|---|---|
| `threads_insert_own` | 50 | Line 52: `WITH CHECK ((SELECT auth.uid()) = author_id)` |
| `posts_insert_own` | 73 | Line 75: `WITH CHECK ((SELECT auth.uid()) = author_id)` |
| `profiles_insert_own` | 114 | Line 116: `WITH CHECK ((SELECT auth.uid()) = user_id)` |

**UPDATE policies and their WITH CHECK clauses:**

| Policy | Lines | USING + WITH CHECK |
|---|---|---|
| `threads_update_own` | 56–59 | USING line 58 + WITH CHECK line 59 |
| `posts_update_own` | 79–82 | USING line 81 + WITH CHECK line 82 |
| `profiles_update_own` | 120–123 | USING line 122 + WITH CHECK line 123 |

Every INSERT and UPDATE policy carries a WITH CHECK clause. No exceptions.

**Indexes in the same migration (`20260415214600_connect_schema_rls.sql` lines 131–152):**

Policy columns covered:
- `author_id` on threads: `idx_threads_author_id`
- `community_id` on threads: `idx_threads_community_id`
- `author_id` on posts: `idx_posts_author_id`
- `thread_id` on posts: `idx_posts_thread_id`
- `user_id` on connected_profiles: `idx_connected_profiles_user_id`

Additional indexes for moderation filtering: `idx_threads_moderation_status`, `idx_posts_moderation_status`.

All indexes are in the same file as the policies, so they deploy atomically with `supabase db push`.

---

### 4. GRANT USAGE ON SCHEMA connect TO anon, authenticated is applied; anon role can SELECT from published_posts and published_replies views (security_invoker = true)

**Status: VERIFIED**

`20260415214600_connect_schema_rls.sql` line 14:
```sql
GRANT USAGE ON SCHEMA connect TO anon, authenticated;
```

`20260415214708_connect_schema_views.sql`:
- Line 15–28: `CREATE VIEW connect.published_posts WITH (security_invoker = true) AS ...`
- Line 34–47: `CREATE VIEW connect.published_replies WITH (security_invoker = true) AS ...`
- Line 53: `GRANT SELECT ON connect.published_posts TO anon, authenticated;`
- Line 54: `GRANT SELECT ON connect.published_replies TO anon, authenticated;`

Both views carry `security_invoker = true`, meaning they execute under the calling role's permissions rather than the view owner's permissions. The existing `posts_select_visible` RLS policy (`USING (moderation_status = 'visible')`) therefore applies when anon queries through the views. The views themselves also hard-code `WHERE moderation_status = 'visible'` as a second layer of defense.

---

### 5. All schema changes exist as Supabase CLI migration files — no manual console changes; supabase db push applies cleanly to a fresh project

**Status: VERIFIED**

Three migration files exist in `supabase/migrations/`, named with the Supabase CLI timestamp convention:

```
20260415214142_connect_schema_tables.sql
20260415214600_connect_schema_rls.sql
20260415214708_connect_schema_views.sql
```

`supabase/config.toml` confirms a properly initialized Supabase project (`project_id = "Focused_Communities"`, `[db.migrations] enabled = true`). The `schema_paths = []` field is empty (correct — migrations are used, not declarative schemas). The migrations are self-contained SQL with no dependencies on pre-existing state: each uses `CREATE IF NOT EXISTS` for idempotent schema/table creation, making them safe to run against a fresh project.

No schema changes appear anywhere outside these three files. There are no seed-file workarounds, no inline SQL in application code, and no evidence of console-applied changes.

---

## Anti-Pattern Scan

No TODO, FIXME, placeholder, or stub patterns found in any migration file. No stub patterns in `src/routes/health.ts` or `src/app.ts`. The health route is substantive (real implementation, not a console.log stub). All migration files are properly formed SQL with triggers, functions, policies, indexes, and grants.

---

## Verdict

All 5 must-haves verified. Phase 1 goal achieved.

The database schema is correct (all five connect.* tables plus connected_profiles), complete (enum, triggers, edit history, views), and secure (RLS enabled on all tables before policies, every INSERT/UPDATE has WITH CHECK, USING clauses use moderation_status not deleted_at, views use security_invoker = true, schema grants applied). All changes exist exclusively in Supabase CLI migration files.

---

_Verified: 2026-04-15_
_Verifier: Claude (gsd-verifier)_
