# Phase 5: Frontend UI - Research

**Researched:** 2026-04-16
**Domain:** React/Vite SPA, TanStack Query v5, React Router v7, Tailwind CSS v4
**Confidence:** HIGH (core stack verified via official docs and Context7-equivalent sources)

---

## Summary

Phase 5 builds a greenfield standalone React/Vite app (no existing frontend scaffold yet — `frontend/` needs to be initialized from scratch). The backend API is complete and stable; the frontend consumes it exclusively via `apiFetch`. Three primitive files already exist in `frontend-src/` — `apiFetch.ts`, `AuthContext.tsx`, and `AuthGate.tsx` — and must be incorporated into the new Vite app.

The standard stack for this domain is React 19 + Vite 6 (or 8 — current version reported as 8.0.8) + React Router v7 in declarative (library) mode + TanStack Query v5 (`@tanstack/react-query` 5.99.x) + Tailwind CSS v4 + Sonner for toasts + react-loading-skeleton for skeletons + react-error-boundary for top-level crash handling. All of these are current, actively maintained, and well-documented.

**Critical API gap identified:** The existing backend has `GET /api/communities/:id` (UUID) but no slug-based lookup route. The frontend URLs are `/communities/:slug`, so Phase 5 Plan 05-01 must add a `GET /api/communities/by-slug/:slug` backend route before the hub page can function. The `slug` column already exists in `connect.communities` (it's seeded and UNIQUE), so this is a simple addition to `src/routes/communities.ts`. The stances, thread-list, and all write routes continue to use UUID — only the hub page entry point needs slug resolution.

**Primary recommendation:** Scaffold the Vite app as a sibling `frontend/` directory, install the full stack in one pass, migrate the three existing `frontend-src/` primitives in, then build pages plan by plan (directory → hub → threads → forms → session).

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react | 19.x | UI rendering | Current stable; Vite react-ts template defaults to 18, manually upgrade |
| react-dom | 19.x | DOM mounting | Paired with React |
| vite | 8.x | Build tool / dev server | Current version; fastest build, HMR, TypeScript first-class |
| @vitejs/plugin-react | latest | React JSX + fast refresh | Official Vite plugin for React |
| typescript | 5.x | Type safety | Already used project-wide |
| react-router | 7.14.x | Client-side routing | Current stable; v7 is non-breaking from v6; use declarative (library) mode, NOT framework mode |
| @tanstack/react-query | 5.99.x | Server state management | 12M+ weekly downloads; v5 is stable and fully typed |
| tailwindcss | 4.x | Styling | Utility-first; v4 uses Vite plugin instead of PostCSS |
| @tailwindcss/vite | 4.x | Tailwind Vite integration | Replaces postcss.config; single import `@import "tailwindcss"` in CSS |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| sonner | 2.0.7 | Toast notifications | Write failure toasts (optimistic rollback, rate limit, etc.) |
| react-loading-skeleton | 3.5.0 | Skeleton screens | Page-level loading states for directory, hub, thread list, thread page |
| react-error-boundary | 6.1.1 | Top-level crash boundary | Full-page "Something went wrong" with reload button |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Sonner | react-hot-toast | Sonner has 8.9x more weekly downloads, smaller bundle (48KB vs 59KB), no context/hooks needed |
| react-loading-skeleton | Hand-rolled divs | Library adapts to parent dimensions automatically; no manual sizing |
| react-error-boundary | Class-based ErrorBoundary | Library wraps the class requirement; functional fallback components work cleanly |
| Tailwind CSS | CSS Modules | Tailwind eliminates naming; v4 Vite plugin is zero-config; no downside for greenfield |

### Installation

```bash
# From project root — create the frontend app
npm create vite@latest frontend -- --template react-ts
cd frontend

# Then install all additional dependencies
npm install react-router @tanstack/react-query tailwindcss @tailwindcss/vite sonner react-loading-skeleton react-error-boundary

# Dev-only type stubs (react-loading-skeleton ships its own types)
npm install -D @types/react @types/react-dom
```

---

## Architecture Patterns

### Recommended Project Structure

```
frontend/
├── index.html
├── vite.config.ts
├── tsconfig.json
├── package.json
├── public/
│   └── _redirects          # /* /index.html 200  — SPA routing for Netlify
├── src/
│   ├── main.tsx             # Entry: QueryClientProvider + BrowserRouter + AuthProvider + App
│   ├── App.tsx              # Route definitions
│   ├── lib/
│   │   └── apiFetch.ts      # Migrated from frontend-src/lib/
│   ├── context/
│   │   └── AuthContext.tsx  # Migrated from frontend-src/context/
│   ├── components/
│   │   ├── AuthGate.tsx     # Migrated from frontend-src/components/
│   │   ├── SuspendedNotice.tsx
│   │   ├── StanceCard.tsx
│   │   ├── ThreadListItem.tsx
│   │   ├── ReplyItem.tsx
│   │   ├── SkeletonCard.tsx
│   │   └── Toast.tsx        # Sonner <Toaster /> mount point
│   ├── pages/
│   │   ├── DirectoryPage.tsx
│   │   ├── CommunityHubPage.tsx
│   │   ├── ThreadPage.tsx
│   │   └── NotFoundPage.tsx
│   ├── hooks/
│   │   ├── useCommunities.ts
│   │   ├── useCommunity.ts   # by slug → resolves to UUID internally
│   │   ├── useStances.ts
│   │   ├── useThreads.ts
│   │   ├── useThread.ts
│   │   ├── usePosts.ts
│   │   └── useDraft.ts       # localStorage draft preservation
│   └── index.css             # @import "tailwindcss";
```

### Pattern 1: Vite Config with Tailwind and API Proxy

**What:** Single `vite.config.ts` wires up the React plugin, Tailwind plugin, and a dev proxy for `/api` calls.
**When to use:** Development only — in production, `VITE_API_BASE_URL` env var points at the real API.

```typescript
// Source: https://vite.dev/config/ and https://tailwindcss.com/docs/installation/framework-guides
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
})
```

### Pattern 2: App Entry Point — Provider Stack

**What:** All providers wrap the app in the correct order.
**When to use:** `main.tsx` only.

```typescript
// Source: TanStack Query Quick Start + React Router v7 declarative setup
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router'
import { AuthProvider } from './context/AuthContext'
import App from './App'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,       // 30s — matches server cache TTLs
      retry: 1,
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
)
```

### Pattern 3: React Router v7 Route Definitions

**What:** Declarative nested routes with URL params for slug and thread id.
**When to use:** `App.tsx` route tree.

```typescript
// Source: https://reactrouter.com/start/library/routing
import { Routes, Route } from 'react-router'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/communities" replace />} />
      <Route path="/communities" element={<DirectoryPage />} />
      <Route path="/communities/:slug" element={<CommunityHubPage />} />
      <Route path="/communities/:slug/threads/:id" element={<ThreadPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
```

Access params in page components: `const { slug, id } = useParams()`

### Pattern 4: useInfiniteQuery for Thread Pagination

**What:** Cursor-based infinite scroll using TanStack Query v5 `useInfiniteQuery`.
**When to use:** Thread list on community hub; the API returns `{ data, meta: { cursor, hasMore } }`.

```typescript
// Source: https://tanstack.com/query/latest/docs/framework/react/guides/infinite-queries
import { useInfiniteQuery } from '@tanstack/react-query'
import { apiFetch } from '../lib/apiFetch'

export function useThreads(communityId: string, sort: 'active' | 'newest' = 'active') {
  return useInfiniteQuery({
    queryKey: ['threads', communityId, sort],
    queryFn: async ({ pageParam }) => {
      const cursor = pageParam ? `&cursor=${pageParam}` : ''
      const result = await apiFetch<{ data: Thread[]; meta: { cursor: string | null; hasMore: boolean } }>(
        `/api/communities/${communityId}/threads?sort=${sort}${cursor}`
      )
      if (!result.ok) throw new Error(result.error)
      return result.data
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.meta.hasMore ? lastPage.meta.cursor : undefined,
    refetchInterval: 30_000,  // 30s polling — matches thread list cache TTL
  })
}
```

Render: `data.pages.flatMap(p => p.data)` to get the flat thread list across all loaded pages.

### Pattern 5: Optimistic Reply Submission

**What:** New reply appears immediately; rolled back with toast on API failure.
**When to use:** Reply form on ThreadPage.

```typescript
// Source: https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

function useCreateReply(threadId: string) {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (body: string) =>
      apiFetch(`/api/threads/${threadId}/posts`, {
        method: 'POST',
        body: JSON.stringify({ body }),
      }),

    onMutate: async (body) => {
      await qc.cancelQueries({ queryKey: ['posts', threadId] })
      const previous = qc.getQueryData(['posts', threadId])

      // Optimistically add reply
      qc.setQueryData(['posts', threadId], (old: Post[] | undefined) => [
        ...(old ?? []),
        { id: 'optimistic', body, authorPseudonym: '…', createdAt: new Date().toISOString(), isEdited: false },
      ])
      return { previous }
    },

    onError: (_err, _vars, context) => {
      // Roll back
      qc.setQueryData(['posts', threadId], context?.previous)
      toast.error("Couldn't post. Try again.")
    },

    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['posts', threadId] })
    },
  })
}
```

### Pattern 6: Sonner Toast Setup

**What:** Mount `<Toaster />` once in `App.tsx`; call `toast.error()` anywhere.
**When to use:** App root and any mutation error handler.

```typescript
// Source: https://github.com/emilkowalski/sonner — v2.0.7
import { Toaster } from 'sonner'

function App() {
  return (
    <>
      <Toaster position="bottom-center" richColors />
      <Routes>...</Routes>
    </>
  )
}
```

### Pattern 7: refetchInterval Polling

**What:** Thread lists poll at 30s intervals to pick up new posts without Realtime.
**When to use:** `useQuery` or `useInfiniteQuery` for thread lists.

```typescript
// Source: https://tanstack.com/query/latest/docs/framework/react/reference/useQuery
useQuery({
  queryKey: ['threads', communityId],
  queryFn: fetchThreads,
  refetchInterval: 30_000,
  refetchIntervalInBackground: false, // stop polling when tab is hidden (default)
})
```

### Pattern 8: Draft Preservation with localStorage

**What:** Save textarea content to localStorage on `onChange`; restore on mount; clear on successful submit.
**When to use:** ThreadCreateForm and ReplyForm in session management (Plan 05-04).

```typescript
// Pattern from community resources (MEDIUM confidence)
const DRAFT_KEY = `draft-reply-${threadId}`

const [body, setBody] = useState(() => localStorage.getItem(DRAFT_KEY) ?? '')

useEffect(() => {
  localStorage.setItem(DRAFT_KEY, body)
}, [body, DRAFT_KEY])

// On successful submit:
localStorage.removeItem(DRAFT_KEY)
```

### Pattern 9: Slug-Based Community Lookup (API Gap Fix)

**What:** New backend route `GET /api/communities/by-slug/:slug` must be added in Plan 05-01.
**When to use:** Every time the frontend navigates to `/communities/:slug`.

The hub page receives `slug` from `useParams()`, must look up the community UUID, then use that UUID for stances and threads. The hook pattern is:

```typescript
// Backend addition required in src/routes/communities.ts — Plan 05-01
export function useCommunityBySlug(slug: string) {
  return useQuery({
    queryKey: ['community', 'slug', slug],
    queryFn: async () => {
      const result = await apiFetch<{ data: Community }>(`/api/communities/by-slug/${slug}`)
      if (!result.ok) throw new Error(result.error)
      return result.data
    },
    staleTime: 5 * 60_000, // 5 min — communities change rarely
  })
}
```

The backend implementation in `communities.ts` is a one-liner query: `.eq('slug', req.params.slug)` instead of `.eq('id', req.params.id)`.

### Anti-Patterns to Avoid

- **Using `react-router-dom` package:** In v7, the package is just `react-router` — no `-dom` suffix needed. `react-router-dom` still works but is a legacy alias.
- **Calling `fetchNextPage()` when `isFetching` is true:** Always guard with `disabled={!hasNextPage || isFetching}` to prevent double-fetches.
- **Hardcoding query key strings:** Use a `queryKeys` constant map (e.g., `queryKeys.threads(communityId)`) to prevent key drift across hooks and mutations.
- **Putting `QueryClient` inside a component:** Instantiate it once outside the component tree (module level) or inside `useState` for SSR scenarios.
- **Skipping the `_redirects` file for Netlify or the Render rewrite rule:** Without `/* /index.html 200`, direct navigation to `/communities/minimum-wage` returns a 404 from the static host.
- **Position numbers in stance UI:** The `position` field (value 1–5) must NEVER appear in any rendered output — it is an internal sort value only. Randomize display order in the `useStances` hook by shuffling the array on each page render.
- **Showing character counter on empty fields:** Counter state should only render when `field.length > 0` to avoid feeling punishing before the user types.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Toast notifications | Custom toast state + portal | `sonner` | Position, animations, a11y, stacking logic are all non-trivial |
| Skeleton placeholders | `<div style={{ background: '#eee', height: 20 }}>` | `react-loading-skeleton` | Adapts to parent dimensions; handles theming; no manual sizing |
| Top-level error catching | Class-based `ErrorBoundary` from scratch | `react-error-boundary` | getDerivedStateFromError requires class component; library handles all edge cases |
| Debounced search input | `setTimeout` in event handler | Custom `useDebounce` hook (inline, 5 lines) | Simple enough; no library needed |
| Optimistic update rollback | Local component state | TanStack Query `onMutate`/`onError` with `setQueryData` | Handles concurrent mutations, race conditions, background refetch conflicts |
| SPA routing on static host | Custom server config | `public/_redirects` file (Netlify) or Render rewrite rule `/* → /index.html` | One-line file; without it, deep-links return 404 |

**Key insight:** The data-fetching layer (TanStack Query) eliminates entire categories of hand-rolled state: loading booleans, error states, cache invalidation, background refetch, and race condition protection are all managed by the library.

---

## Common Pitfalls

### Pitfall 1: Stale Closure in Query Key

**What goes wrong:** A query key references a variable (e.g., `communityId`) from a component that has since unmounted, causing stale data to appear.
**Why it happens:** Query keys are the cache key — if they don't include all variables the query depends on, the same cached data is returned regardless of navigation.
**How to avoid:** Always include all dynamic values in the `queryKey` array: `['threads', communityId, sort]`.
**Warning signs:** Navigating between community hubs shows the wrong community's threads.

### Pitfall 2: Missing React Router Future Flags (Scroll Flash)

**What goes wrong:** Navigating to a deep URL (direct link to `/communities/minimum-wage`) causes a scroll flash or brief 404-then-load flicker.
**Why it happens:** Without server-side rendering, React Router can't restore scroll until JS is loaded.
**How to avoid:** Accept this limitation for a client-only SPA. Ensure `_redirects`/Render rewrite is in place so the HTML is served immediately; JS hydration is fast with Vite. Don't invest in complex scroll solutions.
**Warning signs:** `404 Not Found` on direct deep URL navigation.

### Pitfall 3: Stance Position Leak

**What goes wrong:** The numerical `position` value (1–5) appears in the UI as a label, ranking, or aria-label.
**Why it happens:** The API returns `position` in the stance object; it's easy to accidentally include it in rendered output or as a `key`.
**How to avoid:** In `useStances`, shuffle the array on return. Use the stance `text` (or an opaque generated key) as the React `key`, never `position`. Code review for any rendered `position` value.
**Warning signs:** Cards appear in a consistent sorted order across page loads; a "1" or "5" label appears anywhere in the DOM.

### Pitfall 4: Auth Token Not Read on Load

**What goes wrong:** The app mounts, immediately fetches as unauthenticated, then re-fetches after `AuthContext` resolves — causing double-fetch flicker.
**Why it happens:** `AuthContext` is async (calls `/api/account/me`); if queries start before auth state resolves, the first fetch lacks the bearer token.
**How to avoid:** In `useAuth`, expose the `loading` state. In data hooks, add `enabled: auth.state !== 'loading'` to `useQuery` options so queries wait for auth resolution before firing.
**Warning signs:** Network tab shows duplicate requests — one without `Authorization` header, one with.

### Pitfall 5: apiFetch 401 Opens New Tab During Data Fetch (Not Only Write)

**What goes wrong:** A background `refetchInterval` fires after session expiry, triggering `window.open(login, '_blank')` — unexpected for a background poll.
**Why it happens:** `apiFetch` always opens a new tab on 401, including for read requests.
**How to avoid:** For read queries (no auth required), use unauthenticated fetch paths where possible. The existing `apiFetch` already only sends `Authorization` when a token exists in localStorage — so expired tokens are the real trigger. Clearing the token on 401 in `AuthContext` (which it already does) prevents repeated fires.
**Warning signs:** Tab-spam on session expiry during background polling.

### Pitfall 6: useInfiniteQuery `data.pages` Not Flattened

**What goes wrong:** The thread list renders `data.pages` (array of page objects) instead of a flat array of threads.
**Why it happens:** `useInfiniteQuery` returns `data.pages` (an array of responses), not a flat array.
**How to avoid:** Always flatten: `const threads = data?.pages.flatMap(p => p.data) ?? []`.
**Warning signs:** Thread list renders `[object Object]` or duplicates appear after loading more.

### Pitfall 7: Missing `initialPageParam` in v5

**What goes wrong:** `useInfiniteQuery` throws a type error or fetches incorrectly.
**Why it happens:** In TanStack Query v5, `initialPageParam` is **required** (was optional in v4).
**How to avoid:** Always include `initialPageParam: null` (for cursor-based APIs that start with no cursor).
**Warning signs:** TypeScript error on `useInfiniteQuery` call.

### Pitfall 8: Tailwind v4 vs v3 Config

**What goes wrong:** Using `tailwind.config.js` and PostCSS setup results in v3 behavior or build errors with v4.
**Why it happens:** Tailwind v4 drops the `tailwind.config.js` file and PostCSS plugin in favor of the Vite plugin.
**How to avoid:** Use `@tailwindcss/vite` plugin in `vite.config.ts`. Only add `@import "tailwindcss"` in `index.css`. No `tailwind.config.js` needed for basic usage.
**Warning signs:** Classes don't apply; build output missing Tailwind styles.

---

## Code Examples

### Skeleton Screen for Directory Page

```typescript
// Source: https://github.com/dvtng/react-loading-skeleton (v3.5.0)
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'

function CommunityCardSkeleton() {
  return (
    <div className="community-card">
      <Skeleton height={24} width="60%" />
      <Skeleton count={2} />
    </div>
  )
}

// In DirectoryPage — show 6 skeleton cards while loading
{isLoading && Array.from({ length: 6 }).map((_, i) => <CommunityCardSkeleton key={i} />)}
```

### Error Boundary for App Root

```typescript
// Source: https://github.com/bvaughn/react-error-boundary (v6.1.1)
import { ErrorBoundary } from 'react-error-boundary'

function AppCrashFallback({ resetErrorBoundary }: { resetErrorBoundary: () => void }) {
  return (
    <div role="alert" className="error-full-page">
      <h1>Something went wrong</h1>
      <button onClick={() => window.location.reload()}>Reload</button>
    </div>
  )
}

// In main.tsx wrapping <App />
<ErrorBoundary FallbackComponent={AppCrashFallback}>
  <App />
</ErrorBoundary>
```

### Inline Section Error with Retry

```typescript
// Pattern for partial failure (thread list fails, rest of hub still works)
function ThreadListSection({ communityId }: { communityId: string }) {
  const { data, isLoading, isError, refetch } = useThreads(communityId)

  if (isError) {
    return (
      <div className="error-section">
        <p>Failed to load threads.</p>
        <button onClick={() => refetch()}>Try Again</button>
      </div>
    )
  }
  // ...
}
```

### Character Counter (only shown when field has content)

```typescript
// Follows CONTEXT.md decision: no counter on empty fields
function CharCounter({ value, max }: { value: string; max: number }) {
  if (value.length === 0) return null
  const nearLimit = value.length >= max * 0.9
  return (
    <span className={nearLimit ? 'text-red-500' : 'text-gray-400'}>
      {value.length}/{max}
    </span>
  )
}
```

### StanceCard Expand / Auto-Scroll

```typescript
// Auto-scroll to card top on expand (CONTEXT.md decision)
import { useRef, useEffect } from 'react'

function StanceCard({ stance, isHighlighted }: StanceCardProps) {
  const [expanded, setExpanded] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (expanded && cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [expanded])

  return (
    <div
      ref={cardRef}
      className={`stance-card ${isHighlighted ? 'stance-card--highlighted' : ''}`}
      onClick={() => setExpanded(prev => !prev)}
    >
      <p className="stance-card__text">{stance.text}</p>
      {expanded && (
        <div className="stance-card__detail">
          <p>{stance.description}</p>
          <ul>
            {stance.examplePerspectives.map((p, i) => <li key={i}>"{p}"</li>)}
          </ul>
        </div>
      )}
    </div>
  )
}
```

---

## API Contract Summary

The planner needs this exact contract to write TypeScript types:

### GET /api/communities
Response: `{ data: Community[], meta: { cursor: string | null, hasMore: boolean } }`
```
Community: { id, slug, name, description, memberCount, threadCount, topicId, sliceLabel, createdAt }
```

### GET /api/communities/by-slug/:slug (NEW — must be added in Plan 05-01)
Response: `{ data: Community }` (same shape as /api/communities/:id)
Lookup: `connect.communities WHERE slug = $1`

### GET /api/communities/:id/stances
Response: `{ data: Stance[] }`
```
Stance: { position, text, supportingPoints, description, examplePerspectives }
```
NOTE: `position` (1–5) is NEVER shown to users. Display order must be randomized in the frontend.

### GET /api/communities/:id/threads
Response: `{ data: ThreadSummary[], meta: { cursor, hasMore } }`
```
ThreadSummary: { id, title, excerpt, authorPseudonym, replyCount, createdAt, lastActivityAt }
```
Sort: `?sort=active` (default) or `?sort=newest`

### GET /api/threads/:id
Response: `{ data: Thread }`
```
Thread: { id, title, body, authorPseudonym, replyCount, createdAt, lastActivityAt, updatedAt, isEdited }
```

### GET /api/threads/:id/posts
Response: `{ data: Post[] }` (flat, no pagination)
```
Post: { id, authorPseudonym, body, createdAt, updatedAt, isEdited }
```

### POST /api/communities/:id/threads
Body: `{ title: string, body: string }`
Success (201): `{ data: Thread }` — redirect to `/communities/:slug/threads/:id`
Errors: 401 (open login tab), 403 `{ reason: 'suspended' }`, 422 `{ errors }`, 429 `{ reason: 'rate_limited' }`

### POST /api/threads/:id/posts
Body: `{ body: string }`
Success (201): `{ data: Post }` — optimistic insert then invalidate

### PATCH /api/threads/:id
Body: `{ title?: string, body?: string }`
Success (200): `{ data: Thread }` with `isEdited: true`

### PATCH /api/posts/:id
Body: `{ body: string }`
Success (200): `{ data: Post }` with `isEdited: true`

### GET /api/threads/:id/edits
Response: `{ data: ThreadEdit[] }`
```
ThreadEdit: { id, oldTitle, oldBody, editedAt }
```

### GET /api/posts/:id/edits
Response: `{ data: PostEdit[] }`
```
PostEdit: { id, oldBody, editedAt }
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `react-router-dom` package | `react-router` (v7) | React Router v7 (2024) | Drop the `-dom` suffix; same API |
| TanStack Query `initialPageParam` optional | Required in v5 | v5 release (2023) | TypeScript errors if omitted |
| Tailwind PostCSS config | `@tailwindcss/vite` plugin | Tailwind v4 (2025) | No `tailwind.config.js` for basic use |
| `react-query` package name | `@tanstack/react-query` | v4 (2022) | Scoped package; old name deprecated |
| `QueryClientProvider` wrapping `<App>` | Same pattern — no change | — | Still valid |

**Deprecated/outdated:**
- `react-query` (unscoped): Use `@tanstack/react-query` instead
- `react-router-dom`: Still works in v7 as an alias but `react-router` is the canonical package
- Tailwind `tailwind.config.js` + `postcss.config.js`: Replaced by `@tailwindcss/vite` plugin in v4

---

## Open Questions

1. **Render vs Netlify vs Vercel deployment target**
   - What we know: CONTEXT.md says "Render or Vercel/Netlify static build"
   - What's unclear: Which platform will be chosen; this affects SPA routing config (`_redirects` for Netlify vs Render dashboard rewrite rule)
   - Recommendation: Build both — put `public/_redirects` file in the repo (Netlify uses it automatically, no harm on other platforms); add Render rewrite rule `/* → /index.html` in the dashboard when deploying there

2. **URL-based scroll position tracking (Claude's discretion)**
   - What we know: CONTEXT.md marks implementation as Claude's discretion; React Router v7 has no built-in scroll restoration in declarative mode without framework mode
   - What's unclear: Whether thread position within a long list needs URL persistence
   - Recommendation: Use browser's native scroll restoration (`history.scrollRestoration = 'auto'`) which preserves position on back navigation for free; no custom implementation needed for v1

3. **Community seed data slugs**
   - What we know: `slug` column exists in `connect.communities` and is UNIQUE; test data uses slug `'climate'`
   - What's unclear: Whether production community rows are seeded with slugs matching the CONTEXT.md examples (`minimum-wage`, etc.)
   - Recommendation: Plan 05-01 should verify seed data slugs exist; if not, add a migration to seed them

---

## Sources

### Primary (HIGH confidence)
- `https://tanstack.com/query/latest/docs/framework/react/guides/infinite-queries` — useInfiniteQuery cursor pagination API, verified current
- `https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates` — optimistic update pattern with onMutate/onError/onSettled
- `https://tanstack.com/query/latest/docs/framework/react/reference/useQuery` — refetchInterval and refetchIntervalInBackground API
- `https://tanstack.com/query/latest/docs/framework/react/guides/mutations` — useMutation callbacks
- `https://reactrouter.com/start/library/routing` — nested routes, useParams, declarative mode — v7.14.1
- `https://reactrouter.com/start/library/installation` — BrowserRouter setup
- `https://vite.dev/guide/` — Vite version (8.0.8), react-ts template
- `https://tailwindcss.com/docs/installation/framework-guides/react-router` — Tailwind v4 Vite plugin setup
- `https://render.com/docs/redirects-rewrites` — Render SPA rewrite rule `/* → /index.html`
- `https://react.dev/reference/react/useId` — useId for form accessibility
- Existing codebase: `frontend-src/lib/apiFetch.ts`, `frontend-src/context/AuthContext.tsx`, `frontend-src/components/AuthGate.tsx` — exact contracts verified by reading source
- Existing codebase: `src/routes/communities.ts`, `src/routes/stances.ts`, `src/routes/threads.ts`, `src/routes/posts.ts` — exact API response shapes verified

### Secondary (MEDIUM confidence)
- `https://github.com/emilkowalski/sonner` — Sonner v2.0.7, install, Toaster API
- `https://github.com/dvtng/react-loading-skeleton` — react-loading-skeleton v3.5.0, install, basic usage
- `https://github.com/bvaughn/react-error-boundary` — react-error-boundary v6.1.1, FallbackComponent pattern
- npm weekly downloads comparison for Sonner vs react-hot-toast (via WebSearch, multiple sources agree)

### Tertiary (LOW confidence)
- Draft preservation `localStorage` pattern — community blog sources; pattern is simple/standard but not from official docs
- Scroll restoration "browser native" recommendation — community discussion synthesis

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — versions and APIs verified against official docs and official GitHub releases
- Architecture: HIGH — route structure follows locked CONTEXT.md decisions; data flow verified against actual API contracts
- API contract: HIGH — read directly from source code in `src/routes/`
- Pitfalls: HIGH for stance numbering, query key issues, and Tailwind v4 breaking change; MEDIUM for others
- Code examples: HIGH for patterns from official docs; MEDIUM for custom hooks (straightforward but unverified against specific project needs)

**Research date:** 2026-04-16
**Valid until:** 2026-05-16 (30 days — stack is stable)
