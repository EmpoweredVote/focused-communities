# Architecture Research

**Domain:** Supabase-backed civic forum platform (Express/TypeScript + React/Tailwind)
**Researched:** 2026-04-15
**Confidence:** HIGH (core patterns verified against official Supabase docs + RLS documentation)

---

## Standard Architecture

### System Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                                   │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │  React/Tailwind (Vite dev / Framer prod)                     │    │
│  │  - Community directory, Community hub, Forum, Thread view    │    │
│  │  - Stance cards (read-only), Thread/reply creation (gated)   │    │
│  └────────────────────────┬─────────────────────────────────────┘    │
└───────────────────────────┼──────────────────────────────────────────┘
                            │ HTTP /api/*
┌───────────────────────────▼──────────────────────────────────────────┐
│                        API LAYER (Render)                             │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │  Express / TypeScript                                        │    │
│  │  - Auth middleware (Supabase JWT → connected_profile check)  │    │
│  │  - Route handlers: communities, threads, posts, stances      │    │
│  │  - Redis cache (Upstash) with in-memory fallback             │    │
│  └────────────────────────┬─────────────────────────────────────┘    │
└───────────────────────────┼──────────────────────────────────────────┘
                            │ Supabase JS client (secret key)
┌───────────────────────────▼──────────────────────────────────────────┐
│                        DATA LAYER (Supabase)                          │
│  ┌─────────────────────┐  ┌──────────────────────────────────────┐  │
│  │  Auth (Supabase)    │  │  PostgreSQL                          │  │
│  │  public.users       │  │  public.connected_profiles           │  │
│  │  JWT issuance       │  │  connect.communities                 │  │
│  │                     │  │  connect.threads                     │  │
│  └─────────────────────┘  │  connect.posts                       │  │
│                            │  connect.post_edits                  │  │
│                            │  inform.compass_topics (read-only)   │  │
│                            │  inform.compass_stances (read-only)  │  │
│                            └──────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Implementation |
|-----------|----------------|----------------|
| React frontend | UI rendering, form state, auth token management | Vite/React/Tailwind; Supabase JS client (publishable key) for auth only |
| Express API | Business logic, auth enforcement, cache, data aggregation | TypeScript; Supabase JS (secret key); Redis middleware |
| Supabase Auth | JWT issuance, session management, user identity | Supabase managed; `public.users` auto-populated |
| PostgreSQL (connect.*) | Forum data: communities, threads, posts, edits | RLS-enforced; migrations only via Supabase CLI |
| PostgreSQL (inform.*) | Compass topics and stances (existing, read-only) | No writes from this app; join via FK |
| Redis (Upstash) | Cache for thread lists, community lists, stance data | TTL-based; invalidated on write; in-memory fallback |

---

## Recommended Project Structure

```
empowered-focused-communities/
├── package.json                  # root workspace
├── backend/
│   ├── src/
│   │   ├── index.ts              # Express app entry, /api/health
│   │   ├── middleware/
│   │   │   ├── auth.ts           # JWT verify → connected_profile lookup
│   │   │   ├── cache.ts          # Redis/in-memory cache middleware
│   │   │   └── error.ts          # Centralized error handler
│   │   ├── routes/
│   │   │   ├── communities.ts    # GET /api/communities, GET /api/communities/:id
│   │   │   ├── stances.ts        # GET /api/communities/:id/stances
│   │   │   ├── threads.ts        # GET/POST /api/communities/:id/threads
│   │   │   └── posts.ts          # GET/POST /api/threads/:id/posts, PATCH /api/posts/:id
│   │   ├── services/
│   │   │   ├── supabase.ts       # Supabase client (secret key), typed from generated types
│   │   │   ├── cache.ts          # Redis + in-memory fallback logic
│   │   │   └── auth.ts           # getUser(), connected_profile resolution
│   │   └── types/
│   │       └── database.types.ts # Generated: supabase gen types --lang typescript
│   ├── supabase/
│   │   └── migrations/           # All schema changes here; never manual SQL on prod
│   ├── tsconfig.json
│   └── package.json
└── frontend/
    ├── src/
    │   ├── main.tsx
    │   ├── lib/
    │   │   ├── supabase.ts       # Supabase JS client (publishable key, auth only)
    │   │   └── api.ts            # Typed fetch wrapper for /api/* routes
    │   ├── components/
    │   │   ├── CommunityCard.tsx
    │   │   ├── StanceCard.tsx
    │   │   ├── ThreadList.tsx
    │   │   ├── ThreadView.tsx
    │   │   └── PostForm.tsx
    │   ├── pages/
    │   │   ├── DirectoryPage.tsx
    │   │   ├── CommunityPage.tsx
    │   │   └── ThreadPage.tsx
    │   └── hooks/
    │       ├── useAuth.ts         # Supabase session + connected_profile status
    │       └── useConnectedAccount.ts
    ├── vite.config.ts
    └── package.json
```

### Structure Rationale

- **backend/supabase/migrations/:** All schema in version control; Supabase CLI applies; no manual prod changes per constraint
- **backend/src/services/supabase.ts:** Single Supabase client using secret key; never exposed to browser
- **backend/src/middleware/auth.ts:** One place that extracts JWT, calls `getUser()`, resolves `connected_profiles`
- **frontend/src/lib/supabase.ts:** Separate client using publishable key; only used for Supabase Auth sign-in/out
- **frontend/src/lib/api.ts:** All data fetching goes through `/api/*`; frontend never queries DB directly

---

## connect.* Schema Design

### Table Definitions

```sql
-- Prerequisite: inform schema has compass_topics and compass_stances (existing)
-- inform.compass_topics: id, title, description, ...
-- inform.compass_stances: id, topic_id, position (1-5), title, body, ...

CREATE SCHEMA IF NOT EXISTS connect;

-- Communities: one per compass topic
CREATE TABLE connect.communities (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id      UUID NOT NULL REFERENCES inform.compass_topics(id),
  slug          TEXT NOT NULL UNIQUE,       -- URL-safe, derived from topic title
  description   TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT communities_topic_unique UNIQUE (topic_id)
);

-- Threads: posted in a community, authored by a connected_profile
CREATE TABLE connect.threads (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id    UUID NOT NULL REFERENCES connect.communities(id),
  author_id       UUID NOT NULL REFERENCES public.connected_profiles(id),
  title           TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 300),
  body            TEXT NOT NULL CHECK (char_length(body) >= 1),
  deleted_at      TIMESTAMPTZ,              -- soft delete only
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Posts/replies: child of thread, authored by a connected_profile
CREATE TABLE connect.posts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id       UUID NOT NULL REFERENCES connect.threads(id),
  parent_post_id  UUID REFERENCES connect.posts(id),  -- NULL = top-level reply
  author_id       UUID NOT NULL REFERENCES public.connected_profiles(id),
  body            TEXT NOT NULL CHECK (char_length(body) >= 1),
  deleted_at      TIMESTAMPTZ,              -- soft delete only
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Edit history: every body change tracked (memory over moderation)
CREATE TABLE connect.post_edits (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id         UUID NOT NULL REFERENCES connect.posts(id),
  previous_body   TEXT NOT NULL,
  edited_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE connect.thread_edits (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id       UUID NOT NULL REFERENCES connect.threads(id),
  previous_title  TEXT,
  previous_body   TEXT,
  edited_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Indexes

```sql
-- Communities
CREATE INDEX communities_topic_id_idx ON connect.communities(topic_id);
CREATE INDEX communities_slug_idx ON connect.communities(slug);

-- Threads
CREATE INDEX threads_community_id_idx ON connect.threads(community_id);
CREATE INDEX threads_author_id_idx ON connect.threads(author_id);
CREATE INDEX threads_created_at_idx ON connect.threads(created_at DESC);
-- Soft-delete filter: partial index for non-deleted threads
CREATE INDEX threads_active_idx ON connect.threads(community_id, created_at DESC)
  WHERE deleted_at IS NULL;

-- Posts
CREATE INDEX posts_thread_id_idx ON connect.posts(thread_id);
CREATE INDEX posts_author_id_idx ON connect.posts(author_id);
CREATE INDEX posts_created_at_idx ON connect.posts(created_at ASC);
-- Soft-delete filter
CREATE INDEX posts_active_idx ON connect.posts(thread_id, created_at ASC)
  WHERE deleted_at IS NULL;

-- Edit history
CREATE INDEX post_edits_post_id_idx ON connect.post_edits(post_id, edited_at DESC);
CREATE INDEX thread_edits_thread_id_idx ON connect.thread_edits(thread_id, edited_at DESC);
```

---

## RLS Policy Patterns

### Schema Grants (required for custom schema exposure)

```sql
-- Grant schema usage to both roles
GRANT USAGE ON SCHEMA connect TO anon, authenticated;

-- Grant SELECT to anonymous (read-open)
GRANT SELECT ON ALL TABLES IN SCHEMA connect TO anon;

-- Grant read + write to authenticated (write-gated)
GRANT SELECT, INSERT, UPDATE ON connect.threads TO authenticated;
GRANT SELECT, INSERT, UPDATE ON connect.posts TO authenticated;
GRANT SELECT, INSERT ON connect.post_edits TO authenticated;
GRANT SELECT, INSERT ON connect.thread_edits TO authenticated;
GRANT SELECT ON connect.communities TO authenticated;

-- Ensure future tables inherit grants
ALTER DEFAULT PRIVILEGES IN SCHEMA connect
  GRANT SELECT ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA connect
  GRANT SELECT, INSERT, UPDATE ON TABLES TO authenticated;
```

### Enable RLS on All Tables

```sql
ALTER TABLE connect.communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE connect.threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE connect.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE connect.post_edits ENABLE ROW LEVEL SECURITY;
ALTER TABLE connect.thread_edits ENABLE ROW LEVEL SECURITY;
```

### Read-Open Policy Pattern

```sql
-- Anyone (anonymous or authenticated) can read non-deleted content
CREATE POLICY "communities_public_read"
  ON connect.communities FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "threads_public_read"
  ON connect.threads FOR SELECT
  TO anon, authenticated
  USING (deleted_at IS NULL);

CREATE POLICY "posts_public_read"
  ON connect.posts FOR SELECT
  TO anon, authenticated
  USING (deleted_at IS NULL);

-- Edit history is publicly readable (memory over moderation)
CREATE POLICY "post_edits_public_read"
  ON connect.post_edits FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "thread_edits_public_read"
  ON connect.thread_edits FOR SELECT
  TO anon, authenticated
  USING (true);
```

### Write-Gated Policy Pattern

The write gate has two layers:
1. Must be authenticated (Supabase role = `authenticated`)
2. Must have a `connected_profiles` record (Connected Account tier)

The `connected_profiles` check inside an RLS policy is a subquery. Wrap it as a set membership test (not a join) per Supabase performance guidance:

```sql
-- Helper: check if current user has a connected_profile
-- Wrap in security definer function to avoid RLS recursion on profiles table
CREATE OR REPLACE FUNCTION connect.has_connected_profile()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.connected_profiles
    WHERE user_id = (SELECT auth.uid())
  );
$$;

-- Threads: connected accounts can INSERT their own
CREATE POLICY "threads_connected_insert"
  ON connect.threads FOR INSERT
  TO authenticated
  WITH CHECK (
    connect.has_connected_profile()
    AND author_id = (
      SELECT id FROM public.connected_profiles
      WHERE user_id = (SELECT auth.uid())
    )
  );

-- Threads: authors can UPDATE their own (soft-delete is UPDATE of deleted_at)
CREATE POLICY "threads_author_update"
  ON connect.threads FOR UPDATE
  TO authenticated
  USING (
    author_id = (
      SELECT id FROM public.connected_profiles
      WHERE user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    author_id = (
      SELECT id FROM public.connected_profiles
      WHERE user_id = (SELECT auth.uid())
    )
  );

-- Posts: same pattern
CREATE POLICY "posts_connected_insert"
  ON connect.posts FOR INSERT
  TO authenticated
  WITH CHECK (
    connect.has_connected_profile()
    AND author_id = (
      SELECT id FROM public.connected_profiles
      WHERE user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "posts_author_update"
  ON connect.posts FOR UPDATE
  TO authenticated
  USING (
    author_id = (
      SELECT id FROM public.connected_profiles
      WHERE user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    author_id = (
      SELECT id FROM public.connected_profiles
      WHERE user_id = (SELECT auth.uid())
    )
  );

-- Edit history: authors can insert their own post's edits
CREATE POLICY "post_edits_author_insert"
  ON connect.post_edits FOR INSERT
  TO authenticated
  WITH CHECK (
    post_id IN (
      SELECT id FROM connect.posts
      WHERE author_id = (
        SELECT id FROM public.connected_profiles
        WHERE user_id = (SELECT auth.uid())
      )
    )
  );
```

**Key policy design notes:**
- No DELETE policies — hard deletes are prohibited by design. Soft-delete is an UPDATE on `deleted_at`.
- The `(SELECT auth.uid())` wrapping (not bare `auth.uid()`) allows Postgres to cache the result per statement, not per row. This is a significant performance optimization per official Supabase guidance.
- `SECURITY DEFINER` on `has_connected_profile()` prevents RLS from recursively checking `connected_profiles` when that table also has RLS.

---

## Authentication Flow (Express Middleware)

```
Browser sends: Authorization: Bearer <supabase_access_token>
                                    ↓
Express auth middleware:
  1. Extract Bearer token from header
  2. Call supabaseAdmin.auth.getUser(token)
     - This validates against Supabase Auth server (not local JWT check)
     - Returns { user: { id, email, ... } } or error
  3. Look up connected_profiles WHERE user_id = user.id
     - If found: req.connectedProfile = profile (id, display_name, ...)
     - If not found: req.user = user only (authenticated but not Connected Account)
  4. Route handlers check req.connectedProfile for write operations
```

**Why `getUser()` not local JWT verification:** Supabase now uses asymmetric keys (RS256) and recommends JWKS-based verification or `getUser()`. The `getUser()` call is authoritative — it detects revoked sessions. Per official docs, local JWT decode (`getClaims()`) only checks signature/expiry, not live session validity.

**Express middleware in TypeScript:**

```typescript
// backend/src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../services/supabase';
import { ConnectedProfile } from '../types';

export interface AuthenticatedRequest extends Request {
  supabaseUser?: { id: string; email?: string };
  connectedProfile?: ConnectedProfile;
}

export async function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return next(); // anonymous — allowed for read routes
  }
  const token = authHeader.slice(7);
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return next(); // invalid token — treat as anonymous

  req.supabaseUser = { id: user.id, email: user.email };

  const { data: profile } = await supabaseAdmin
    .from('connected_profiles')
    .select('id, display_name, user_id')
    .eq('user_id', user.id)
    .single();

  if (profile) req.connectedProfile = profile;
  next();
}

export function requireConnectedAccount(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.connectedProfile) {
    return res.status(403).json({ error: 'Connected Account required' });
  }
  next();
}
```

---

## Architectural Patterns

### Pattern 1: Service Key on Backend, Publishable Key on Frontend

**What:** Backend uses `sb_secret_...` (bypasses RLS — backend enforces authz manually). Frontend uses `sb_publishable_...` (relies on RLS) but only for Supabase Auth sign-in/out. All data fetching goes through `/api/*`.

**When to use:** Always — this is the required pattern for this architecture.

**Why:** The secret key in an Express server on Render is safe. The publishable key in browser code is safe. Mixing them up leads to RLS bypass in the browser (catastrophic) or unnecessary auth friction on the backend.

### Pattern 2: API as Single Source of Truth for Data

**What:** Frontend never queries Supabase directly for forum data. All reads/writes go through `/api/*` endpoints on the Express backend.

**When to use:** Always for connect.* data. Supabase JS in the browser is only used for `supabase.auth.signIn()` and `supabase.auth.signOut()`.

**Why:** Keeps business logic (connected_profile check, Redis cache, rate limiting) in one place. Avoids split between client-RLS and server logic.

### Pattern 3: Cache-Aside with Write Invalidation

**What:** On GET, check Redis first. On miss, query DB and cache the result with TTL. On POST/PATCH, invalidate the relevant cache key(s).

**When to use:** Community list, thread list per community, stance data (stable, long TTL).

**Cache TTL guidelines:**
- `communities:all` — 5 minutes (rarely changes)
- `communities:stances:{community_id}` — 30 minutes (content is static per topic)
- `threads:{community_id}:page:{n}` — 30 seconds (active forums change fast)
- Thread detail + posts — 10 seconds (replies come in fast)

### Pattern 4: Soft Delete via `deleted_at` Column

**What:** No hard deletes. Setting `deleted_at = now()` is the only "delete" operation. RLS SELECT policies filter `WHERE deleted_at IS NULL`. Edit history tables are append-only.

**When to use:** All user-generated content tables (threads, posts). Communities and stances are never deleted.

**Why:** Design principle — memory over moderation. Posts cannot be erased, only contextually marked.

---

## Data Flow

### Read Flow (Anonymous User — Thread List)

```
Browser GET /api/communities/:id/threads?page=1
    ↓
Express router → authMiddleware (no Bearer → req.supabaseUser = undefined)
    ↓
Cache middleware: check Redis key "threads:{id}:page:1"
    ↓ (cache miss)
Supabase admin client: SELECT from connect.threads
  WHERE community_id = :id AND deleted_at IS NULL
  ORDER BY created_at DESC LIMIT 20
  JOIN public.connected_profiles ON author_id = connected_profiles.id
    ↓
Result → store in Redis (TTL 30s) → return JSON
```

### Write Flow (Connected Account — Post Reply)

```
Browser POST /api/threads/:id/posts
  Authorization: Bearer <token>
  Body: { body: "..." }
    ↓
Express router → authMiddleware:
  1. getUser(token) → supabaseUser
  2. connected_profiles lookup → connectedProfile
    ↓
requireConnectedAccount middleware: connectedProfile present → continue
    ↓
Route handler:
  INSERT INTO connect.posts (thread_id, author_id, body)
  VALUES (:threadId, :connectedProfileId, :body)
    ↓
Cache invalidation: DEL "threads:{communityId}:page:*"
    ↓
Return 201 { post: { id, body, author: display_name, created_at } }
```

### Edit Flow (Author Edits Post — Append History)

```
Browser PATCH /api/posts/:id
  Authorization: Bearer <token>
  Body: { body: "new content" }
    ↓
Auth middleware (same as above)
    ↓
Route handler:
  1. Fetch current post.body for history
  2. INSERT INTO connect.post_edits (post_id, previous_body)
  3. UPDATE connect.posts SET body = :newBody, updated_at = now()
     WHERE id = :id AND author_id = :connectedProfileId
  (Both in a transaction — if edit insert fails, update does not happen)
    ↓
Return 200 { post: { id, body, updated_at } }
```

---

## Suggested Build Order

Dependencies must be respected. Schema must exist before API can be tested. API must exist before frontend can be wired.

```
1. FOUNDATION
   ├── Repo scaffold (monorepo, /backend, /frontend, root package.json)
   ├── Backend: Express skeleton, /api/health, TypeScript config
   ├── Frontend: Vite/React skeleton, Tailwind config
   └── Supabase: project connected, CLI configured

2. SCHEMA (no API or UI yet)
   ├── connect schema created
   ├── connect.communities table + indexes
   ├── connect.threads table + indexes
   ├── connect.posts table + indexes
   ├── connect.post_edits, connect.thread_edits tables
   ├── Schema grants (anon/authenticated USAGE + table-level GRANTs)
   ├── RLS enabled + all policies applied
   └── supabase gen types → database.types.ts committed

3. AUTH INFRASTRUCTURE
   ├── Supabase client (secret key) in backend/src/services/supabase.ts
   ├── auth middleware (JWT → getUser → connected_profile)
   ├── requireConnectedAccount guard
   └── Frontend: Supabase Auth sign-in/out (publishable key)

4. READ API (no writes yet — enables frontend to render real data)
   ├── GET /api/communities
   ├── GET /api/communities/:id
   ├── GET /api/communities/:id/stances (join to inform.*)
   ├── GET /api/communities/:id/threads
   └── GET /api/threads/:id/posts

5. REDIS CACHE LAYER
   ├── Upstash Redis client + in-memory fallback service
   ├── Cache middleware applied to read routes
   └── TTL configuration per route type

6. WRITE API
   ├── POST /api/communities/:id/threads (requireConnectedAccount)
   ├── POST /api/threads/:id/posts (requireConnectedAccount)
   ├── PATCH /api/posts/:id (author only, edit history transaction)
   ├── PATCH /api/threads/:id (author only, edit history transaction)
   └── Cache invalidation wired to writes

7. FRONTEND UI
   ├── CommunityDirectory page (GET /api/communities)
   ├── CommunityHub page (stances + thread list)
   ├── ThreadView page (post list)
   ├── PostForm (auth-gated, calls POST endpoints)
   └── Auth gate UI (show sign-in prompt vs form)
```

---

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Supabase Auth | `getUser(token)` on every authenticated request | Authoritative session check; catches revoked sessions |
| Supabase PostgreSQL | `@supabase/supabase-js` with secret key on backend | Service client bypasses RLS — backend enforces authz |
| Upstash Redis | `ioredis` or `@upstash/redis` client | Must fall back to in-memory Map if Redis unavailable |
| inform.compass_topics | Read-only JOIN; no writes from this app | Verify FK reference is accessible from connect schema |
| Render (hosting) | Standard Node.js web service, env vars for secrets | PORT env var, /api/health required |
| Framer (prod frontend) | React components copy-pasted into Framer | Vite build for dev; Framer consumes built components |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Frontend ↔ Backend | HTTP REST, `/api/*` prefix, JSON | Frontend never touches DB directly for data |
| Backend ↔ Supabase | Supabase JS client (secret key) | Single client instance, reused across requests |
| Backend ↔ Redis | Cache-aside pattern | Reads check cache first; writes invalidate |
| connect.* ↔ inform.* | FK reference (topic_id) + JOIN in API queries | inform.* is read-only from this app |
| connect.* ↔ public.* | FK reference (author_id → connected_profiles.id, user_id → users.id) | public schema is managed by Supabase Auth + Connect Account system |

---

## Anti-Patterns

### Anti-Pattern 1: Frontend Querying Supabase Directly for Forum Data

**What people do:** Use Supabase JS client in the browser with the publishable key to `SELECT` from `connect.threads` directly.

**Why it's wrong:** Bypasses the Redis cache layer. Cannot centralize auth logic (connected_profile check). Framer production environment has no Supabase client — everything breaks.

**Do this instead:** All data fetching through `/api/*`. Supabase JS in browser is only for auth sign-in/sign-out.

### Anti-Pattern 2: Using Service Role Key in RLS Policies

**What people do:** Create a backend that uses the service role key, then wonder why RLS policies don't fire.

**Why it's wrong:** Service key bypasses RLS entirely. Backend must enforce authorization checks in application code (`requireConnectedAccount` middleware, author check before UPDATE).

**Do this instead:** Use service key + explicit authz in Express middleware/handlers. Write RLS policies for the Supabase Data API path (if ever used directly), but don't rely on them as the only protection when service key is in play.

### Anti-Pattern 3: Hard Deletes

**What people do:** DELETE FROM connect.posts WHERE id = :id

**Why it's wrong:** Violates the "memory over moderation" design principle. Edit history and soft-delete are the only valid removal patterns.

**Do this instead:** UPDATE connect.posts SET deleted_at = now() WHERE id = :id AND author_id = :connectedProfileId

### Anti-Pattern 4: `auth.uid()` Bare in RLS Policy Expressions (Performance)

**What people do:** `USING (auth.uid() = some_column)` — bare function call evaluated per row.

**Why it's wrong:** PostgreSQL evaluates `auth.uid()` for every row scanned, not once per query.

**Do this instead:** `USING ((SELECT auth.uid()) = some_column)` — the subquery form is cached per statement, not per row. Supabase official docs confirm this can improve performance by over 99% on large tables.

### Anti-Pattern 5: Manual Production Schema Changes

**What people do:** Run SQL directly on the Supabase production console when in a hurry.

**Why it's wrong:** Changes not in migrations are invisible to the team, lost on schema re-creation, and break `supabase db reset`.

**Do this instead:** Every schema change is a migration file in `backend/supabase/migrations/`. Apply with `supabase db push` (or CI).

---

## Scaling Considerations

| Scale | Architecture Notes |
|-------|--------------------|
| 0–1k users | Current monolith is fine. Single Express instance. Redis TTLs prevent DB hammering. |
| 1k–50k users | First bottleneck: thread list queries. Ensure `threads_active_idx` partial index is used. Add `EXPLAIN ANALYZE` monitoring. Consider longer TTLs for stable data (stances). |
| 50k+ users | Consider read replicas for SELECT queries. Cursor-based pagination (keyset on `created_at` + `id`) performs better than offset at this scale. Redis becomes critical, not optional. |

**First bottleneck:** Thread list queries with soft-delete filter. Mitigated by the partial index `WHERE deleted_at IS NULL` and Redis caching.

**Second bottleneck:** `auth.getUser()` call on every authenticated request (one round-trip to Supabase Auth). Mitigated by short-lived in-process token cache (5 min TTL keyed by token hash), invalidated on explicit sign-out.

---

## Sources

### Primary (HIGH confidence)
- Supabase RLS official docs — https://supabase.com/docs/guides/database/postgres/row-level-security — Policy syntax, performance optimizations, `(SELECT auth.uid())` pattern
- Supabase Custom Schema docs — https://supabase.com/docs/guides/api/using-custom-schemas — Schema exposure, grants required
- Supabase API Hardening docs — https://supabase.com/docs/guides/api/hardening-data-api — Per-table grant pattern for custom schemas
- Supabase API Keys docs — https://supabase.com/docs/guides/api/api-keys — Secret key vs publishable key, 2025 migration
- Supabase JWT docs — https://supabase.com/docs/guides/auth/jwts — `getUser()` vs local JWT, JWKS verification

### Secondary (MEDIUM confidence)
- Supabase soft delete discussion — https://github.com/orgs/supabase/discussions/2799 — `deleted_at` column pattern, `deleted_by` for audit
- Supabase RLS performance best practices — https://supabase.com/docs/guides/troubleshooting/rls-performance-and-best-practices-Z5Jjwv (404 at time of research; content sourced from RLS main docs)
- AppSignal pagination guide — https://blog.appsignal.com/2024/05/15/understanding-offset-and-cursor-based-pagination-in-nodejs.html — Cursor vs offset at scale

### Tertiary (LOW confidence — training data)
- Edit history trigger pattern (PostgreSQL audit trigger wiki) — Standard `AFTER UPDATE` trigger appending to history table; not verified against Supabase-specific constraints
- Upstash Redis in-memory fallback implementation — Specific fallback pattern is project-defined; general cache-aside verified

---

*Architecture research for: Focused Communities (civic deliberation forum)*
*Researched: 2026-04-15*
