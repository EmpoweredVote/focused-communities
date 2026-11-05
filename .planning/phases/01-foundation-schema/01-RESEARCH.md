# Phase 01: Foundation + Schema - Research

**Researched:** 2026-04-15
**Domain:** Supabase PostgreSQL (RLS, migrations, custom schemas, views) + Express TypeScript skeleton + Upstash Redis
**Confidence:** HIGH (primary areas verified against official Supabase documentation and Context7)

---

## Summary

Phase 1 establishes the database foundation that all subsequent phases depend on. The work divides cleanly into three workstreams: (1) repo scaffold and Express health endpoint, (2) `connect.*` schema migrations with tables and enums, and (3) RLS policies, schema grants, and security-invoker views.

The locked architectural decisions (moderation_status enum, `(SELECT auth.uid())` syntax, GRANT USAGE on connect schema, CLI-only migrations) are all verified as correct against official Supabase documentation. No alternatives need to be researched — they are the right choices. The `moderation_status` enum approach avoids a real, open Supabase bug (issue #1941) where WITH CHECK clauses on soft-delete UPDATE operations fail from the supabase-js client when using a `deleted_at` pattern.

The most error-prone area is RLS policy construction: every INSERT and UPDATE policy needs both USING and WITH CHECK; every policy column needs a dedicated index in the same migration; all policy expressions must use `(SELECT auth.uid())` not bare `auth.uid()`; and views that the anon role reads must be created with `WITH (security_invoker = true)` or they silently bypass RLS.

**Primary recommendation:** Write migrations in three discrete files — schema/tables, then RLS+grants, then views — so each can be verified in isolation before moving to the next. Never mix table DDL with policy DDL in the same migration file.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| supabase/cli | latest (npm i supabase) | Migration management, db push, local dev | Official tooling; `supabase db push` is the only supported migration path |
| @supabase/supabase-js | ^2.x | Supabase client for TypeScript | Official client; needed for auth token verification in Express middleware |
| express | ^4.x | HTTP server framework | Stable, well-understood; v5 is in RC but v4 is production standard |
| typescript | ^5.x | Type safety | Required by tech stack decision |
| @types/express | ^4.x | TypeScript types for Express | Required companion to express |
| @upstash/redis | ^1.x | HTTP-based Redis client for Upstash | Official Upstash client; connectionless HTTP (not TCP), works on Render |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| tsx | ^4.x | TypeScript execution for development | Replaces ts-node; faster, no separate config needed |
| dotenv | ^16.x | Environment variable loading | Load SUPABASE_URL, UPSTASH_REDIS_REST_URL in dev |
| cors | ^2.x | CORS middleware for Express | Needed because Framer frontend is on a different origin |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @upstash/redis | ioredis | ioredis uses TCP; Upstash is REST/HTTP only — @upstash/redis is the correct client for Upstash |
| supabase migration new | raw SQL files | Manual naming breaks migration history table ordering |
| (SELECT auth.uid()) | auth.uid() | Bare auth.uid() re-evaluates per row; SELECT version caches per statement — up to 94.97% faster |

**Installation:**
```bash
# Backend dependencies
npm install express cors dotenv @supabase/supabase-js @upstash/redis
npm install -D typescript @types/express @types/cors @types/node tsx

# Supabase CLI (global or project-level)
npm install -D supabase
```

---

## Architecture Patterns

### Recommended Project Structure
```
project-root/
├── supabase/
│   ├── migrations/
│   │   ├── 20260415000001_connect_schema_tables.sql
│   │   ├── 20260415000002_connect_schema_rls.sql
│   │   └── 20260415000003_connect_schema_views.sql
│   └── seed.sql                    # optional, dev only
├── src/
│   ├── app.ts                      # Express app factory (no listen call)
│   ├── server.ts                   # Entry point — calls app.listen
│   ├── routes/
│   │   └── health.ts               # GET /api/health
│   ├── middleware/
│   │   └── cache.ts                # Redis + in-memory fallback
│   └── lib/
│       ├── supabase.ts             # Supabase client singleton
│       └── redis.ts                # @upstash/redis + fallback Map
├── tsconfig.json
├── package.json
└── .env.local
```

### Pattern 1: Migration File Naming and Ordering

**What:** Supabase CLI creates migration files with timestamp prefix. Files apply in lexicographic order.
**When to use:** Every schema change. Never touch the remote database manually.

```bash
# Create migrations in order
npx supabase migration new connect_schema_tables
npx supabase migration new connect_schema_rls
npx supabase migration new connect_schema_views

# Apply locally for testing
npx supabase migration up --local

# Push to linked project
npx supabase db push
```

File format: `20260415000001_connect_schema_tables.sql`
Source: https://supabase.com/docs/reference/cli/supabase-migration

### Pattern 2: moderation_status Enum (Locked Decision)

**What:** Use a PostgreSQL enum for content state instead of a `deleted_at` nullable timestamp column.
**Why it's locked:** Supabase issue #1941 documents that UPDATE operations setting `deleted = true` fail in WITH CHECK clauses from the supabase-js client but work in the SQL editor. The enum approach sidesteps this entirely because RLS USING clauses filter on `moderation_status = 'visible'` (never null), so the update path never touches a special "deleted" state that triggers the bug.

```sql
-- Source: Supabase official enums docs + issue #1941 workaround
CREATE TYPE connect.moderation_status AS ENUM ('visible', 'hidden');

-- Usage in table
moderation_status connect.moderation_status NOT NULL DEFAULT 'visible',

-- Usage in RLS USING clause (reads only visible rows)
USING (moderation_status = 'visible')
```

**Warning about enums:** There is no `ALTER TYPE DELETE VALUE` in PostgreSQL. Adding values is safe (`ALTER TYPE connect.moderation_status ADD VALUE 'flagged'`), but removing values requires a full migration. Only define the values you are certain about.

Source: https://supabase.com/docs/guides/database/postgres/enums

### Pattern 3: RLS Policy Construction (Critical)

**What:** Every INSERT and UPDATE policy must have WITH CHECK. Every UPDATE policy must have both USING and WITH CHECK. All auth function calls must be wrapped in SELECT.

```sql
-- Source: https://supabase.com/docs/guides/database/postgres/row-level-security

-- SELECT policy — USING only
CREATE POLICY "threads_select"
ON connect.threads FOR SELECT
TO anon, authenticated
USING (moderation_status = 'visible');

-- INSERT policy — WITH CHECK only (no USING on INSERT)
CREATE POLICY "threads_insert"
ON connect.threads FOR INSERT
TO authenticated
WITH CHECK ((SELECT auth.uid()) = author_id);

-- UPDATE policy — USING + WITH CHECK both required
CREATE POLICY "threads_update_own"
ON connect.threads FOR UPDATE
TO authenticated
USING ((SELECT auth.uid()) = author_id)
WITH CHECK ((SELECT auth.uid()) = author_id);
```

**Critical:** UPDATE also requires a matching SELECT policy. Without a SELECT policy, UPDATE may silently fail.

### Pattern 4: Index in the Same Migration as Policy

**What:** Create the index for every policy column in the same migration that creates the policy. Never create a policy without its supporting index.

```sql
-- Source: Supabase RLS performance guidance
-- After RLS policy definitions, in the same migration file:
CREATE INDEX idx_threads_author_id ON connect.threads(author_id);
CREATE INDEX idx_threads_community_id ON connect.threads(community_id);
CREATE INDEX idx_posts_thread_id ON connect.posts(thread_id);
CREATE INDEX idx_posts_author_id ON connect.posts(author_id);
```

Without indexes on policy columns, query cost on large tables is 10-100x worse. Supabase's own benchmarks show a 10x improvement with indexes.

### Pattern 5: Custom Schema Grants

**What:** The `connect` schema is not `public`, so anon and authenticated roles have no default access. Explicit grants are required.

```sql
-- Source: https://supabase.com/docs/guides/api/using-custom-schemas
-- Required for any non-public schema

GRANT USAGE ON SCHEMA connect TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA connect TO anon;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA connect TO authenticated;

-- Future tables get the same grants automatically
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA connect
  GRANT SELECT ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA connect
  GRANT SELECT, INSERT, UPDATE ON TABLES TO authenticated;
```

Additionally, add the `connect` schema to Supabase Dashboard → Settings → Data API → Exposed schemas so PostgREST serves it. This can also be done in `supabase/config.toml`.

### Pattern 6: Security-Invoker Views

**What:** Views created without `security_invoker = true` run as the view owner, bypassing RLS entirely. Any view the anon role accesses must use security_invoker.

```sql
-- Source: https://dev.to/datadeer/postgres-views-the-hidden-security-gotcha-in-supabase-ckd
-- PostgreSQL 15+ (all modern Supabase projects)

CREATE VIEW connect.published_posts
WITH (security_invoker = true) AS
SELECT
  p.id,
  p.thread_id,
  p.author_display_name,  -- snapshotted at insert time
  p.body,
  p.created_at,
  p.updated_at,
  p.moderation_status
FROM connect.posts p
WHERE p.moderation_status = 'visible';

CREATE VIEW connect.published_replies
WITH (security_invoker = true) AS
SELECT
  p.id,
  p.thread_id,
  p.author_display_name,
  p.body,
  p.created_at,
  p.updated_at
FROM connect.posts p
WHERE p.moderation_status = 'visible'
  AND p.parent_post_id IS NOT NULL;
```

### Pattern 7: Display Name Snapshot via Trigger

**What:** Capture the author's display_name at INSERT time rather than JOINing to the profiles table on every read. This is the locked "trigger approach."

```sql
-- BEFORE INSERT trigger on connect.posts and connect.threads
CREATE OR REPLACE FUNCTION connect.snapshot_author_display_name()
RETURNS TRIGGER AS $$
BEGIN
  -- Pull display_name from connected_profiles at insert time
  SELECT display_name INTO NEW.author_display_name
  FROM public.connected_profiles
  WHERE user_id = NEW.author_id;

  -- If no profile found, use a fallback
  IF NEW.author_display_name IS NULL THEN
    NEW.author_display_name := 'Unknown';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_snapshot_display_name
BEFORE INSERT ON connect.threads
FOR EACH ROW
EXECUTE FUNCTION connect.snapshot_author_display_name();
```

Source: Supabase trigger documentation + PostgreSQL trigger function patterns.

### Pattern 8: Edit History Tables (AFTER UPDATE)

**What:** `thread_edits` and `post_edits` tables capture the state before each update. Use AFTER UPDATE triggers (not BEFORE) so the final row state after all triggers have run is captured.

```sql
-- History table example
CREATE TABLE connect.thread_edits (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id   UUID NOT NULL REFERENCES connect.threads(id),
  editor_id   UUID NOT NULL,
  old_title   TEXT NOT NULL,
  old_body    TEXT NOT NULL,
  edited_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- AFTER UPDATE trigger function
CREATE OR REPLACE FUNCTION connect.log_thread_edit()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO connect.thread_edits(thread_id, editor_id, old_title, old_body)
  VALUES (OLD.id, OLD.author_id, OLD.title, OLD.body);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_log_thread_edit
AFTER UPDATE ON connect.threads
FOR EACH ROW
WHEN (OLD.title IS DISTINCT FROM NEW.title OR OLD.body IS DISTINCT FROM NEW.body)
EXECUTE FUNCTION connect.log_thread_edit();
```

The `WHEN` clause prevents the trigger from firing on unrelated column updates (e.g., moderation_status changes).

### Pattern 9: Express App Structure

**What:** Separate `app.ts` (Express factory) from `server.ts` (entry point with `.listen()`). This makes the app testable without starting a real server.

```typescript
// src/app.ts
import express from 'express';
import cors from 'cors';
import { healthRouter } from './routes/health';

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use('/api', healthRouter);
  return app;
}

// src/server.ts
import { createApp } from './app';

const app = createApp();
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

// src/routes/health.ts
import { Router } from 'express';
export const healthRouter = Router();

healthRouter.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});
```

### Pattern 10: Redis + In-Memory Fallback

**What:** `@upstash/redis` is the correct client for Upstash (HTTP-based, not TCP). Pair it with a simple Map-based in-memory fallback for when Redis is unavailable.

```typescript
// src/lib/redis.ts
import { Redis } from '@upstash/redis';

// In-memory fallback
const memCache = new Map<string, { value: unknown; expiresAt: number }>();

let redisClient: Redis | null = null;
try {
  redisClient = Redis.fromEnv(); // reads UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN
} catch {
  console.warn('Redis init failed, using in-memory fallback');
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  if (redisClient) {
    try {
      return await redisClient.get<T>(key);
    } catch {
      // fall through to memory
    }
  }
  const entry = memCache.get(key);
  if (!entry || Date.now() > entry.expiresAt) return null;
  return entry.value as T;
}

export async function cacheSet(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  if (redisClient) {
    try {
      await redisClient.set(key, value, { ex: ttlSeconds });
      return;
    } catch {
      // fall through to memory
    }
  }
  memCache.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
}
```

### Anti-Patterns to Avoid

- **Bare `auth.uid()` in policies:** Always use `(SELECT auth.uid())`. Bare calls re-evaluate per row, causing 10-100x slowdown on large tables.
- **UPDATE policy without SELECT policy:** PostgreSQL requires a SELECT policy for UPDATE to work. Missing SELECT policy causes silent UPDATE failures.
- **Views without `security_invoker = true`:** Views run as the owner by default and bypass RLS entirely. Any view accessible to anon or authenticated roles needs `WITH (security_invoker = true)`.
- **Missing `WITH CHECK` on INSERT/UPDATE:** Supabase surface requirement; policies without WITH CHECK on INSERT/UPDATE may silently accept invalid data.
- **Manual schema changes in Supabase dashboard:** These are not captured in migration files and will cause state drift. ALL changes must go through `supabase migration new` + `supabase db push`.
- **`deleted_at` soft-delete pattern:** Known to cause RLS WITH CHECK failures from supabase-js (issue #1941). Use `moderation_status` enum instead.
- **Placing GRANT USAGE in the same file as table DDL:** When a migration creates a schema and tables and grants in one file, ordering bugs can cause "schema does not exist" errors. Keep grants in a dedicated migration file.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Migration file management | Custom SQL scripts with manual versioning | `supabase migration new` + `supabase db push` | CLI creates timestamped files, tracks applied migrations in `supabase_migrations.schema_migrations`, handles out-of-order detection |
| Row-level data filtering | Application-level WHERE clauses for auth | PostgreSQL RLS policies | Database enforces at query time — application code cannot bypass it even if buggy |
| Audit/edit history | Custom audit system | AFTER UPDATE PostgreSQL triggers | Triggers are atomic with the update — can't be skipped by application code |
| Redis client for Upstash | ioredis (TCP-based) | @upstash/redis | Upstash only exposes an HTTP/REST endpoint; ioredis requires TCP and will fail to connect |
| In-memory cache with TTL | setTimeout-based manual eviction | Map + expiresAt timestamp pattern | Simple, no external library, covers the fallback need without complexity |

**Key insight:** In this phase, the database layer IS the security layer. Every guard that exists only in application code can be bypassed by a direct Supabase query. RLS must enforce the same rules the API enforces.

---

## Common Pitfalls

### Pitfall 1: UPDATE Policy Without SELECT Policy

**What goes wrong:** UPDATE silently fails — the client gets 0 rows affected rather than an error.
**Why it happens:** PostgreSQL evaluates SELECT policies to determine if the row is "visible" before allowing an UPDATE. No SELECT policy means no rows are visible, so no rows can be updated.
**How to avoid:** Every table with an UPDATE policy must also have a SELECT policy covering the same rows the author can see.
**Warning signs:** `update()` calls from supabase-js return `{ data: [], count: 0 }` with no error.

### Pitfall 2: Missing WITH CHECK on INSERT/UPDATE

**What goes wrong:** RLS appears to work but does not enforce the data constraint on write — any user can INSERT or UPDATE any value in the policy column.
**Why it happens:** USING filters reads. WITH CHECK filters writes. They are separate predicates. An INSERT/UPDATE policy without WITH CHECK has no write guard.
**How to avoid:** Every INSERT policy must have only WITH CHECK (no USING). Every UPDATE policy must have both USING and WITH CHECK.
**Warning signs:** A user can INSERT a row with another user's author_id without error.

### Pitfall 3: View Bypassing RLS

**What goes wrong:** The `published_posts` or `published_replies` view returns all rows including hidden ones, regardless of RLS policies on the underlying table.
**Why it happens:** Views without `security_invoker = true` run as the view owner (typically `postgres` superuser), bypassing all RLS policies.
**How to avoid:** Always create views with `WITH (security_invoker = true)` in PostgreSQL 15+. Supabase's database advisor flags views without this as a security issue.
**Warning signs:** Querying the view as `anon` returns hidden/moderated posts that should be invisible.

### Pitfall 4: connect Schema Not Exposed to PostgREST

**What goes wrong:** API calls to `connect.*` tables return "schema not found" or 404.
**Why it happens:** PostgREST (Supabase's REST layer) only serves schemas listed in its configuration. `public` is included by default; `connect` must be explicitly added.
**How to avoid:** Add `connect` to Supabase Dashboard → Settings → Data API → Exposed schemas. For local dev, configure `supabase/config.toml` with `schemas = ["public", "connect"]`.
**Warning signs:** supabase-js queries to `connect.threads` return 404 or schema errors.

### Pitfall 5: GRANT USAGE Without GRANT on Tables

**What goes wrong:** `anon` role gets "permission denied for schema connect" but after adding GRANT USAGE, gets "permission denied for table threads."
**Why it happens:** `GRANT USAGE ON SCHEMA` allows navigating the schema namespace. It does NOT grant access to objects inside the schema. Table-level grants are required separately.
**How to avoid:** After `GRANT USAGE`, add `GRANT SELECT ON ALL TABLES IN SCHEMA connect TO anon` and the appropriate grants for `authenticated`.
**Warning signs:** `permission denied for table` errors after GRANT USAGE is applied.

### Pitfall 6: Enum Value Removal Is Impossible

**What goes wrong:** A `moderation_status` value (e.g., 'pending') is added and later needs to be removed. There is no `ALTER TYPE DELETE VALUE` command in PostgreSQL.
**Why it happens:** PostgreSQL enums are stored in system catalogs and can have references in index pages even after all table rows are updated.
**How to avoid:** Only define enum values you are certain about in the initial migration. For this phase: `'visible'` and `'hidden'` are sufficient. Do not add `'pending'` or `'flagged'` speculatively.
**Warning signs:** A `moderation_status` value is no longer semantically needed but cannot be removed without a complex migration.

### Pitfall 7: Lock Timeout During db push

**What goes wrong:** `supabase db push` fails with a lock timeout error mid-migration when pushing to a project with active connections.
**Why it happens:** DDL statements like ALTER TABLE acquire access-exclusive locks. If existing connections hold conflicting locks, the migration times out.
**How to avoid:** In migration files, set a reasonable lock timeout at the top: `SET lock_timeout = '10s';`. For initial schema creation (no existing tables), this is not a concern.
**Warning signs:** Migration partially applies; `supabase migration list` shows inconsistent state.

---

## Code Examples

### Complete RLS Policy Block (verified pattern)

```sql
-- Source: https://supabase.com/docs/guides/database/postgres/row-level-security

-- Enable RLS
ALTER TABLE connect.threads ENABLE ROW LEVEL SECURITY;

-- Public reads: only visible threads
CREATE POLICY "threads_select_visible"
ON connect.threads FOR SELECT
TO anon, authenticated
USING (moderation_status = 'visible');

-- Authors can insert their own threads
CREATE POLICY "threads_insert_own"
ON connect.threads FOR INSERT
TO authenticated
WITH CHECK ((SELECT auth.uid()) = author_id);

-- Authors can update their own threads
CREATE POLICY "threads_update_own"
ON connect.threads FOR UPDATE
TO authenticated
USING ((SELECT auth.uid()) = author_id)
WITH CHECK ((SELECT auth.uid()) = author_id);

-- Indexes for all policy columns (same migration)
CREATE INDEX idx_threads_author_id ON connect.threads(author_id);
CREATE INDEX idx_threads_community_id ON connect.threads(community_id);
CREATE INDEX idx_threads_moderation_status ON connect.threads(moderation_status);
```

### Schema and Table DDL

```sql
-- Source: Supabase custom schemas documentation

-- Create schema
CREATE SCHEMA IF NOT EXISTS connect;

-- Enum type
CREATE TYPE connect.moderation_status AS ENUM ('visible', 'hidden');

-- Communities table
CREATE TABLE connect.communities (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id        UUID NOT NULL,           -- references inform.compass_topics if cross-schema FK works
  slug            TEXT NOT NULL UNIQUE,
  name            TEXT NOT NULL,
  description     TEXT,
  member_count    INT NOT NULL DEFAULT 0,
  thread_count    INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Threads table
CREATE TABLE connect.threads (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id         UUID NOT NULL REFERENCES connect.communities(id),
  author_id            UUID NOT NULL,           -- auth.users.id (no FK to auth schema)
  author_display_name  TEXT NOT NULL DEFAULT '', -- snapshotted at INSERT by trigger
  title                TEXT NOT NULL,
  body                 TEXT NOT NULL,
  moderation_status    connect.moderation_status NOT NULL DEFAULT 'visible',
  reply_count          INT NOT NULL DEFAULT 0,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Posts (replies) table
CREATE TABLE connect.posts (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id            UUID NOT NULL REFERENCES connect.threads(id),
  parent_post_id       UUID REFERENCES connect.posts(id), -- NULL = top-level reply
  author_id            UUID NOT NULL,
  author_display_name  TEXT NOT NULL DEFAULT '',
  body                 TEXT NOT NULL,
  moderation_status    connect.moderation_status NOT NULL DEFAULT 'visible',
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Schema Grants

```sql
-- Source: https://supabase.com/docs/guides/api/using-custom-schemas

GRANT USAGE ON SCHEMA connect TO anon, authenticated;

-- anon: read only
GRANT SELECT ON ALL TABLES IN SCHEMA connect TO anon;

-- authenticated: read + write (RLS policies further restrict which rows)
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA connect TO authenticated;

-- Future tables get the same grants automatically
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA connect
  GRANT SELECT ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA connect
  GRANT SELECT, INSERT, UPDATE ON TABLES TO authenticated;
```

### Supabase CLI Migration Workflow

```bash
# One-time: initialize local supabase project
npx supabase init

# Create migrations
npx supabase migration new connect_schema_tables
npx supabase migration new connect_schema_rls
npx supabase migration new connect_schema_views

# Test locally
npx supabase start
npx supabase migration up --local

# Deploy to production
npx supabase link  # prompts for project reference
npx supabase db push
```

### Express Health Endpoint

```typescript
// src/routes/health.ts
import { Router, Request, Response } from 'express';

export const healthRouter = Router();

healthRouter.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `deleted_at TIMESTAMPTZ` for soft delete | `moderation_status` enum | Ongoing (issue #1941 open) | deleted_at WITH CHECK fails from supabase-js client; enum avoids the bug entirely |
| `auth.uid()` in RLS expressions | `(SELECT auth.uid())` | Supabase RLS perf docs (2024) | Up to 94.97% faster — result is cached per statement not per row |
| Views without security_invoker | `WITH (security_invoker = true)` | PostgreSQL 15 / Supabase ~2023 | Views without it silently bypass all RLS — security defect |
| Manual SQL edits in Supabase dashboard | Supabase CLI migrations only | Project architectural decision | Dashboard changes create migration drift; CLI-only is reproducible |
| ts-node for TypeScript execution | tsx | ~2023 | tsx is faster, requires no separate tsconfig |

**Deprecated/outdated:**
- `supabase db diff` as primary migration workflow: still useful for capturing manual changes, but not the primary path. Primary path is `migration new` → write SQL → `migration up` → `db push`.
- `supa_audit` extension: archived as of February 2025. Do not use for new projects. Use custom trigger-based audit tables instead.

---

## Open Questions

1. **Cross-schema FK: `connect.communities` → `inform.compass_topics`**
   - What we know: PostgreSQL supports cross-schema foreign keys natively. The question is whether the `inform` schema exists and is accessible when Phase 1 migrations run.
   - What's unclear: The `inform` schema is managed by a different part of the application. If it doesn't exist when Phase 1 migrations run, the FK will fail. The STATE.md already flags this as a concern for Phase 3.
   - Recommendation: In Phase 1, define `topic_id UUID NOT NULL` without a FK constraint. Add a comment `-- FK to inform.compass_topics(id) — defer until Phase 3 confirms cross-schema access`. This is safe; the FK can be added in a later migration.

2. **`connected_profiles` table location for display name snapshot trigger**
   - What we know: The trigger function `snapshot_author_display_name()` needs to query a profiles table to get `display_name` at INSERT time.
   - What's unclear: The exact schema and table name for the profiles table. It is referenced as `connected_profiles` in REQUIREMENTS.md (PROF-03) but the schema is unspecified.
   - Recommendation: Plan 01-02 should define a `public.connected_profiles` table as part of the foundation. If it belongs to a different schema, document it. The trigger cannot be written until this is settled. This decision must be made in Plan 01-02.

3. **`connect` schema in Supabase PostgREST exposed schemas (config.toml vs dashboard)**
   - What we know: The `connect` schema must be added to exposed schemas for PostgREST to serve it. This can be done in the dashboard or via `supabase/config.toml`.
   - What's unclear: Whether config.toml changes sync to the remote project via `db push` or require a separate step.
   - Recommendation: Add the exposed schema to `config.toml` AND document the dashboard step. Treat both as required.

---

## Sources

### Primary (HIGH confidence)
- https://supabase.com/docs/guides/database/postgres/row-level-security — RLS policy syntax, USING vs WITH CHECK, (SELECT auth.uid()), performance recommendations
- https://supabase.com/docs/guides/database/postgres/enums — enum creation, limitations on value removal
- https://supabase.com/docs/guides/database/postgres/triggers — trigger creation syntax, BEFORE/AFTER, NEW/OLD variables
- https://supabase.com/docs/reference/cli/supabase-migration — migration commands, file naming convention
- https://supabase.com/docs/reference/cli/supabase-db-push — db push flags and behavior
- https://supabase.com/docs/guides/deployment/database-migrations — full migration deployment workflow
- https://supabase.com/docs/guides/api/using-custom-schemas — GRANT USAGE pattern, table-level grants
- https://supabase.com/docs/guides/api/hardening-data-api — schema exposure, grant principles
- https://supabase.com/docs/guides/api/securing-your-api — role overview, anon/authenticated behavior
- https://upstash.com/docs/redis/howto/connectwithupstashredis — @upstash/redis client setup

### Secondary (MEDIUM confidence)
- https://dev.to/datadeer/postgres-views-the-hidden-security-gotcha-in-supabase-ckd — security_invoker view pattern (verified against official Supabase search results confirming PostgreSQL 15 + security_invoker)
- https://github.com/supabase/supabase-js/issues/1941 — RLS WITH CHECK soft-delete bug (open issue, root cause documented)
- https://neon.com/postgresql/postgresql-triggers/postgresql-before-update-trigger — BEFORE UPDATE trigger pattern with history table

### Tertiary (LOW confidence)
- WebSearch results on Express TypeScript project structure 2025 — multiple credible sources agree on src/dist split, feature-based organization, tsx over ts-node

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries verified against official docs and Upstash docs
- Architecture: HIGH — migration workflow, RLS patterns, grant patterns all from official Supabase docs
- Pitfalls: HIGH — most pitfalls derived from official documentation or open GitHub issues with reproducible cases
- Edit history triggers: MEDIUM — pattern is standard PostgreSQL, not Supabase-specific; Supabase trigger docs confirm syntax

**Research date:** 2026-04-15
**Valid until:** 2026-05-15 (30 days — Supabase is fast-moving but migration/RLS fundamentals are stable)
