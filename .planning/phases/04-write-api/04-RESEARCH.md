# Phase 4: Write API + Rate Limiting - Research

**Researched:** 2026-04-16
**Domain:** Express 5/TypeScript write endpoints + Supabase service-role writes + Upstash sliding window rate limiting + cache invalidation
**Confidence:** HIGH

---

## Summary

Phase 4 adds write endpoints (POST create thread, POST create reply, PATCH edit thread, PATCH edit post) on top of the read infrastructure from Phase 3. The codebase uses Express 5.2.1, @supabase/supabase-js 2.103.2, and @upstash/redis 1.37.0. No additional libraries are strictly required for the write routes themselves, but `@upstash/ratelimit` (v2.0.8, not yet installed) is the strongly-recommended library for sliding window rate limiting. Implementing a correct sliding window manually with raw Redis sorted-set commands is significantly more error-prone.

The most important architectural fact for this phase: the existing supabase client uses the **service role key**, which bypasses RLS entirely. This means all ownership checks (only author can PATCH their own content) must be enforced at the application layer, not at the database layer. The pattern is: fetch the record first, compare `record.author_id` with `req.user.id`, return 404 if they do not match (matching Phase 3's hide-existence approach for moderated content). This is already how the Phase 1 RLS policies are written — they exist for direct database access protection, not relied upon by the API.

Cache invalidation is the third key concern. Phase 3's `src/lib/redis.ts` has `cacheGet` and `cacheSet` but no `cacheDel`. A `cacheDel` function must be added, and write routes must call it after successful mutations to prevent stale cache from serving old data. The key format is `fc:{req.path}:{JSON.stringify(req.query)}` — but write routes need to invalidate related read paths by constructing keys explicitly.

**Primary recommendation:** Install `@upstash/ratelimit` v2 for sliding window. Add `cacheDel` to `src/lib/redis.ts`. Enforce ownership in application code. No schema migrations are needed — triggers, RLS, and audit tables already exist from Phase 1.

---

## Standard Stack

### Core (already installed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| express | 5.2.1 | HTTP framework | Already installed; Express 5 auto-catches async errors in route handlers |
| @supabase/supabase-js | 2.103.2 | Database writes | Already installed; service role client bypasses RLS for direct writes |
| @upstash/redis | 1.37.0 | Redis cache | Already installed; `del()` command used for cache invalidation |
| jose | 6.2.2 | JWT verification | Already installed; used by requireAuth middleware |

### Needs Installation

| Library | Version | Purpose | Why |
|---------|---------|---------|-----|
| @upstash/ratelimit | 2.0.8 | Sliding window rate limiting | Official Upstash library — correct sliding window implementation with `success`, `remaining`, `reset` (ms timestamp) return fields; avoids hand-rolling sorted-set Lua scripts |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @upstash/ratelimit | Raw sorted set ZADD/ZREMRANGEBYSCORE/ZCOUNT | Manual implementation is error-prone — race conditions require Lua scripting for atomicity; @upstash/ratelimit handles this correctly |
| Application-layer ownership check | Relying on RLS | The existing supabase client uses the service role key which bypasses RLS — application-layer check is required |

**Installation:**
```bash
npm install @upstash/ratelimit
```

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── lib/
│   ├── redis.ts          # Add cacheDel() function alongside existing cacheGet/cacheSet
│   └── rateLimit.ts      # New: Ratelimit instance (shared bucket, 5/hour per user_id)
├── middleware/
│   ├── auth.ts           # Existing requireAuth (Phase 2)
│   └── tierGuards.ts     # Existing requireConnected (Phase 2)
└── routes/
    ├── threads.ts         # Add POST /communities/:id/threads + PATCH /threads/:id
    └── posts.ts           # Add POST /threads/:id/posts + PATCH /posts/:id
```

Write routes live in the same route files as the Phase 3 read routes. No new route files are needed.

### Pattern 1: POST Write Route (Create Thread or Reply)

**What:** Validates input, checks rate limit, inserts record, invalidates cache, returns 201 + created object.
**When to use:** POST /api/communities/:id/threads and POST /api/threads/:id/posts

```typescript
// Source: codebase + @upstash/ratelimit official docs
threadsRouter.post('/communities/:id/threads', requireAuth, requireConnected, async (req: Request, res: Response) => {
  const { title, body } = req.body;

  // 1. Validate
  const trimmedTitle = (title ?? '').trim();
  const trimmedBody = (body ?? '').trim();
  const errors: Record<string, string> = {};
  if (trimmedTitle.length < 5 || trimmedTitle.length > 150) {
    errors.title = 'Title must be 5–150 characters';
  }
  if (trimmedBody.length < 10 || trimmedBody.length > 5000) {
    errors.body = 'Body must be 10–5,000 characters';
  }
  if (Object.keys(errors).length > 0) {
    res.status(422).json({ errors });
    return;
  }

  // 2. Rate limit (shared bucket: threads + posts)
  const { success, reset } = await rateLimiter.limit(req.user!.id);
  if (!success) {
    const retryAfter = Math.ceil((reset - Date.now()) / 1000);
    res.setHeader('Retry-After', retryAfter);
    res.status(429).json({ reason: 'rate_limited' });
    return;
  }

  // 3. Insert (service role — display name snapshot via DB trigger)
  const { data, error } = await supabase
    .schema('connect')
    .from('threads')
    .insert({
      community_id: req.params.id,
      author_id: req.user!.id,
      title: trimmedTitle,
      body: trimmedBody,
    })
    .select()
    .single();

  if (error || !data) {
    res.status(500).json({ error: { code: 'THREAD_CREATE_FAILED', message: error?.message } });
    return;
  }

  // 4. Invalidate related read cache
  await cacheDel(`fc:/api/communities/${req.params.id}/threads:${JSON.stringify({})}`);
  // (Additional cache keys may need invalidation depending on query param variants)

  res.status(201).json({ data: { /* camelCase fields */ } });
});
```

### Pattern 2: PATCH Edit Route (Edit Thread or Post)

**What:** Fetches record for ownership check, validates input, updates record, invalidates cache, returns 200 + updated object.
**When to use:** PATCH /api/threads/:id and PATCH /api/posts/:id

The key insight: the DB trigger `trg_log_thread_edit` / `trg_log_post_edit` fires automatically when `title` or `body` changes. A PATCH that sends identical content to what is already stored will not fire the trigger (WHEN clause: `OLD.title IS DISTINCT FROM NEW.title OR OLD.body IS DISTINCT FROM NEW.body`). This means the no-op behavior is handled by the DB — the application just does the UPDATE and trusts the trigger to not insert into thread_edits/post_edits if content is unchanged.

```typescript
// Source: codebase migration + Supabase docs
threadsRouter.patch('/threads/:id', requireAuth, requireConnected, async (req: Request, res: Response) => {
  const { title, body } = req.body;

  // 1. At least one field must be present
  if (title === undefined && body === undefined) {
    res.status(422).json({ errors: { _: 'At least one of title or body is required' } });
    return;
  }

  // 2. Validate present fields
  const errors: Record<string, string> = {};
  if (title !== undefined) {
    const t = title.trim();
    if (t.length < 5 || t.length > 150) errors.title = 'Title must be 5–150 characters';
  }
  if (body !== undefined) {
    const b = body.trim();
    if (b.length < 10 || b.length > 5000) errors.body = 'Body must be 10–5,000 characters';
  }
  if (Object.keys(errors).length > 0) {
    res.status(422).json({ errors });
    return;
  }

  // 3. Fetch record — ownership check (service role bypasses RLS, so we check manually)
  const { data: existing, error: fetchError } = await supabase
    .schema('connect')
    .from('threads')
    .select('id, author_id, moderation_status, title, body')
    .eq('id', req.params.id)
    .single();

  // Not found OR not author OR moderated — all return 404 (hide existence)
  if (fetchError || !existing || existing.author_id !== req.user!.id || existing.moderation_status !== 'visible') {
    res.status(404).json({ error: { code: 'THREAD_NOT_FOUND', message: 'Thread not found' } });
    return;
  }

  // 4. Update — DB trigger handles edit history atomically
  const updates: Record<string, string> = {};
  if (title !== undefined) updates.title = title.trim();
  if (body !== undefined) updates.body = body.trim();
  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .schema('connect')
    .from('threads')
    .update(updates)
    .eq('id', req.params.id)
    .select()
    .single();

  if (error || !data) {
    res.status(500).json({ error: { code: 'THREAD_UPDATE_FAILED', message: error?.message } });
    return;
  }

  // 5. Invalidate cache
  await cacheDel(`fc:/api/threads/${req.params.id}:${JSON.stringify({})}`);

  res.status(200).json({ data: { /* camelCase fields */ } });
});
```

### Pattern 3: Rate Limiter Module

**What:** Shared singleton rate limiter instance using `@upstash/ratelimit` sliding window.

```typescript
// src/lib/rateLimit.ts
// Source: https://upstash.com/docs/redis/sdks/ratelimit-ts/gettingstarted
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Shared bucket: thread creation + reply posting = same 5/hour limit per user_id
// Editing does NOT use this limiter
export let postRateLimiter: Ratelimit;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  postRateLimiter = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(5, '1 h'),
    prefix: 'fc:rl',  // rate limit key namespace
  });
} else {
  // Test/dev fallback — always allow
  postRateLimiter = {
    limit: async () => ({ success: true, remaining: 4, reset: Date.now() + 3600000 }),
  } as unknown as Ratelimit;
}
```

### Pattern 4: cacheDel Function

**What:** New function added to `src/lib/redis.ts` for cache invalidation on writes.

```typescript
// Source: @upstash/redis docs - redis.del() command
export async function cacheDel(...keys: string[]): Promise<void> {
  if (redisClient) {
    try {
      await redisClient.del(...keys);
      return;
    } catch (err) {
      console.warn(`[redis] cacheDel error for keys "${keys.join(', ')}" — clearing memory:`, err);
    }
  }
  // In-memory fallback
  for (const key of keys) {
    memoryStore.delete(key);
  }
}
```

### Pattern 5: Response Shape (following Phase 3 conventions)

Phase 3 read responses use camelCase and `{ data: {...} }` envelope. Write responses must match.

**Thread create response (201):**
```typescript
{
  data: {
    id: string,
    title: string,
    body: string,
    authorPseudonym: string,   // = author_display_name (snapshotted by DB trigger)
    replyCount: 0,
    createdAt: string,         // ISO timestamp
    lastActivityAt: string,    // = created_at on creation
  }
}
```

**Post/reply create response (201):**
```typescript
{
  data: {
    id: string,
    body: string,
    authorPseudonym: string,   // = author_display_name (snapshotted by DB trigger)
    createdAt: string,
    updatedAt: string,
    isEdited: false,           // false on creation
  }
}
```

**Thread PATCH response (200):**
```typescript
{
  data: {
    id: string,
    title: string,
    body: string,
    authorPseudonym: string,
    replyCount: number,
    createdAt: string,
    lastActivityAt: string,
    isEdited: true,            // true after any successful PATCH
    updatedAt: string,
  }
}
```

**Post PATCH response (200):**
```typescript
{
  data: {
    id: string,
    body: string,
    authorPseudonym: string,
    createdAt: string,
    updatedAt: string,
    isEdited: true,
  }
}
```

Note: `isEdited` is derived at the API layer. For POST (create): always false. For PATCH (edit): always true (the no-op case returns 200 with the current object, `isEdited: true` if `updated_at > created_at`, `false` otherwise). The most straightforward approach: on PATCH responses, return `isEdited: data.updated_at !== data.created_at`.

### Anti-Patterns to Avoid

- **Relying on RLS for write authorization:** The service role key bypasses RLS. All ownership checks must happen in the application handler.
- **Not invalidating cache after writes:** Phase 3 routes cache thread lists and thread detail. After POST/PATCH, those cache keys will serve stale data unless explicitly deleted.
- **Separate rate limit buckets for threads and posts:** Context.md locks this as a shared 5/hour bucket. One limiter instance, one key prefix, one sliding window.
- **Rate limiting edit operations:** PATCH routes must NOT call the rate limiter — edits are unlimited per CONTEXT.md.
- **Soft-deleting via moderation_status in user-facing routes:** Only moderators (v2+) change moderation_status. User-facing write API must reject DELETE requests with 405 or 404.
- **Calling `.select()` without `.single()` after insert:** Without `.single()`, Supabase returns an array. Always chain `.select().single()` to get the created object back.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Sliding window rate limiting | Custom sorted set ZADD/ZREMRANGEBYSCORE/ZCARD with Lua | `@upstash/ratelimit` Ratelimit.slidingWindow | Correct atomicity via Lua scripts already implemented; `reset` field gives precise ms timestamp for Retry-After header |
| Edit history tracking | Application-level insert to thread_edits/post_edits | Existing DB triggers `trg_log_thread_edit` / `trg_log_post_edit` | Triggers fire atomically with the UPDATE in the same transaction; no partial-state possible |
| Display name snapshot | Reading connected_profiles at write time in application code | Existing DB trigger `trg_threads_snapshot_display_name` / `trg_posts_snapshot_display_name` | Trigger fires on BEFORE INSERT — the INSERT returns the row with author_display_name already populated |
| Content validation library | zod, joi, yup | Plain TypeScript validation (trim → length check → collect errors) | CONTEXT.md rules are simple; no schema library needed; hand-rolled validation is 5 lines |

**Key insight:** The Phase 1 database layer already handles the two hardest write concerns (atomic edit history + display name snapshot). The application layer just needs to INSERT/UPDATE and the DB handles the rest.

---

## Common Pitfalls

### Pitfall 1: Service Role Bypasses RLS — No Ownership Enforcement at DB Layer

**What goes wrong:** PATCH /api/threads/:id succeeds even when the requester is not the author, because the service role key bypasses the `threads_update_own` RLS policy.
**Why it happens:** The `supabase` client in `src/lib/supabase.ts` is initialized with `SUPABASE_SERVICE_ROLE_KEY`. This client has BYPASSRLS and ignores all RLS policies.
**How to avoid:** Always fetch the record first, compare `existing.author_id !== req.user!.id`, and return 404 before executing the UPDATE.
**Warning signs:** Test where a different user successfully edits another user's post — should get 404.

### Pitfall 2: Cache Key Mismatch on Invalidation

**What goes wrong:** After POST /threads, the thread list cache still shows the old (pre-write) version.
**Why it happens:** The cache key format is `fc:${req.path}:${JSON.stringify(req.query)}`. The thread list endpoint `GET /api/communities/:id/threads` may be cached with various query strings (sort=newest, limit=20, cursor=xxx). Deleting only the base key misses parameterized variants.
**How to avoid:** For thread list invalidation, invalidate the base key (no query params). For thread detail invalidation, invalidate `fc:/api/threads/${id}:{}`. Accept that parameterized cursor/sort variants may serve stale data briefly — the TTL is 30 seconds and that's acceptable for v1.
**Warning signs:** Newly created thread not visible after 30 seconds.

### Pitfall 3: Missing `.select()` After Insert/Update

**What goes wrong:** `supabase.from('threads').insert({...})` returns `{ data: null, error: null }` — not the inserted row.
**Why it happens:** PostgREST does not return the created row unless you chain `.select()`. Without it, data is null.
**How to avoid:** Always chain `.insert({...}).select().single()` or `.update({...}).select().single()`.
**Warning signs:** 201 response with null data field.

### Pitfall 4: Rate Limiter Fallback in Tests

**What goes wrong:** Tests fail because `@upstash/ratelimit` tries to connect to Upstash, but UPSTASH env vars are not set in the test environment.
**Why it happens:** `Ratelimit` constructor may throw or the `limit()` call may fail when not configured.
**How to avoid:** The rate limiter module must check for env vars and export a test-safe stub when absent (same pattern as `src/lib/redis.ts`'s in-memory fallback). Alternatively, mock the rate limiter module in tests using `vi.mock()`.
**Warning signs:** Tests throw "UPSTASH_REDIS_REST_URL is not set" or similar.

### Pitfall 5: Trim-Before-Validate Order

**What goes wrong:** A body of 5 spaces passes a "length >= 10" check if length is measured before trimming.
**Why it happens:** CONTEXT.md requires: trim first, then check length and non-whitespace content.
**How to avoid:** `const trimmed = value.trim(); if (trimmed.length < 10) ...` — always trim first.
**Warning signs:** Whitespace-only submission accepted.

### Pitfall 6: reply_count Not Auto-Incremented

**What goes wrong:** After POST /threads/:id/posts, the thread's `reply_count` stays at 0.
**Why it happens:** There is no DB trigger to increment `reply_count` on post insert. The Phase 1 migrations created `reply_count INT NOT NULL DEFAULT 0` but no trigger to maintain it.
**How to avoid:** After a successful post insert, run a separate UPDATE on the thread to increment `reply_count` and update `last_activity_at`. This needs to be done in the POST /threads/:id/posts handler.
**Warning signs:** Thread detail shows `replyCount: 0` after replies are posted.

### Pitfall 7: @upstash/ratelimit reset Field is Milliseconds

**What goes wrong:** `Retry-After` header is set to a value 1000x too large (milliseconds instead of seconds).
**Why it happens:** The `reset` field from `ratelimit.limit()` is a Unix timestamp in **milliseconds**.
**How to avoid:** `const retryAfter = Math.ceil((reset - Date.now()) / 1000)` — always divide by 1000.
**Warning signs:** Retry-After header value is in the millions.

---

## Code Examples

### @upstash/ratelimit Sliding Window (Verified)

```typescript
// Source: https://upstash.com/docs/redis/sdks/ratelimit-ts/gettingstarted
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, '1 h'),
  prefix: 'fc:rl',
});

// In route handler:
const { success, reset, remaining } = await ratelimit.limit(req.user!.id);
if (!success) {
  const retryAfterSeconds = Math.ceil((reset - Date.now()) / 1000);
  res.setHeader('Retry-After', retryAfterSeconds);
  res.status(429).json({ reason: 'rate_limited' });
  return;
}
```

### Supabase Insert + Return Created Row

```typescript
// Source: codebase pattern from src/routes/ + supabase-js docs
const { data, error } = await supabase
  .schema('connect')
  .from('threads')
  .insert({
    community_id: communityId,
    author_id: req.user!.id,
    title: trimmedTitle,
    body: trimmedBody,
  })
  .select('id, title, body, author_display_name, reply_count, created_at, last_activity_at')
  .single();
```

### Supabase Update + Return Updated Row

```typescript
// Source: codebase pattern + supabase-js docs
const { data, error } = await supabase
  .schema('connect')
  .from('threads')
  .update({ title: trimmedTitle, body: trimmedBody, updated_at: new Date().toISOString() })
  .eq('id', threadId)
  .select('id, title, body, author_display_name, reply_count, created_at, last_activity_at, updated_at')
  .single();
```

### reply_count + last_activity_at Maintenance After Post Insert

```typescript
// No DB trigger exists for these counters — must update in application code
await supabase
  .schema('connect')
  .from('threads')
  .update({
    reply_count: existingThread.reply_count + 1,
    last_activity_at: new Date().toISOString(),
  })
  .eq('id', threadId);
```

### cacheDel (New Function for redis.ts)

```typescript
// Source: @upstash/redis docs - redis.del() takes spread string args
export async function cacheDel(...keys: string[]): Promise<void> {
  if (redisClient) {
    try {
      await redisClient.del(...keys);
      return;
    } catch (err) {
      console.warn(`[redis] cacheDel error — clearing memory cache:`, err);
    }
  }
  for (const key of keys) {
    memoryStore.delete(key);
  }
}
```

### Test Pattern for Write Routes (following Phase 3 test conventions)

```typescript
// Source: src/routes/__tests__/read-api.test.ts (Phase 3 pattern extended)
// POST creates: mock accounts API + DB insert response
// PATCH: mock accounts API + fetch-existing + update responses
// Rate limit: mock the rateLimit module with vi.mock()

// For auth tests, mockFetch must include the accounts API /api/account/me response:
// requireAuth calls fetch() for JWT verify (via jose) + accounts API
// The mock sequence for an authenticated write:
// 1. accounts API /api/account/me response (for requireAuth)
// 2. DB query response(s)

mockFetch(
  { body: { id: 'user-uuid', tier: 'connected', account_standing: 'active', completed_onboarding: true, display_name: 'Alice' } }, // accounts API
  { body: { id: 'new-thread-uuid', title: 'Test', body: 'Content here for test', author_display_name: 'Alice', reply_count: 0, created_at: '2026-01-01T00:00:00Z', last_activity_at: '2026-01-01T00:00:00Z' } }, // DB insert
);
```

---

## Schema Analysis for Phase 4

No schema migrations are needed. The Phase 1 and Phase 3 migrations provide all required infrastructure:

| Concern | Provided By | Migration |
|---------|------------|-----------|
| Display name snapshot on INSERT | `trg_threads_snapshot_display_name` / `trg_posts_snapshot_display_name` | 20260415214142 |
| Edit history on UPDATE | `trg_log_thread_edit` / `trg_log_post_edit` with WHEN clause | 20260415214142 |
| Author ownership enforcement | Application layer (service role bypasses RLS) | N/A |
| Audit tables | `connect.thread_edits`, `connect.post_edits` | 20260415214142 |
| last_activity_at on threads | Column added in Phase 3 | 20260416074245 |
| reply_count on threads | Column exists (default 0) | 20260415214142 |

**Gap found:** No trigger to maintain `reply_count` or `last_activity_at` when a post is added. These must be updated in application code after successful post insert. This is 2 extra UPDATE queries per POST /threads/:id/posts call.

---

## Open Questions

1. **No-op PATCH response field: isEdited**
   - What we know: CONTEXT.md leaves "whether PATCH for a no-op returns the object unchanged or a specific message" to Claude's discretion.
   - Recommendation: Always return 200 with the full object. `isEdited` should be derived as `data.updated_at !== data.created_at`. For a no-op (identical content), the DB trigger does not fire, `updated_at` is still set explicitly in the UPDATE (since we always set `updated_at: new Date().toISOString()`). This means even a no-op PATCH will have `updated_at > created_at` and `isEdited: true`. **Alternative:** Don't set `updated_at` explicitly — let the DB default handle it, and only update it when content changes. If we always set `updated_at` in the UPDATE payload, we lose the ability to detect no-ops via timestamp. Simplest: always return `isEdited: true` on any PATCH 200, since the user explicitly submitted an edit even if content was unchanged.
   - Recommendation: Return `isEdited: true` on all successful PATCH responses. Derive `isEdited` on read responses as `updatedAt !== createdAt`.

2. **reply_count race condition on concurrent post inserts**
   - What we know: `reply_count` is updated in application code as `existing + 1`. Concurrent inserts could produce the wrong count.
   - What's unclear: How concurrent is this expected to be in v1?
   - Recommendation: Use a SQL increment (`reply_count = reply_count + 1`) via a raw UPDATE with no fetch — this is atomic at the DB level. `supabase.rpc()` not needed — a plain `supabase.from('threads').update({ reply_count: supabase.sql('reply_count + 1') })` is not possible with supabase-js directly; use a Postgres function or accept the race condition for v1. Simplest v1 approach: `UPDATE connect.threads SET reply_count = reply_count + 1 WHERE id = $1` via `supabase.rpc('increment_reply_count', { thread_id: ... })`.

3. **Cache invalidation key coverage**
   - What we know: Thread list cache keys include query params (sort, limit, cursor). After POST, only the no-param key is invalidated.
   - What's unclear: How many distinct cache key variants exist per thread list path?
   - Recommendation: Accept partial invalidation for v1. The TTL is 30 seconds — stale data resolves quickly. Document this as a known v1 limitation.

---

## Sources

### Primary (HIGH confidence)

- Codebase: `src/lib/redis.ts`, `src/middleware/auth.ts`, `src/middleware/tierGuards.ts`, `src/routes/threads.ts`, `src/routes/posts.ts`, `src/app.ts` — direct inspection of all existing patterns
- Codebase: `supabase/migrations/20260415214142_connect_schema_tables.sql` — trigger definitions verified
- Codebase: `supabase/migrations/20260415214600_connect_schema_rls.sql` — RLS policy definitions verified
- `package.json` — versions confirmed: express 5.2.1, @supabase/supabase-js 2.103.2, @upstash/redis 1.37.0
- https://upstash.com/docs/redis/sdks/ratelimit-ts/gettingstarted — Ratelimit.slidingWindow constructor and limit() return fields
- https://upstash.com/docs/redis/sdks/ratelimit-ts/methods — `reset` field is milliseconds confirmed
- https://upstash.com/docs/redis/sdks/ts/commands/generic/del — `redis.del(...keys)` signature confirmed

### Secondary (MEDIUM confidence)

- npm show @upstash/ratelimit version → 2.0.8 (current version confirmed via npm registry)
- Supabase RLS docs (WebFetch) — service role key bypasses RLS confirmed

### Tertiary (LOW confidence)

- WebSearch re: reply_count race condition — no official source found; pattern is general knowledge

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all versions confirmed from package.json, npm registry, and installed node_modules
- Architecture patterns: HIGH — derived from direct codebase inspection; patterns match Phase 3 conventions
- Schema gaps: HIGH — confirmed by reading all migration files; no trigger for reply_count/last_activity_at maintenance
- Pitfalls: HIGH for service-role/ownership and cache invalidation (verified from code); MEDIUM for reply_count race condition

**Research date:** 2026-04-16
**Valid until:** 2026-05-16 (30 days — stable libraries)
