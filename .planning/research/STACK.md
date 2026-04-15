# Stack Research

**Domain:** Civic deliberation forum (threads + replies on Supabase + Express + React)
**Researched:** 2026-04-15
**Confidence:** HIGH (mandated core stack validated; library recommendations HIGH/MEDIUM; patterns verified against official docs)

---

## Recommended Stack

The core stack is mandated. This document validates it, selects the surrounding libraries, and documents exact patterns for the forum domain.

### Core Technologies (Mandated — Validated)

| Technology | Version | Purpose | Validation |
|------------|---------|---------|------------|
| Supabase | Managed (2.x client) | PostgreSQL + Auth + RLS + Storage + Realtime | Production-ready; Realtime Broadcast now recommended over postgres_changes for scalability |
| @supabase/supabase-js | ^2.99.x | JS/TS client for all Supabase APIs | Latest stable is 2.99.3; dropped Node 18 support at 2.79.0 — use Node 20+ |
| Express.js | ^4.x | Backend API server (all routes under /api/) | Standard; Express 5.x exists but ecosystem still largely on v4 |
| TypeScript | ^5.x | Language everywhere | Standard |
| Vite | ^6.x | Dev frontend build tool | Latest major is v6; @tailwindcss/vite plugin is the official Tailwind v4 integration |
| React | ^19.x | UI framework | Current stable; TanStack Query v5 requires React 18+ |
| Tailwind CSS | ^4.x | Utility CSS | v4 released 2025; breaking config change — no tailwind.config.js, CSS-based @theme |
| Upstash Redis | @upstash/redis ^1.x, @upstash/ratelimit ^2.0.8 | Rate limiting + session caching with in-memory fallback | @upstash/ratelimit 2.0.8 is current; works in Express via standard npm |

### Supporting Libraries — Backend

| Library | Version | Purpose | Rationale |
|---------|---------|---------|-----------|
| zod | ^3.x (stable) | Request body/query validation + TypeScript type inference | Zod v4 released August 2025 with 14x faster parsing, but ecosystem compatibility (ORMs, adapters) not fully settled — use v3 now, plan migration; zero dependencies, TypeScript-native |
| helmet | ^8.x | HTTP security headers (15 headers in one middleware) | Express security baseline; CSP, HSTS, X-Frame-Options out of the box |
| cors | ^2.x | CORS policy enforcement | Pair with allowlist of Framer production domain + localhost dev |
| express-rate-limit | ^7.x | IP-level rate limiting (fallback when Redis unavailable) | 10M+ weekly downloads; combine with @upstash/ratelimit for Redis-backed limiting |
| @upstash/ratelimit | ^2.0.8 | Redis-backed rate limiting (sliding window, token bucket) | Algorithms: fixed window, sliding window, token bucket; use sliding window for post creation anti-spam |
| morgan | ^1.x | HTTP request logging | Lightweight; pairs with console in dev, structured JSON in prod |

### Supporting Libraries — Frontend

| Library | Version | Purpose | Rationale |
|---------|---------|---------|-----------|
| @tanstack/react-query | ^5.99.x | Server state, caching, pagination, optimistic updates | Current stable 5.99.0; v5 is ~20% smaller than v4; useSuspenseQuery now stable; the standard for async state in React |
| @supabase/supabase-js | ^2.99.x | Realtime subscriptions from React client | Same client used on backend; Realtime Broadcast subscriptions via .channel() |
| date-fns | ^3.x | Date formatting (post timestamps, "2 hours ago") | Tree-shakeable; no Moment.js |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| tsx | TypeScript execution for Express dev | Replaces ts-node; faster, supports ESM |
| vitest | Unit/integration testing | Vite-native; works with both frontend and backend code |
| @types/express, @types/cors, @types/morgan | TypeScript types | Install as devDependencies |

---

## Installation

```bash
# Backend (Express server)
npm install @supabase/supabase-js zod helmet cors express-rate-limit @upstash/ratelimit @upstash/redis morgan

# Backend dev dependencies
npm install -D typescript @types/node @types/express @types/cors @types/morgan tsx vitest

# Frontend (Vite + React dev environment)
npm install @tanstack/react-query @supabase/supabase-js date-fns

# Frontend dev dependencies
npm install -D tailwindcss @tailwindcss/vite @vitejs/plugin-react typescript @types/react @types/react-dom vitest
```

---

## Alternatives Considered

| Recommended | Alternative | Why Not |
|-------------|-------------|---------|
| Zod v3 | Zod v4 | v4 released August 2025 — ecosystem adapters (drizzle-zod, etc.) not fully stabilized; migrate after ecosystem catches up |
| Zod | express-validator | express-validator has no TypeScript type inference; you'd define types twice; Zod is now the standard for TypeScript-first APIs |
| @tanstack/react-query | SWR | TanStack Query has better optimistic updates, more powerful cache invalidation, and better ecosystem support as of 2025 |
| Broadcast (Realtime) | postgres_changes (Realtime) | Supabase docs explicitly recommend Broadcast for scalability; postgres_changes described as "does not scale as well" |
| express-rate-limit + Upstash | redis-rate-limit (custom) | Don't hand-roll rate limiting; @upstash/ratelimit provides sliding window out of the box with in-memory fallback |
| Tailwind v4 | Tailwind v3 | v4 is current; v3 uses deprecated config format; v4 has 5x faster builds and automatic content detection |
| date-fns | Moment.js | Moment.js is in maintenance mode; date-fns is tree-shakeable and actively maintained |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Moment.js | Maintenance mode since 2020; large bundle size | date-fns v3 |
| Custom rate limiting logic | Sliding window has subtle edge cases; concurrency bugs under load | @upstash/ratelimit (sliding window algorithm) |
| Offset pagination (OFFSET N LIMIT 20) | Gets progressively slower as forum grows; page 500 requires scanning 10,000 rows | Keyset/cursor pagination via .lt('created_at', cursor).order('created_at', {ascending: false}).limit(20) |
| Direct Supabase client from frontend for writes | Bypasses /api/ Express layer; loses rate limiting, validation, audit log control | All mutations go through Express /api/ routes |
| postgres_changes Realtime for high-load | Supabase docs: "does not scale as well"; processes on a single thread | Broadcast + database triggers via realtime.broadcast_changes() |
| Nested set model for thread hierarchy | Write operations are expensive (requires rewriting many rows); forum replies rarely move | Adjacency list (parent_id) with recursive CTE for deep queries |
| Closure table for forum replies | Overkill for 2-level forum (threads → replies); high disk usage; complex writes | Flat adjacency list — forum depth ≤ 2 means no recursive queries needed |
| tailwind.config.js | Deprecated in Tailwind v4 | @theme directive in main CSS file |
| Zod v4 (yet) | Ecosystem adapters not stabilized as of August 2025 | Zod v3 — stable, well-supported, plan upgrade in ~6 months |

---

## Postgres Schema Pattern — Threads and Replies

The forum is intentionally shallow (threads + one level of replies). This eliminates the need for recursive CTEs in normal operation.

```sql
-- Topics/hubs that own forums
create table public.compass_topics (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  title       text not null,
  created_at  timestamptz default now()
);

-- Forum threads (top-level posts)
create table public.forum_threads (
  id              uuid primary key default gen_random_uuid(),
  topic_id        uuid not null references public.compass_topics(id),
  author_id       uuid not null references public.connected_profiles(id),
  display_name    text not null,          -- snapshot of pseudonym at post time
  body            text not null,
  created_at      timestamptz default now(),
  -- NO updated_at — edits are append-only per product rules
  -- NO deleted_at — no deletes per product rules ("memory over moderation")
  pinned          boolean default false
);

-- Replies to threads (one level deep — NOT recursive)
create table public.forum_replies (
  id              uuid primary key default gen_random_uuid(),
  thread_id       uuid not null references public.forum_threads(id) on delete restrict,
  author_id       uuid not null references public.connected_profiles(id),
  display_name    text not null,          -- snapshot of pseudonym at reply time
  body            text not null,
  created_at      timestamptz default now()
  -- NO parent_reply_id — flat reply model keeps it simple
  -- If threaded replies added later: add parent_reply_id nullable + recursive CTE
);

-- Required indexes
create index idx_forum_threads_topic_id    on public.forum_threads(topic_id, created_at desc);
create index idx_forum_replies_thread_id   on public.forum_replies(thread_id, created_at asc);
create index idx_forum_threads_author_id   on public.forum_threads(author_id);
create index idx_forum_replies_author_id   on public.forum_replies(author_id);
```

**Why snapshot `display_name`:** The `connected_profiles.display_name` might change. Forum posts need to show the name at post time ("memory over moderation" — the record is immutable). Store it on insert via trigger or application code.

**Why `on delete restrict` on `thread_id`:** No deletes is a product rule. `RESTRICT` prevents accidental cascades from infrastructure mistakes.

---

## RLS Patterns — Read-Open / Post-Gated

**The model:** Anyone (including anonymous visitors) can read threads and replies. Only users with a `connected_profiles` record can insert. No updates, no deletes.

```sql
-- ============================================================
-- Enable RLS on forum tables
-- ============================================================
alter table public.forum_threads enable row level security;
alter table public.forum_replies enable row level security;

-- ============================================================
-- THREADS: Public SELECT
-- ============================================================
create policy "forum_threads_select_public"
on public.forum_threads for select
to anon, authenticated
using ( true );

-- ============================================================
-- THREADS: INSERT requires connected_profiles record
-- ============================================================
create policy "forum_threads_insert_connected_only"
on public.forum_threads for insert
to authenticated
with check (
  -- Author must match the authenticated user
  author_id = (
    select cp.id
    from public.connected_profiles cp
    where cp.user_id = (select auth.uid())
    limit 1
  )
  -- The subquery implicitly verifies connected_profiles exists;
  -- if no record, author_id won't match anything and policy fails
);

-- ============================================================
-- REPLIES: Same pattern
-- ============================================================
create policy "forum_replies_select_public"
on public.forum_replies for select
to anon, authenticated
using ( true );

create policy "forum_replies_insert_connected_only"
on public.forum_replies for insert
to authenticated
with check (
  author_id = (
    select cp.id
    from public.connected_profiles cp
    where cp.user_id = (select auth.uid())
    limit 1
  )
);

-- UPDATE and DELETE: intentionally omitted — no policy = blocked by RLS
```

**Key RLS Implementation Notes:**
- Wrap `auth.uid()` in a `select` subquery: `(select auth.uid())` — Postgres caches this per statement instead of evaluating per row. Critical for tables with many rows.
- The INSERT policy's `with check` (not `using`) enforces the constraint on the new row being written.
- Omitting UPDATE and DELETE policies is the correct way to disable them under RLS — no explicit "deny" policy needed.
- Index `connected_profiles(user_id)` for the subquery performance. If this lookup is frequent, consider a security definer function:

```sql
-- Optional: security definer function to avoid RLS recursion on connected_profiles
create or replace function public.get_connected_profile_id()
returns uuid
language sql
security definer
stable
as $$
  select id from public.connected_profiles
  where user_id = auth.uid()
  limit 1
$$;

-- Then use in policy:
-- with check ( author_id = (select public.get_connected_profile_id()) )
```

---

## Realtime Pattern — Broadcast via Database Triggers

**Decision:** Use Supabase Realtime **Broadcast** (not `postgres_changes`). Supabase docs state Broadcast "is the recommended method for scalability and security" and that postgres_changes "does not scale as well."

For the forum use case (new thread appears, new reply appears), Broadcast with a database trigger is the pattern.

```sql
-- Trigger function: broadcast new thread to topic channel
create or replace function public.broadcast_new_thread()
returns trigger
security definer set search_path = ''
language plpgsql
as $$
begin
  perform realtime.broadcast_changes(
    'forum:topic:' || NEW.topic_id::text,  -- channel name
    TG_OP,
    TG_OP,
    TG_TABLE_NAME,
    TG_TABLE_SCHEMA,
    NEW,
    OLD
  );
  return null;
end;
$$;

create trigger broadcast_forum_thread_changes
after insert on public.forum_threads
for each row execute function public.broadcast_new_thread();

-- Same pattern for replies (channel: 'forum:thread:{thread_id}')
create or replace function public.broadcast_new_reply()
returns trigger
security definer set search_path = ''
language plpgsql
as $$
begin
  perform realtime.broadcast_changes(
    'forum:thread:' || NEW.thread_id::text,
    TG_OP,
    TG_OP,
    TG_TABLE_NAME,
    TG_TABLE_SCHEMA,
    NEW,
    OLD
  );
  return null;
end;
$$;

create trigger broadcast_forum_reply_changes
after insert on public.forum_replies
for each row execute function public.broadcast_new_reply();
```

**Client-side subscription (React):**
```typescript
// Subscribe to new threads for a topic
const channel = supabase
  .channel(`forum:topic:${topicId}`)
  .on('broadcast', { event: 'INSERT' }, (payload) => {
    // Invalidate TanStack Query cache to refetch thread list
    queryClient.invalidateQueries({ queryKey: ['threads', topicId] });
  })
  .subscribe();

// Subscribe to new replies in a thread
const replyChannel = supabase
  .channel(`forum:thread:${threadId}`)
  .on('broadcast', { event: 'INSERT' }, (payload) => {
    queryClient.invalidateQueries({ queryKey: ['replies', threadId] });
  })
  .subscribe();
```

**Important:** Broadcast from Database requires Realtime Authorization (private channels + RLS on `realtime.messages`). Set the channel as private and ensure the user's JWT is passed via `supabase.realtime.setAuth()`.

---

## Pagination Pattern — Cursor-Based (Keyset)

Use cursor-based pagination for thread lists and reply lists. Never use OFFSET-based pagination for forum content — it degrades linearly as content grows.

```typescript
// Express route: GET /api/forum/:topicId/threads?cursor=<created_at>&limit=20
router.get('/forum/:topicId/threads', async (req, res) => {
  const { cursor, limit = '20' } = req.query;
  const parsedLimit = Math.min(parseInt(limit as string, 10), 50);

  let query = supabase
    .from('forum_threads')
    .select('id, display_name, body, created_at, topic_id')
    .eq('topic_id', req.params.topicId)
    .order('created_at', { ascending: false })
    .limit(parsedLimit + 1); // fetch one extra to detect next page

  if (cursor) {
    query = query.lt('created_at', cursor as string);
  }

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });

  const hasMore = data.length > parsedLimit;
  const threads = hasMore ? data.slice(0, parsedLimit) : data;
  const nextCursor = hasMore ? threads[threads.length - 1].created_at : null;

  return res.json({ threads, nextCursor, hasMore });
});
```

**TanStack Query: useInfiniteQuery for forum thread list:**
```typescript
const { data, fetchNextPage, hasNextPage } = useInfiniteQuery({
  queryKey: ['threads', topicId],
  queryFn: ({ pageParam }) =>
    fetch(`/api/forum/${topicId}/threads?cursor=${pageParam ?? ''}&limit=20`)
      .then(r => r.json()),
  initialPageParam: undefined,
  getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
});
```

---

## Rate Limiting Pattern — Anti-Spam for Post Creation

Use `@upstash/ratelimit` with sliding window on forum POST endpoints. Provide in-memory fallback when Redis is unavailable (development + Redis downtime resilience).

```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Initialize with in-memory fallback
const ratelimit = process.env.UPSTASH_REDIS_REST_URL
  ? new Ratelimit({
      redis: new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      }),
      limiter: Ratelimit.slidingWindow(5, '1 m'), // 5 posts per minute per user
    })
  : null; // falls through to express-rate-limit fallback

// Middleware
export async function forumRateLimit(req, res, next) {
  if (!ratelimit) return next(); // dev: no Redis
  const identifier = req.user?.id ?? req.ip;
  const { success, limit, remaining } = await ratelimit.limit(identifier);
  if (!success) {
    return res.status(429).json({ error: 'Too many posts. Please slow down.' });
  }
  return next();
}
```

---

## Tailwind v4 Setup (Vite)

Tailwind v4 breaks from v3. No `tailwind.config.js`. The Vite plugin is the recommended integration.

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
});
```

```css
/* src/index.css — no @tailwind directives */
@import "tailwindcss";

@theme {
  /* Custom design tokens if needed */
  --color-civic-blue: oklch(0.55 0.18 240);
}
```

**Warning:** Do not follow Tailwind v3 setup guides. The PostCSS plugin still works but the Vite plugin is preferred for performance.

---

## Stack Patterns by Variant

**When the user is anonymous (no Supabase session):**
- Frontend: Supabase anon key; SELECT queries work (RLS allows anon reads)
- Blocked: POST /api/forum/* returns 401 before hitting Supabase
- Express middleware checks `Authorization: Bearer <supabase_jwt>` header; validate with `supabase.auth.getUser(token)`

**When the user is authenticated but has no `connected_profiles` record:**
- Express middleware: verify connected_profiles exists before forum write endpoints
- Return HTTP 403 with `{ error: 'connected_account_required' }` — frontend can prompt enrollment

**When Redis (Upstash) is unavailable:**
- `@upstash/ratelimit` initialization skipped
- `express-rate-limit` provides coarser IP-based fallback
- Forum remains functional; slightly weaker anti-spam

---

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| @supabase/supabase-js ^2.99 | Node.js 20+ | Node 18 dropped at 2.79.0 |
| zod ^3.x | TypeScript ^4.5+ | v4 released but ecosystem adapters still stabilizing |
| @tanstack/react-query ^5.x | React ^18+ or ^19+ | v5 requires React 18 minimum |
| tailwindcss ^4.x | Vite ^5+ or ^6+ | Requires @tailwindcss/vite plugin; not compatible with old postcss-only setup |
| @upstash/ratelimit ^2.0.8 | @upstash/redis ^1.x | Must use matching Upstash Redis client |

---

## Sources

### Primary (HIGH confidence)
- Supabase RLS official docs — https://supabase.com/docs/guides/database/postgres/row-level-security — SELECT/INSERT policy patterns, auth.uid() optimization
- Supabase Realtime: Broadcast — https://supabase.com/docs/guides/realtime/broadcast — trigger setup, channel patterns, Broadcast vs postgres_changes recommendation
- Supabase Realtime: Subscribing to DB Changes — https://supabase.com/docs/guides/realtime/subscribing-to-database-changes — Broadcast recommended; postgres_changes not deprecated but limited
- Supabase Realtime: Postgres Changes — https://supabase.com/docs/guides/realtime/postgres-changes — subscription patterns, RLS/filter limitations
- Supabase JS client npm — https://www.npmjs.com/package/@supabase/supabase-js — confirmed 2.99.3 current stable
- TanStack Query v5 npm — https://www.npmjs.com/package/@tanstack/react-query — confirmed 5.99.0 current stable
- Tailwind CSS v4 blog — https://tailwindcss.com/blog/tailwindcss-v4 — Vite plugin setup, @theme directive, breaking changes
- @upstash/ratelimit npm — https://www.npmjs.com/package/@upstash/ratelimit — confirmed 2.0.8 current; sliding window algorithm

### Secondary (MEDIUM confidence)
- WebSearch: PostgreSQL adjacency list + recursive CTE performance — Ackee blog, cybertec-postgresql.com — index on parent_id critical; adjacency list recommended for forums
- WebSearch: Zod v4 vs v3 — InfoQ announcement + GitHub issues — v4 stable but ecosystem adapters not fully settled; zod v3 safer now
- WebSearch: express-validator vs Zod 2025 — leadwithskills.com, betterstack.com — Zod is standard for TypeScript-first APIs
- WebSearch: Express security middleware — expressjs.com/en/advanced/best-practice-security — helmet, cors, express-rate-limit as baseline

### Tertiary (LOW confidence — flag for validation)
- RLS INSERT requiring SELECT policy — mentioned in GitHub discussions, not verified in official docs; validate this during implementation: in Postgres, INSERT policy alone is sufficient; SELECT is not required for INSERT to succeed (unlike some community claims)

---

## Open Questions

1. **Framer integration for posts:** Framer production frontend consumes React components copy-pasted in. Forum post form (React) needs to know the Supabase JWT or send via `/api/` — confirm the auth flow between Framer and Express backend is established before implementing forum write routes.

2. **Zod v4 timeline:** Zod v4 was released August 2025 with significant performance improvements. The recommendation is v3 now, but monitor ecosystem adoption (drizzle-zod, tRPC, etc.) for upgrade opportunity in Q3 2026.

3. **Realtime Broadcast authorization:** Broadcast from Database requires private channels + Realtime Authorization (RLS on `realtime.messages`). Verify the Supabase plan supports this feature — it requires Realtime Auth to be enabled on the project.

4. **Display name snapshot strategy:** The schema stores `display_name` on each post row. Decide whether the application layer snapshots it on insert (simpler) or a Postgres trigger copies it (safer against application bugs). Trigger approach is more robust.

---

*Stack research for: Focused Communities — civic deliberation forum (threads + replies)*
*Researched: 2026-04-15*
*Valid until: 2026-07-15 (stable stack; check Zod v4 ecosystem status at ~30 days)*
