# Phase 3: Read API + Cache - Research

**Researched:** 2026-04-16
**Domain:** Express/TypeScript read endpoints + Supabase custom schema queries + Redis cache middleware + cross-schema inform.* join
**Confidence:** HIGH (core patterns verified; inform.* schema structure from authoritative project docs; cross-schema limitation verified against official Supabase sources)

---

## Summary

Phase 3 builds all public read endpoints against the connect.* schema established in Phase 1. The work has four distinct technical areas: (1) a cache middleware factory wrapping the already-implemented redis.ts module, (2) community directory and hub endpoints querying connect.* via the existing supabase service client, (3) the stance endpoint which requires a cross-schema join to inform.*, and (4) thread and reply endpoints with cursor pagination.

The single biggest risk is the **inform.* schema access pattern**. The supabase-js PostgREST API cannot do cross-schema joins in a single request — this is a confirmed limitation. The stances endpoint must use one of two strategies: (a) two separate supabase queries merged in application code, or (b) a raw SQL function via `supabase.rpc()`. The latter is cleaner and the recommended approach. A migration creating an RPC function in a safe schema (not inform itself) solves this cleanly.

**Schema gaps must be resolved before route handlers are written.** The `connect.communities` table is missing `slice_label` (TEXT, nullable) and `connect.threads` is missing `last_activity_at` (TIMESTAMPTZ) — both fields required by the API contract in CONTEXT.md. Additionally, the `inform.*` stances table needs a `supporting_points` field (text[]) per the CONTEXT.md prerequisite. These are three migrations that must precede the route work.

**Primary recommendation:** Plan 03-01 covers schema migrations (slice_label, last_activity_at, supporting_points) plus cache middleware. Plans 03-02 through 03-04 implement routes against the corrected schema. All routes are unauthenticated — no auth middleware needed on read paths.

---

## Standard Stack

### Core (already installed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @upstash/redis | 1.37.0 | Redis client for Upstash | Already installed; HTTP-based (no TCP), works on Render |
| @supabase/supabase-js | 2.103.2 | Supabase queries | Already installed; service key client bypasses RLS |
| express | 5.2.1 | HTTP framework | Already installed; Express 5 auto-catches async errors |

### Supporting (needs installation)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| remove-markdown | ^0.6.3 | Strip markdown for excerpts | Thread list excerpt generation (200-char plain text) |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| remove-markdown | Hand-rolled regex | Markdown has too many edge cases for regex; remove-markdown handles GFM, code blocks, inline HTML |
| remove-markdown | strip-markdown (remark plugin) | strip-markdown is ESM-only and requires the full unified/remark pipeline — too heavy for excerpt generation |
| supabase.rpc() for stances | Two separate queries + app-side merge | Both work; rpc() is cleaner and avoids the cross-schema limitation entirely; app-side merge is a valid fallback |

**Installation:**
```bash
npm install remove-markdown
npm install --save-dev @types/remove-markdown
```

Note: `remove-markdown` v0.6.3 is CommonJS. The project uses `"type": "module"` with `"esModuleInterop": true` in tsconfig — import it as a default import:
```typescript
import removeMd from 'remove-markdown';
```
This works because `esModuleInterop: true` + `"module": "Node16"` in tsconfig enables CJS interop.

---

## Schema Gap Analysis

**CRITICAL:** Three schema gaps must be resolved in a Phase 3 migration before route handlers are written.

### Gap 1: slice_label missing from connect.communities

The API contract (CONTEXT.md) requires `sliceLabel` on community list items. The current `connect.communities` table has no such column.

```sql
-- Migration needed:
ALTER TABLE connect.communities ADD COLUMN slice_label TEXT;
-- NULL = not sharded; populated when a community is a named slice of a larger topic
-- Example values: 'Northeast', 'Ages 18-35', etc.
```

Index needed (for queries filtering on sharded communities):
```sql
CREATE INDEX idx_communities_slice_label ON connect.communities(slice_label)
  WHERE slice_label IS NOT NULL;
```

### Gap 2: last_activity_at missing from connect.threads

Thread list sort `?sort=active` requires `lastActivityAt DESC`. The current schema only has `updated_at` (which includes moderation status changes, not just post activity). A dedicated column with correct semantics is required.

```sql
-- Migration needed:
ALTER TABLE connect.threads ADD COLUMN last_activity_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Index for thread list sort:
CREATE INDEX idx_threads_last_activity_at ON connect.threads(community_id, last_activity_at DESC)
  WHERE moderation_status = 'visible';
```

`last_activity_at` is updated by a trigger when a new visible post is added to the thread (Phase 4 write work). For Phase 3 (read-only), it is populated at thread creation time and defaults to `created_at` semantics.

### Gap 3: supporting_points missing from inform.* stances table

Per CONTEXT.md: "`inform.*` stances table needs a `supporting_points` field (text[] or separate table) added before this phase executes."

This is in the **inform schema**, which is owned by the broader Empowered.Vote platform. **This migration must be verified with the inform schema owner (Chris) before writing it.** The researcher cannot confirm the exact current structure of `inform.compass_stances` — only that `supporting_points` is NOT documented in any existing migration.

**Recommendation:** Plan 03-01 must include a task to: (a) verify current `inform.compass_stances` columns via `SELECT column_name FROM information_schema.columns WHERE table_schema = 'inform' AND table_name = 'compass_stances'`, and (b) if `supporting_points` is missing, add `ALTER TABLE inform.compass_stances ADD COLUMN supporting_points TEXT[] NOT NULL DEFAULT '{}';`

**GRANT required for inform schema:** The service-role supabase client bypasses RLS, but the `inform` schema is not in the Supabase config.toml `extra_search_path`. Direct queries to `inform.*` via the supabase-js `.schema()` method also fail unless the inform schema is added to config.toml `schemas` array. The RPC workaround (see below) sidesteps this by running a SQL function.

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── app.ts                         # Mount routes here (Phase 3 adds community/thread routers)
├── lib/
│   ├── redis.ts                   # Already implemented — cacheGet/cacheSet with fallback
│   └── supabase.ts                # Already implemented — service role client
├── middleware/
│   ├── auth.ts                    # Already implemented — not used on read routes
│   └── cache.ts                   # NEW: middleware factory (per-route TTL)
└── routes/
    ├── health.ts                  # Already implemented
    ├── communities.ts             # NEW: GET /api/communities, GET /api/communities/:id
    ├── stances.ts                 # NEW: GET /api/communities/:id/stances
    ├── threads.ts                 # NEW: GET /api/communities/:id/threads
    └── posts.ts                  # NEW: GET /api/threads/:id, GET /api/threads/:id/posts
```

### Pattern 1: Cache Middleware Factory (per-route TTL)

**What:** A factory function that wraps route handlers with a check-cache-first pattern. Each route passes its own TTL in seconds.

**When to use:** All GET read routes in Phase 3. Cache key is built from `req.path + JSON.stringify(req.query)` to include filter/sort/pagination state.

```typescript
// src/middleware/cache.ts
import { cacheGet, cacheSet } from '../lib/redis.js';
import type { Request, Response, NextFunction } from 'express';

export function cacheMiddleware(ttlSeconds: number) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const key = `fc:${req.path}:${JSON.stringify(req.query)}`;
    const cached = await cacheGet<unknown>(key);
    if (cached !== null) {
      res.json(cached);
      return;
    }
    // Monkey-patch res.json to capture the response and cache it
    const originalJson = res.json.bind(res);
    res.json = (body: unknown) => {
      // Only cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cacheSet(key, body, ttlSeconds).catch(() => {});
      }
      return originalJson(body);
    };
    next();
  };
}
```

**TTL constants (from CONTEXT.md):**
```typescript
export const TTL = {
  COMMUNITIES: 5 * 60,    // 5 minutes
  STANCES: 30 * 60,       // 30 minutes
  THREAD_LIST: 30,        // 30 seconds
  THREAD_DETAIL: 30,      // 30 seconds (same as thread list — replies come in fast)
} as const;
```

**Route application:**
```typescript
// In communities router:
router.get('/', cacheMiddleware(TTL.COMMUNITIES), listCommunities);
router.get('/:id', cacheMiddleware(TTL.COMMUNITIES), getCommunity);
router.get('/:id/stances', cacheMiddleware(TTL.STANCES), getStances);
router.get('/:id/threads', cacheMiddleware(TTL.THREAD_LIST), listThreads);
// In threads router:
router.get('/:id', cacheMiddleware(TTL.THREAD_DETAIL), getThread);
router.get('/:id/posts', cacheMiddleware(TTL.THREAD_DETAIL), listPosts);
```

### Pattern 2: Response Envelope

**What:** All responses use the locked envelope shape from CONTEXT.md.

```typescript
// Paginated list response
res.json({
  data: items,
  meta: { cursor: nextCursor, hasMore: items.length === limit }
});

// Single resource response
res.json({ data: item });

// Error response
res.status(404).json({ error: { code: 'COMMUNITY_NOT_FOUND', message: 'Community not found' } });
```

**Limit enforcement:**
```typescript
const DEFAULT_LIMIT = 20; // communities and threads
const POST_DEFAULT_LIMIT = 50; // posts within thread
const MAX_LIMIT = 100;

function parseLimit(query: string | undefined, defaultLimit: number): number {
  const n = parseInt(query ?? '', 10);
  if (isNaN(n) || n < 1) return defaultLimit;
  return Math.min(n, MAX_LIMIT);
}
```

### Pattern 3: Cursor Pagination (keyset on created_at + id)

**What:** Cursor encodes the `created_at` timestamp and `id` of the last item seen. Decoding gives two filter values for the next page.

**Why keyset over offset:** Offset pagination degrades linearly at scale and is inconsistent with concurrent inserts. Keyset is O(log n) with an index.

**Cursor encoding (opaque base64):**
```typescript
// Encode
function encodeCursor(createdAt: string, id: string): string {
  return Buffer.from(JSON.stringify({ createdAt, id })).toString('base64url');
}

// Decode
function decodeCursor(cursor: string): { createdAt: string; id: string } | null {
  try {
    return JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
}
```

**Supabase query pattern (threads, newest first — lastActivityAt DESC):**
```typescript
let query = supabase
  .schema('connect')
  .from('threads')
  .select('id, title, body, author_display_name, reply_count, created_at, last_activity_at')
  .eq('community_id', communityId)
  .eq('moderation_status', 'visible')
  .order('last_activity_at', { ascending: false })
  .order('id', { ascending: false })  // tiebreaker for identical timestamps
  .limit(limit + 1);  // fetch one extra to determine hasMore

if (cursor) {
  const decoded = decodeCursor(cursor);
  if (decoded) {
    // Keyset: rows where (last_activity_at, id) < (cursorTs, cursorId) in DESC order
    query = query.or(
      `last_activity_at.lt.${decoded.createdAt},and(last_activity_at.eq.${decoded.createdAt},id.lt.${decoded.id})`
    );
  }
}
```

**Note on multi-column cursor:** The supabase-js `.or()` with nested `.and()` syntax handles the multi-column keyset condition. This is verified against the supabase GitHub discussion on multi-column cursor pagination.

### Pattern 4: Cross-Schema Stances Join via RPC

**What:** PostgREST (supabase-js) cannot join `connect.*` and `inform.*` in a single request — schemas are isolated in PostgREST. Use a PostgreSQL function via `supabase.rpc()` to execute the cross-schema SELECT inside the database.

**Migration — RPC function:**
```sql
-- Create in 'connect' schema (not in 'inform' which is managed externally)
-- SECURITY DEFINER so it can read inform.* regardless of caller role
CREATE OR REPLACE FUNCTION connect.get_stances_for_community(p_community_id UUID)
RETURNS TABLE (
  position    INT,
  text        TEXT,
  supporting_points TEXT[]
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    s.position,
    s.text,
    COALESCE(s.supporting_points, '{}') AS supporting_points
  FROM connect.communities c
  JOIN inform.compass_stances s ON s.topic_id = c.topic_id
  WHERE c.id = p_community_id
  ORDER BY s.position ASC;
$$;

-- Grant execute to authenticated and anon (stances are public)
GRANT EXECUTE ON FUNCTION connect.get_stances_for_community(UUID) TO anon, authenticated;
```

**TypeScript call:**
```typescript
const { data, error } = await supabase.rpc('get_stances_for_community', {
  p_community_id: communityId
}, {
  schema: 'connect'  // tells supabase-js where the function lives
});
```

**Empty result handling (per CONTEXT.md):** If no stances exist for the topic, return `{ data: [] }` with HTTP 200. The RPC returns an empty array which maps directly.

### Pattern 5: Excerpt Generation

**What:** Strip markdown from thread body, truncate at word boundary to 200 chars with `…` suffix.

```typescript
import removeMd from 'remove-markdown';

export function generateExcerpt(body: string, maxLength = 200): string {
  const plain = removeMd(body, { useImgAltText: false })
    .replace(/\s+/g, ' ')
    .trim();
  if (plain.length <= maxLength) return plain;
  // Truncate at nearest word boundary before maxLength
  const truncated = plain.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  return (lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated) + '\u2026';
}
```

### Pattern 6: Error Handler Middleware (add to app.ts)

**What:** Express 5 automatically calls `next(err)` when an async route handler throws. The global error handler intercepts and formats to the locked envelope shape.

```typescript
// In app.ts — must be registered LAST, after all routes
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[error]', err.message);
  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred'
    }
  });
});
```

### Anti-Patterns to Avoid

- **Using supabase-js `.schema('inform').from('compass_stances')` in an Express route:** The inform schema is not in config.toml `schemas` list. Even if added, supabase-js cannot join across two schema contexts in one request. Use `rpc()` for cross-schema queries.
- **Offset-based pagination:** `OFFSET 100 LIMIT 20` at scale is slow and causes missed/duplicate items on concurrent inserts. Always use keyset cursor.
- **Caching error responses:** Only cache HTTP 200 responses. The middleware patch must check `res.statusCode` before writing to cache.
- **Building excerpt with HTML parser:** Thread bodies are markdown, not HTML. Use `remove-markdown` before truncating — never use an HTML parser for this.
- **`limit = parseInt(req.query.limit)` without validation:** Query params are always strings; undefined or non-numeric values cause NaN. Always validate and cap at MAX_LIMIT = 100.
- **Not adding `last_activity_at` index before writing thread queries:** The default sort is `last_activity_at DESC` with a `community_id` filter — a composite index is required or this scan is O(n) on every request.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Markdown stripping | Custom regex patterns | remove-markdown | Markdown has dozens of GFM edge cases — code fences, nested formatting, images, HTML entities |
| Cursor encoding | Custom delimited string | base64url-encoded JSON | Opaque to client, extensible, safe for URL params, no delimiter collisions |
| Cross-schema stances join | Two separate queries merged in application code | PostgreSQL RPC function | Single round-trip, atomic consistency, no N+1 risk |
| Per-route cache TTL | One global TTL | Middleware factory with TTL param | Different data volatility per resource (5min vs 30sec) |
| Word-boundary truncation | `slice(0, 200)` | Find last space before limit | Mid-word truncation looks broken to users |

**Key insight:** The excerpt generation and cursor encoding are the two most likely to be "hand-rolled badly." The 200-char word-boundary truncation seems trivial but has edge cases (all-whitespace, markdown artifacts, very long words). `remove-markdown` + explicit `lastIndexOf(' ')` is the correct implementation.

---

## Common Pitfalls

### Pitfall 1: inform Schema Not Accessible via supabase-js

**What goes wrong:** `supabase.schema('inform').from('compass_stances').select(...)` throws a "schema not in exposed list" error or returns empty results with no error.

**Why it happens:** The `config.toml` only exposes `["public", "graphql_public", "connect"]`. PostgREST rejects requests to unexposed schemas.

**How to avoid:** Do NOT attempt to add `inform` to the exposed schemas for the stances endpoint. The `inform` schema is a shared platform schema managed separately. Use the `connect.get_stances_for_community()` RPC function instead. The function runs with SECURITY DEFINER in the database context where cross-schema access is native.

**Warning signs:** Error message `PGRST106: The schema must be one of the following` or empty array returned with no error from schema() queries.

### Pitfall 2: Cursor Pagination with Single-Column Order

**What goes wrong:** Using only `created_at` as the cursor causes missing items when two rows share the same timestamp (common in batch inserts or test data).

**Why it happens:** `WHERE created_at < $cursor` skips all rows at that exact timestamp.

**How to avoid:** Always use a two-column keyset: `(last_activity_at, id)` — the UUID `id` is always unique and provides a stable tiebreaker.

**Warning signs:** Integration tests with batch-inserted data show missing or duplicated rows across pages.

### Pitfall 3: Cache Key Collision Between Routes

**What goes wrong:** `/api/communities?q=climate` and `/api/communities/:id/threads?q=climate` hit the same cache key.

**Why it happens:** If the cache key uses only `req.query` without the path, different routes with the same query params collide.

**How to avoid:** Always include `req.path` in the cache key: `fc:${req.path}:${JSON.stringify(req.query)}`. The `fc:` prefix namespaces all Focused Communities keys in the shared Redis instance.

**Warning signs:** Community list returns thread data (or vice versa) on cache hit.

### Pitfall 4: Caching Paginated Results Without Query State

**What goes wrong:** Page 2 of a thread list returns the same data as page 1 because the cursor is not included in the cache key.

**Why it happens:** Middleware reads `req.query` which includes `?cursor=` but only if `JSON.stringify` is used on the full query object (not just specific params).

**How to avoid:** `JSON.stringify(req.query)` captures all query params including cursor. Verify this in tests with cursor-based requests.

**Warning signs:** Infinite scroll loads the same page repeatedly.

### Pitfall 5: Missing Migration for Schema Gaps Before Routes

**What goes wrong:** Route handler for `GET /api/communities` selects `slice_label` from `connect.communities` — column does not exist — Supabase returns a PostgreSQL error.

**Why it happens:** The Phase 1 schema was built without `slice_label` and `last_activity_at` because those fields were defined in Phase 3 planning.

**How to avoid:** Plan 03-01 must be the first plan executed. It contains the schema migrations. Plans 03-02+ must depend on 03-01.

**Warning signs:** `column "slice_label" does not exist` PostgreSQL error on first query.

### Pitfall 6: Express 5 + res.json Monkey-Patch Side Effects

**What goes wrong:** The cache middleware patches `res.json` to capture the response body. If an error handler also calls `res.json`, it double-patches and throws or sends twice.

**Why it happens:** The patched `res.json` calls the original, but if error middleware also goes through the cache middleware, the response is cached and sent, then error middleware tries to send again.

**How to avoid:** Check `res.headersSent` before calling `originalJson` in the patch. Also, register the error handler AFTER all routes in `app.ts` to ensure it doesn't pass through cache middleware.

**Warning signs:** `Cannot set headers after they are sent` error in logs.

### Pitfall 7: reply_count vs. Count Query Discrepancy

**What goes wrong:** `reply_count` on `connect.threads` was set at write time by a trigger/application code. For Phase 3 (read-only), the threads table has `reply_count INT NOT NULL DEFAULT 0` but no write path yet sets it. Thread list items show `replyCount: 0` for all threads even if posts exist.

**Why it happens:** Phase 4 write routes update `reply_count` on INSERT. In Phase 3, if test data is inserted manually, `reply_count` may not be accurate.

**How to avoid:** For Phase 3, use the pre-computed `reply_count` column directly. Document that accuracy depends on write path (Phase 4). In the RLS-verified end-to-end test (plan 03-04), manually set `reply_count` in test data to verify it returns correctly.

**Warning signs:** Integration tests show `replyCount: 0` even when `connect.posts` has rows for that thread.

---

## Code Examples

### Communities List Query

```typescript
// Source: supabase-js official docs + project schema
const { data, error } = await supabase
  .schema('connect')
  .from('communities')
  .select('id, slug, name, description, member_count, thread_count, topic_id, slice_label, created_at')
  .ilike(q ? 'name' : 'id', q ? `%${q}%` : '%')  // see note below on ILIKE
  .order(sort === 'popular' ? 'member_count' : 'created_at', { ascending: false })
  .limit(limit + 1);
```

**Note on ILIKE for search:** The correct supabase-js method is `.ilike(column, pattern)`. For the `?q=` parameter that searches BOTH name AND topic description: topic description comes from `inform.compass_topics.description` which requires a cross-schema lookup. For Phase 3, the `connect.communities` table has its own `description` column (populated at community creation from the inform topic). Use `.or('name.ilike.%{q}%,description.ilike.%{q}%')` — no cross-schema needed.

### Stance RPC Call

```typescript
// Source: Supabase RPC docs + project-specific pattern
const { data, error } = await supabase.rpc(
  'get_stances_for_community',
  { p_community_id: communityId },
  { schema: 'connect' }  // schema where the function lives
);

if (error) {
  return res.status(500).json({ error: { code: 'STANCES_FETCH_FAILED', message: error.message } });
}

// data is an array of { position, text, supporting_points }
// Map to camelCase for API response
const stances = (data ?? []).map(s => ({
  position: s.position,
  text: s.text,
  supportingPoints: s.supporting_points ?? [],
}));

res.json({ data: stances });
```

### Thread List with Cursor

```typescript
// Source: project pattern based on supabase-js filter docs
const limit = parseLimit(req.query.limit as string, 20);
const cursor = req.query.cursor as string | undefined;

let query = supabase
  .schema('connect')
  .from('threads')
  .select('id, title, body, author_display_name, reply_count, created_at, last_activity_at')
  .eq('community_id', req.params.id)
  .eq('moderation_status', 'visible')
  .order('last_activity_at', { ascending: false })
  .order('id', { ascending: false })
  .limit(limit + 1);

if (cursor) {
  const decoded = decodeCursor(cursor);
  if (decoded) {
    query = query.or(
      `last_activity_at.lt.${decoded.lastActivityAt},` +
      `and(last_activity_at.eq.${decoded.lastActivityAt},id.lt.${decoded.id})`
    );
  }
}

const { data, error } = await query;
if (error) { /* handle */ }

const hasMore = data.length > limit;
const items = data.slice(0, limit).map(t => ({
  id: t.id,
  title: t.title,
  excerpt: generateExcerpt(t.body),
  authorPseudonym: t.author_display_name,
  replyCount: t.reply_count,
  createdAt: t.created_at,
  lastActivityAt: t.last_activity_at,
}));

const nextCursor = hasMore
  ? encodeCursor(items[items.length - 1].lastActivityAt, items[items.length - 1].id)
  : null;

res.json({ data: items, meta: { cursor: nextCursor, hasMore } });
```

### Posts (Replies) — Flat Chronological

```typescript
// Thread posts: flat list, all visible, created_at ASC
// No cursor needed per CONTEXT.md (default limit 50, max 100)
const { data, error } = await supabase
  .schema('connect')
  .from('posts')
  .select('id, author_display_name, body, created_at, updated_at')
  .eq('thread_id', req.params.id)
  .eq('moderation_status', 'visible')
  .is('parent_post_id', null)  // top-level posts only in flat view
  .order('created_at', { ascending: true })
  .limit(limit);
```

**Note on `parent_post_id`:** The schema supports nested replies but CONTEXT.md (REPL-01) specifies "flat, chronological." Filter to `parent_post_id IS NULL` or return all posts including nested — confirm with roadmap. REPL-01 says "flat" which means all posts in chronological order regardless of nesting. Use no parent_post_id filter: return ALL visible posts for the thread ordered by `created_at ASC`.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Offset pagination | Keyset/cursor pagination | Supabase community consensus ~2023 | No degradation at scale; consistent with concurrent writes |
| Cross-schema join via .select() | RPC function for cross-schema | PostgREST limitation (ongoing) | Must use rpc() or application-level merge for inform.* stances |
| express-async-errors package | Express 5 native async error catch | Express 5.x (~2024) | No wrapper needed; async route handlers auto-forward thrown errors to next() |
| Global Redis TTL | Middleware factory with per-route TTL | Community pattern 2024 | Different data has different staleness requirements |

**Deprecated/outdated:**
- `OFFSET/LIMIT` pagination: Still works but is O(n) at offset n; do not use for cursor-paginated lists
- `ts-node`: Replaced by `tsx` (already using tsx in this project)
- `ioredis`: TCP-based, does not work with Upstash's HTTP-only endpoint; already using `@upstash/redis`

---

## Open Questions

1. **inform.compass_stances exact column names**
   - What we know: The architecture doc from Phase 1 research says `id, topic_id, position (1-5), title, body` — but `supporting_points` is not in any existing migration.
   - What's unclear: Whether the column is named `text` or `title`+`body` or something else. The CONTEXT.md says the API returns `text` (stance label/description). The actual inform.* column name may differ.
   - Recommendation: Plan 03-01 must run `SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'inform' AND table_name = 'compass_stances'` as a verification step before writing the RPC function. The RPC function must use actual column names.

2. **inform schema GRANT USAGE needed for service key**
   - What we know: The supabase service-role key bypasses RLS but still requires GRANT USAGE ON SCHEMA to access a non-public schema via RPC. RPC functions using SECURITY DEFINER run as the function owner (postgres) which has full access — so GRANT USAGE on inform may not be needed for the RPC path.
   - What's unclear: Whether the service-role client needs explicit grants to call a function that internally reads inform.* data.
   - Recommendation: The SECURITY DEFINER pattern on the RPC function sidesteps role-level grants entirely. If the function executes as postgres, it can read any schema. Test this in plan 03-03 before worrying about grants.

3. **flat vs. nested reply display for posts endpoint**
   - What we know: REPL-01 says "flat, chronological." The schema supports `parent_post_id` for nesting.
   - What's unclear: Whether "flat" means (a) all posts regardless of nesting depth, ordered by created_at, or (b) only top-level posts (parent_post_id IS NULL).
   - Recommendation: Interpret REPL-01 as all visible posts for the thread in created_at ASC order — the "flat" means no tree structure in the response, not that replies-to-replies are excluded. Return all rows from connect.posts WHERE thread_id = :id AND moderation_status = 'visible' ORDER BY created_at ASC. This matches "chronological" and avoids the complexity of tree pagination.

4. **`connect.communities.description` vs. `inform.compass_topics.description` for search**
   - What we know: CONTEXT.md says `?q=` runs ILIKE against "community name AND topic description." The `connect.communities` table has a `description` column. The original architecture doc envisioned this being populated from `inform.compass_topics.description` at community creation.
   - What's unclear: Whether `connect.communities.description` is reliably populated in practice, or whether it's NULL for most communities.
   - Recommendation: Use `connect.communities.description` for the ILIKE search. Document that communities should be created with description populated. If Phase 3 integration tests reveal description is NULL, fall back to name-only search with a code comment.

---

## Sources

### Primary (HIGH confidence)
- `C:\Focused Communities\supabase\migrations\20260415214142_connect_schema_tables.sql` — actual schema: columns present, columns absent (slice_label, last_activity_at)
- `C:\Focused Communities\src\lib\redis.ts` — redis implementation already in place (cacheGet/cacheSet with in-memory fallback)
- `C:\Focused Communities\tsconfig.json` — esModuleInterop: true, module: Node16 — CJS import compatibility confirmed
- https://supabase.com/docs/guides/api/using-custom-schemas — `.schema()` per-query API, one schema per request limitation
- https://github.com/orgs/supabase/discussions/6550 — "could not find a relationship between tables in different schemas" — confirmed limitation, view workaround documented
- https://expressjs.com/en/guide/error-handling.html — Express 5 async error catch is automatic; 4-param error handler pattern
- https://registry.npmjs.org/remove-markdown/latest — version 0.6.3, CJS module, no exports field

### Secondary (MEDIUM confidence)
- https://github.com/orgs/supabase/discussions/3938 — cursor pagination with `.lt()` filter, index recommendation
- https://github.com/orgs/supabase/discussions/21511 — cross-schema limitation "only 1 schema per request" confirmed by maintainer
- https://oneuptime.com/blog/post/2026-02-02-express-redis-caching/view — cache middleware factory pattern with per-route TTL
- `C:\Focused Communities\empowered-vote-primer.md` — inform schema structure (compass_topics, compass_stances, compass_responses) — authoritative project doc

### Tertiary (LOW confidence)
- WebSearch on multi-column keyset cursor with supabase-js `.or()` — pattern derived from docs and GitHub discussions, not a single official tutorial

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries verified installed and version-pinned; remove-markdown verified via npm registry
- Schema gaps: HIGH — verified by reading actual migration files; slice_label and last_activity_at confirmed absent
- Cross-schema limitation: HIGH — confirmed via official Supabase docs and maintainer comment on GitHub
- RPC workaround: MEDIUM — pattern is correct PostgreSQL; exact column names in inform.compass_stances unverified
- Architecture patterns: HIGH — cursor pagination, cache middleware factory, response envelope from official sources + project decisions
- Pitfalls: HIGH — derived from real schema state (gap 5), official PostgREST limitation (pitfall 1), and known Express patterns

**Research date:** 2026-04-16
**Valid until:** 2026-05-16 (30 days — supabase-js v2 API is stable; cross-schema limitation is a PostgREST architectural constraint, not likely to change)
