# Phase 6: Entry Points + Deployment - Research

**Researched:** 2026-04-17
**Domain:** Express API extension, React header nav, spec document authoring, production deployment verification
**Confidence:** HIGH — all findings from direct codebase inspection

## Summary

Phase 6 has three distinct workstreams: (1) a new backend API endpoint plus a frontend header link, (2) three spec documents (Accounts handoff, Compass integration, EV Post History Standard), and (3) a production deployment checklist. No new infrastructure is needed — the custom domain, Render deployment, and Supabase schema are already in place.

The post history API (`GET /api/users/:id/posts`) follows the exact same cursor-based pattern established in `threads.ts` and `communities.ts`. The required columns (`posts.author_id`, `posts.thread_id`, `posts.body`, `posts.created_at`, `posts.updated_at`, `threads.title`, `threads.community_id`, `communities.name`) all exist in the current schema. The query is a two-join SELECT with an author_id equality filter and cursor pagination on `created_at`/`id`.

The frontend header link ("Your activity") requires adding a conditional rendered `<a>` or `<Link>` inside the authenticated state rendering paths. Currently there is no persistent header component — each page renders its own layout independently. A shared header component does not yet exist and must be added. The "Your activity" link is visible only in `connected` and `connected_no_compass` auth states.

For the deployment checklist, `Cache-Control: private, no-store` is NOT yet implemented on auth-touching routes — `requireAuth` does not set it, and `cacheMiddleware` does not set it. The bundle scan verification shows the current production bundle (one JS file: `frontend/dist/assets/index-C28pZxhm.js`) contains no `service_role` or Supabase key strings. UptimeRobot setup requires a manual step against the live `/api/health` endpoint.

**Primary recommendation:** Use `threads.ts` cursor pagination as the exact template for the post history endpoint. Add the `Cache-Control` header inside `requireAuth` middleware so all protected routes get it automatically. Build a shared `Header` component rather than duplicating the nav link across pages.

## Standard Stack

No new libraries are needed. All work uses existing stack.

### Core (already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| express | ^5.2.1 | Route registration | Already used for all endpoints |
| @supabase/supabase-js | ^2.103.2 | DB queries with joins | Service role client already available |
| react | ^19.2.4 | Frontend component | Existing app |
| react-router | ^7.14.1 | Link component | Already used |

### No New Dependencies Required

All Phase 6 work uses libraries already in `package.json` and `frontend/package.json`. Do not add new dependencies.

## Architecture Patterns

### Pattern 1: Cursor-Paginated GET Endpoint (follow threads.ts exactly)

**What:** Backend list endpoint with cursor-based pagination, `{ data, meta: { cursor, hasMore } }` response envelope.

**When to use:** `GET /api/users/:id/posts`

**Key implementation details from threads.ts:**
```typescript
// Source: src/routes/threads.ts (verified)

// 1. Import pattern
import { encodeCursor, decodeCursor, parseLimit, generateExcerpt } from '../lib/utils.js';
import { requireAuth } from '../middleware/auth.js';

// 2. Cursor decode + apply
const cursor = req.query.cursor as string | undefined;
if (cursor) {
  const decoded = decodeCursor(cursor);
  if (decoded) {
    query = query.or(
      `created_at.lt.${decoded.t},and(created_at.eq.${decoded.t},id.lt.${decoded.id})`
    );
  }
}
query = query.limit(limit + 1);

// 3. hasMore detection
const hasMore = (data?.length ?? 0) > limit;
const items = (data ?? []).slice(0, limit);

// 4. Cursor encode
const nextCursor = hasMore && items.length > 0
  ? encodeCursor(items[items.length - 1].createdAt, items[items.length - 1].id)
  : null;

res.json({ data: items, meta: { cursor: nextCursor, hasMore } });
```

### Pattern 2: Self-Only Auth Gate

**What:** Endpoint protected by `requireAuth` where `:id` must match `req.user!.id`.

**When to use:** `GET /api/users/:id/posts` — user can only retrieve their own history.

```typescript
// Source: posts.ts pattern (verified)
postsRouter.get('/users/:id/posts', requireAuth, async (req: Request, res: Response) => {
  // ID check before DB query — returns 403 for mismatch
  if (req.params.id !== req.user!.id) {
    res.status(403).json({ error: { code: 'FORBIDDEN', message: 'You can only view your own post history' } });
    return;
  }
  // ... query
});
```

### Pattern 3: Multi-Table Join for Post History

**What:** Supabase query joining `connect.posts → connect.threads → connect.communities` to build full-context post history rows.

**Available columns (verified from migrations):**
- `connect.posts`: `id`, `thread_id`, `author_id`, `author_display_name`, `body`, `created_at`, `updated_at`, `moderation_status`
- `connect.threads`: `id`, `title`, `community_id`, `moderation_status`
- `connect.communities`: `id`, `name`, `slug`

**Supabase JS embedded select syntax:**
```typescript
// Source: Supabase JS pattern for nested selects
const { data, error } = await supabase
  .schema('connect')
  .from('posts')
  .select(`
    id,
    body,
    author_display_name,
    created_at,
    updated_at,
    thread_id,
    thread:threads!inner(
      id,
      title,
      community_id,
      community:communities!inner(id, name, slug)
    )
  `)
  .eq('author_id', req.user!.id)
  .eq('moderation_status', 'visible')
  .eq('thread.moderation_status', 'visible')
  .order('created_at', { ascending: false })
  .order('id', { ascending: false })
  .limit(limit + 1);
```

**Response shape mapping (per CONTEXT.md decisions):**
```typescript
const items = data.slice(0, limit).map(p => ({
  postId: p.id,
  threadId: p.thread.id,
  threadTitle: p.thread.title,
  communityId: p.thread.community_id,
  communityName: p.thread.community.name,
  communitySlug: p.thread.community.slug,
  postExcerpt: generateExcerpt(p.body, 200),  // already exists in utils.ts
  createdAt: p.created_at,
  isEdited: p.updated_at !== p.created_at,
  authorPseudonym: p.author_display_name,
}));
```

### Pattern 4: Cache-Control on Auth-Touching Routes

**What:** Setting `Cache-Control: private, no-store` response header so proxies/CDNs never cache authenticated responses.

**Where to add:** Inside `requireAuth` middleware in `src/middleware/auth.ts`, immediately before calling `next()`.

```typescript
// Source: src/middleware/auth.ts (current code — header NOT yet set)
// Add this line before next():
res.setHeader('Cache-Control', 'private, no-store');
next();
```

This placement means every route protected by `requireAuth` automatically gets the header without touching individual route files.

### Pattern 5: Shared Header Component

**What:** A persistent header bar visible on all pages containing the site name/logo and user menu.

**Current situation:** No shared header exists. DirectoryPage, CommunityHubPage, and ThreadPage each render their own top-level layout. The `useAuth()` hook from `AuthContext.tsx` provides `auth`, `signIn`, and `signOut`.

**Auth states to handle (from AuthContext.tsx):**
- `state === 'loading'` — show nothing or skeleton
- `state === 'inform'` — show "Sign in" link
- `state === 'connected'` or `state === 'connected_no_compass'` — show `auth.user.display_name` + "Your activity" link + sign out

**"Your activity" link target:** `https://accounts.empowered.vote/profile` (external link, use `<a href>` not `<Link>`)

**Positioning:** Per Claude's Discretion. Recommend: right side of header, dropdown or inline links after display name.

### Pattern 6: Route Registration

**What:** Register new route in `src/app.ts` using existing pattern.

```typescript
// Source: src/app.ts (verified)
// All routers mounted under /api
app.use('/api', usersRouter);  // new
```

The new router file `src/routes/users.ts` exports `usersRouter` and registers `GET /users/:id/posts`.

### Recommended Project Structure Changes

Only additive:
```
src/
├── routes/
│   └── users.ts           # NEW: GET /users/:id/posts
frontend/src/
├── components/
│   └── Header.tsx         # NEW: shared header with user menu
├── hooks/
│   └── usePostHistory.ts  # NEW: infinite query for post history (future-use prep, optional)
```

### Anti-Patterns to Avoid

- **Don't add cacheMiddleware to GET /api/users/:id/posts.** This endpoint is auth-gated and user-specific. Caching it would serve one user's data to another. Auth-gated routes must never be cached by `cacheMiddleware`.
- **Don't place the "Your activity" link in individual page files.** It belongs in a shared `Header` component to avoid drift across pages.
- **Don't use `req.user!.id` as the query's `author_id` directly without verifying `:id` matches.** The spec requires the `:id` URL param to match the authenticated user. Future Empower public profiles need the `:id` param to be the lookup key, not the auth identity.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Excerpt generation | Custom truncation | `generateExcerpt(body, 200)` in `src/lib/utils.ts` | Already strips markdown via `remove-markdown`, handles word boundaries, appends ellipsis |
| Cursor encode/decode | Custom base64 logic | `encodeCursor`/`decodeCursor` in `src/lib/utils.ts` | Already tested, handles `{ t, id }` format consistently |
| Bundle scan for secrets | External tools | `grep` on `frontend/dist/assets/*.js` | The bundle is a single file; grep is sufficient and matches the decided approach |

**Key insight:** Every utility needed for the post history endpoint already exists in `src/lib/utils.ts`. The only new code is the route handler and the Supabase query.

## Common Pitfalls

### Pitfall 1: Supabase Nested Select Filter Syntax

**What goes wrong:** `.eq('thread.moderation_status', 'visible')` does not work as a top-level filter in Supabase JS; nested relation filters use a different syntax.

**Why it happens:** Supabase PostgREST nested select (`thread:threads!inner(...)`) supports filtering via `!inner` (which excludes rows where the join returns nothing), but filtering on nested columns in the WHERE clause requires the `.filter()` method with the column path.

**How to avoid:** Use `!inner` joins so posts whose thread or community is not visible are excluded by the join itself. If explicit status filtering on joined tables is needed, use PostgREST `match` or query the posts filtered post-join. The safest approach: query posts where `author_id = X AND moderation_status = 'visible'`, and rely on `!inner` joins to exclude posts in hidden threads/communities.

**Warning signs:** Getting posts back for hidden threads, or getting an empty result when posts exist.

### Pitfall 2: cacheMiddleware on Auth-Gated Routes

**What goes wrong:** Applying `cacheMiddleware` to `GET /api/users/:id/posts` caches user A's data at the path key, then serves it to user B if they request the same `:id`.

**Why it happens:** `cacheMiddleware` uses `fc:${req.path}:${JSON.stringify(req.query)}` as key — it does not include any user identity. A same-path request from a different authenticated user hits the cache.

**How to avoid:** Never apply `cacheMiddleware` to routes using `requireAuth`. This is a hard rule. The route must not have `cacheMiddleware` in its middleware chain.

**Warning signs:** Seeing another user's post history in response, or 403s that should have been 200s.

### Pitfall 3: Cache-Control Header Not Propagating

**What goes wrong:** Adding `res.setHeader('Cache-Control', 'private, no-store')` in `requireAuth` but the header doesn't appear on write routes that use `requireAuth` + `requireConnected` together.

**Why it happens:** `requireAuth` calls `next()` which passes to `requireConnected` which calls `next()` which passes to the route handler. The header IS set in `requireAuth` before `next()`, so it will be present on the response regardless — `setHeader` doesn't require the request to terminate in `requireAuth`.

**How to avoid:** Set the header before `next()` in `requireAuth`. Verify with `curl -I` against a protected route in production.

**Warning signs:** `Cache-Control` absent from PATCH/POST route responses.

### Pitfall 4: Missing `author_id` Index for Post History Query

**What goes wrong:** The post history query filters on `connect.posts.author_id`. Without an index, this is a full table scan.

**Why it happens:** `idx_posts_author_id` index EXISTS (verified in `20260415214600_connect_schema_rls.sql` line 138). No action needed — but verify this index is present before assuming query performance.

**How to avoid:** Confirmed — `CREATE INDEX idx_posts_author_id ON connect.posts(author_id)` was applied in Phase 1. No migration needed.

### Pitfall 5: Community Slug-to-Topic Mapping Requires Live DB Query

**What goes wrong:** Assuming the community slugs and their topic IDs can be assembled from migration files alone.

**Why it happens:** Communities were seeded directly into the production database (no seed migration exists in `supabase/migrations/`). The `connect_schema_tables.sql` creates the table but does not insert community rows.

**How to avoid:** The Compass integration spec (topic-to-slug mapping document) must be assembled by querying the live production database: `SELECT id, slug, name, topic_id FROM connect.communities ORDER BY name`. This requires a one-time query against production Supabase.

**Warning signs:** Spec document showing placeholder topic IDs instead of real UUIDs.

### Pitfall 6: "Your activity" Link Before Header Component Exists

**What goes wrong:** Adding the link to each individual page file independently, creating drift risk when the header eventually needs other changes.

**Why it happens:** No `Header.tsx` component currently exists. The path of least resistance is to add the link directly to each page's JSX.

**How to avoid:** Create a shared `Header.tsx` component and render it at the top of each page. This is a one-time addition that prevents future header changes from requiring edits to 3+ page files.

## Code Examples

### GET /api/users/:id/posts — full route skeleton

```typescript
// Source: codebase inspection of src/routes/threads.ts + src/routes/posts.ts (verified)
import { Router } from 'express';
import type { Request, Response } from 'express';
import { supabase } from '../lib/supabase.js';
import { encodeCursor, decodeCursor, parseLimit, generateExcerpt } from '../lib/utils.js';
import { requireAuth } from '../middleware/auth.js';

export const usersRouter = Router();

usersRouter.get('/users/:id/posts', requireAuth, async (req: Request, res: Response) => {
  // Self-only gate
  if (req.params.id !== req.user!.id) {
    res.status(403).json({ error: { code: 'FORBIDDEN', message: 'You can only view your own post history' } });
    return;
  }

  const limit = parseLimit(req.query.limit as string | undefined, 20);
  const cursor = req.query.cursor as string | undefined;

  let query = supabase
    .schema('connect')
    .from('posts')
    .select(`
      id, body, author_display_name, created_at, updated_at,
      thread:threads!inner(
        id, title, community_id,
        community:communities!inner(id, name, slug)
      )
    `)
    .eq('author_id', req.user!.id)
    .eq('moderation_status', 'visible')
    .order('created_at', { ascending: false })
    .order('id', { ascending: false });

  if (cursor) {
    const decoded = decodeCursor(cursor);
    if (decoded) {
      query = query.or(
        `created_at.lt.${decoded.t},and(created_at.eq.${decoded.t},id.lt.${decoded.id})`
      );
    }
  }

  query = query.limit(limit + 1);

  const { data, error } = await query;

  if (error) {
    res.status(500).json({ error: { code: 'POST_HISTORY_FETCH_FAILED', message: error.message } });
    return;
  }

  const hasMore = (data?.length ?? 0) > limit;
  const items = (data ?? []).slice(0, limit).map(p => ({
    postId: p.id,
    threadId: (p.thread as any).id,
    threadTitle: (p.thread as any).title,
    communityId: (p.thread as any).community_id,
    communityName: (p.thread as any).community.name,
    communitySlug: (p.thread as any).community.slug,
    postExcerpt: generateExcerpt(p.body, 200),
    createdAt: p.created_at,
    isEdited: p.updated_at !== p.created_at,
    authorPseudonym: p.author_display_name,
  }));

  const nextCursor = hasMore && items.length > 0
    ? encodeCursor(items[items.length - 1].createdAt, items[items.length - 1].postId)
    : null;

  res.json({ data: items, meta: { cursor: nextCursor, hasMore } });
});
```

### Cache-Control in requireAuth

```typescript
// Source: src/middleware/auth.ts (add before next() calls)
// In the authenticated success path:
res.setHeader('Cache-Control', 'private, no-store');
req.user = user;
next();
```

### Header component pattern

```tsx
// Source: AuthContext.tsx inspection (verified — useAuth returns { auth, signIn, signOut })
import { useAuth } from '../context/AuthContext';

export function Header() {
  const { auth, signOut } = useAuth();

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        <a href="/communities" className="font-bold text-gray-900 text-sm">Focused Communities</a>

        <div className="flex items-center gap-4 text-sm">
          {(auth.state === 'connected' || auth.state === 'connected_no_compass') && (
            <>
              <span className="text-gray-600">{auth.user.display_name}</span>
              <a
                href="https://accounts.empowered.vote/profile"
                className="text-blue-600 hover:text-blue-800"
              >
                Your activity
              </a>
              <button
                type="button"
                onClick={signOut}
                className="text-gray-500 hover:text-gray-700"
              >
                Sign out
              </button>
            </>
          )}
          {auth.state === 'inform' && (
            <button
              type="button"
              onClick={() => window.open('https://accounts.empowered.vote/login?redirect=' + encodeURIComponent(window.location.href), '_blank')}
              className="text-blue-600 hover:text-blue-800"
            >
              Sign in
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
```

### Bundle scan command

```bash
# Source: CONTEXT.md decision + codebase inspection
# The built bundle is a single JS file in frontend/dist/assets/
grep -r "service_role" frontend/dist/assets/
grep -r "supabase_key\|SUPABASE_KEY\|eyJhbGci" frontend/dist/assets/
# Also check for the actual project's anon key prefix (Supabase anon keys start with eyJ)
grep -l "eyJ" frontend/dist/assets/*.js
```

### Production checklist verification commands

```bash
# Cache-Control header verification
curl -I -H "Authorization: Bearer <token>" https://focused-communities.onrender.com/api/users/<id>/posts
# Expected: Cache-Control: private, no-store

# Rate limit 429 test (non-destructive — post 5 times with own account)
# POST /api/communities/:id/threads 6 times — 6th should return 429

# RLS anon verification
curl https://focused-communities.onrender.com/api/communities
# Should return data (anon read allowed)
curl https://focused-communities.onrender.com/api/users/<id>/posts
# Should return 401 (no token) — not 200

# Health endpoint
curl https://focused-communities.onrender.com/api/health
# Expected: { status: 'ok', timestamp: <number> }
```

## State of the Art

| Old Approach | Current Approach | Notes |
|--------------|------------------|-------|
| No persistent header | Must add shared Header.tsx | No previous header component exists |
| No Cache-Control on auth routes | Add to requireAuth middleware | Decision from prior phases; not yet implemented |
| Communities seeded directly in DB | Mapping doc requires live DB query | No seed.sql exists in supabase/migrations/ |

## Open Questions

1. **Supabase JS nested select filter syntax for moderation_status on joined tables**
   - What we know: `!inner` joins exclude rows where the join returns nothing (NULL), but the `thread.moderation_status = 'visible'` filter may need `.filter()` syntax or a subquery approach
   - What's unclear: Whether Supabase JS v2 supports `.eq('thread.moderation_status', ...)` in the top-level filter chain
   - Recommendation: Use `!inner` joins which will exclude posts in deleted/hidden threads at join time. If explicit filter is needed, use PostgREST's `match` or add a DB view. Test against actual DB before finalizing.

2. **Community slug-to-topic_id mapping values**
   - What we know: The mapping exists in the live production database; the `communities` table has `slug`, `name`, and `topic_id` columns
   - What's unclear: The exact slugs and topic_id UUIDs for all seeded communities
   - Recommendation: The Compass integration spec plan (06-02) must include a step to query `SELECT id, slug, name, topic_id FROM connect.communities ORDER BY name` against production Supabase and embed the results in the spec document.

3. **TypeScript types for nested Supabase select**
   - What we know: The codebase uses `as any` casts in some places; nested selects return complex inferred types
   - What's unclear: Whether the generated Supabase types (if any) cover the nested select shape
   - Recommendation: Use `as any` type assertion on the nested fields as other routes do with similar patterns. The runtime behavior is more important than compile-time type precision here.

## Sources

### Primary (HIGH confidence)
- Direct codebase inspection — `src/routes/threads.ts`, `src/routes/posts.ts`, `src/routes/communities.ts`
- Direct codebase inspection — `src/middleware/auth.ts`, `src/middleware/cache.ts`, `src/middleware/tierGuards.ts`
- Direct codebase inspection — `src/lib/utils.ts` (cursor encode/decode, excerpt generation)
- Direct codebase inspection — `frontend/src/context/AuthContext.tsx` (auth states, signIn/signOut)
- Direct codebase inspection — `frontend/src/App.tsx`, `frontend/src/main.tsx` (component structure)
- Direct codebase inspection — `frontend/src/pages/DirectoryPage.tsx`, `CommunityHubPage.tsx`, `ThreadPage.tsx`
- Direct codebase inspection — `supabase/migrations/20260415214142_connect_schema_tables.sql` (schema columns)
- Direct codebase inspection — `supabase/migrations/20260415214600_connect_schema_rls.sql` (indexes including idx_posts_author_id)
- Bundle scan — `frontend/dist/assets/index-C28pZxhm.js` (no service_role or SUPABASE_KEY found)
- `06-CONTEXT.md` — locked decisions from user discussion

### Secondary (MEDIUM confidence)
- `package.json` versions confirmed for Express 5, Supabase JS 2, jose 6
- `.planning/STATE.md` — confirmed Cache-Control decision was deferred to Phase 6

## Metadata

**Confidence breakdown:**
- Post history endpoint pattern: HIGH — directly mirrors threads.ts which is verified working
- Nested join query: MEDIUM — Supabase JS nested select syntax was confirmed from prior phase research, but the moderation filter on joined tables has one open question
- Cache-Control placement: HIGH — requireAuth is the correct insertion point, confirmed by reviewing all auth-using routes
- Header component pattern: HIGH — AuthContext API is verified, auth states are verified; only the JSX layout is discretionary
- Community slug mapping: HIGH that it requires a live DB query; LOW on actual values (not in code)
- Bundle scan: HIGH — current bundle verified clean; scan command is correct

**Research date:** 2026-04-17
**Valid until:** 2026-05-17 (stable infrastructure, no fast-moving dependencies)
