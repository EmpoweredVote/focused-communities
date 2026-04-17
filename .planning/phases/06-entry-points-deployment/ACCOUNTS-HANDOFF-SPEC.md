# Accounts Handoff Spec: FC Post History API

**Prepared by:** Focused Communities (FC) team
**Date:** 2026-04-17
**Status:** Ready for implementation

---

## 1. Overview

Focused Communities (FC) provides a post history API endpoint. The Accounts team owns the profile UI that displays this data to users.

**Division of responsibility:**

| Concern | Owner |
|---------|-------|
| Post history data API | FC (this document) |
| Profile page UI (`app.empowered.vote/profile`) | Accounts team |
| "Your activity" navigation link (points to Accounts profile) | FC (already implemented in app header) |

> **Domain note:** FC's header links to `https://app.empowered.vote/profile`. If the Accounts team deploys the profile page at a different path or subdomain, notify FC to update the link in `frontend/src/components/Header.tsx`.

FC does not build a profile UI. This spec gives the Accounts team everything needed to build and maintain the profile post history feature.

---

## 2. Base URLs

| Environment | URL |
|-------------|-----|
| Production (primary) | `https://fc.empowered.vote` |
| Production (Render origin) | `https://focused-communities.onrender.com` |

All API requests should target the primary production URL.

---

## 3. Endpoint

### GET /api/users/:id/posts

Returns the authenticated user's post history in reverse chronological order.

**Authentication:** Bearer JWT (Supabase access token)

> **Token key note:** FC stores its token under `localStorage.getItem('ev_token')`. The Accounts app uses `@supabase/ssr` for session management — the actual token key will differ. The Accounts team should retrieve the access token from their own Supabase session (e.g., `supabase.auth.getSession()`) rather than reading localStorage directly. The token itself is the same Supabase JWT; only the storage key differs.

**Authorization model:** Self-only. The `:id` path parameter must match the authenticated user's own ID. This is a privacy-by-design constraint for Connect-tier accounts (see Section 9 for the future Empower-tier public profile roadmap).

**Request example:**

```http
GET /api/users/b3a1f94c-2d8e-4f3a-ae01-9c871b45e2d1/posts HTTP/1.1
Host: fc.empowered.vote
Authorization: Bearer eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9...
```

**With pagination cursor:**

```http
GET /api/users/b3a1f94c-2d8e-4f3a-ae01-9c871b45e2d1/posts?cursor=eyJ0IjoiMjAyNi0wNC0xN1QxMjowMDowMFoiLCJpZCI6ImFiYzEyMyJ9&limit=20 HTTP/1.1
```

---

## 4. Request Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `cursor` | string | No | — | Opaque pagination cursor from previous response `meta.cursor`. Do not construct manually. |
| `limit` | integer | No | 20 | Number of posts per page. Maximum: 100. |

---

## 5. Response Schema

**HTTP 200 — Success**

```json
{
  "data": [
    {
      "postId": "uuid",
      "threadId": "uuid",
      "threadTitle": "string",
      "communityId": "uuid",
      "communityName": "string",
      "communitySlug": "string",
      "postExcerpt": "string",
      "createdAt": "ISO 8601 timestamp",
      "isEdited": false,
      "authorPseudonym": "string"
    }
  ],
  "meta": {
    "cursor": "string | null",
    "hasMore": true
  }
}
```

**Response field reference:**

| Field | Type | Description |
|-------|------|-------------|
| `postId` | string (UUID) | Unique identifier for the post |
| `threadId` | string (UUID) | ID of the thread containing this post |
| `threadTitle` | string | Title of the thread |
| `communityId` | string (UUID) | ID of the community containing the thread |
| `communityName` | string | Human-readable community name (e.g., "Climate Policy") |
| `communitySlug` | string | URL slug for the community (e.g., "climate-policy") |
| `postExcerpt` | string | First ~200 characters of post body, markdown stripped, word-boundary truncated, ellipsis appended if truncated |
| `createdAt` | string | ISO 8601 UTC timestamp when post was created |
| `isEdited` | boolean | `true` if the post has been edited since original submission |
| `authorPseudonym` | string | The display name the user had at time of posting (snapshotted — may differ from current display name) |
| `meta.cursor` | string or null | Opaque cursor for next page; `null` if no further pages |
| `meta.hasMore` | boolean | `true` if more posts exist beyond this page |

---

## 6. Display Requirements

### 6.1 Author identity

**ALWAYS display `authorPseudonym`, NEVER the user's legal name.**

`authorPseudonym` is the display name snapshotted at post time. A user who changes their display name after posting will have different pseudonyms on different posts — this is correct and intentional. It reflects the identity they chose when they participated.

### 6.2 Thread link construction

Link each post row to its thread using this URL pattern:

```
https://fc.empowered.vote/communities/{communitySlug}/threads/{threadId}
```

Example with data from a response row:

```
communitySlug = "climate-policy"
threadId      = "3d8a1f94-ae01-4f3a-9c87-1b45e2d1c2b3"

URL = https://fc.empowered.vote/communities/climate-policy/threads/3d8a1f94-ae01-4f3a-9c87-1b45e2d1c2b3
```

### 6.3 Edited indicator

Display a visible badge or label when `isEdited === true`. Suggested: "(edited)" in muted text next to the timestamp. This is part of the Empowered.Vote Memory over Moderation principle — all edits are permanently visible.

### 6.4 Sort order

Render posts newest-first (the API always returns them in this order). Do not re-sort on the client.

### 6.5 Recommended row layout

Each post row should display:

1. Community name (secondary text or breadcrumb)
2. Thread title (linked to the thread URL above)
3. Post excerpt
4. `authorPseudonym` + `createdAt` timestamp + `isEdited` indicator (if true)

---

## 7. Pagination

**First page:** Request with no cursor parameter.

**Subsequent pages:** Pass the `meta.cursor` value from the previous response as the `cursor` query parameter.

**Stop condition:** `meta.hasMore === false` means no further pages exist. `meta.cursor` will be `null` in this case.

**Pagination flow:**

```
GET /api/users/:id/posts
  → { data: [...20 items], meta: { cursor: "abc123...", hasMore: true } }

GET /api/users/:id/posts?cursor=abc123...
  → { data: [...20 items], meta: { cursor: "xyz789...", hasMore: true } }

GET /api/users/:id/posts?cursor=xyz789...
  → { data: [...5 items], meta: { cursor: null, hasMore: false } }
  ← stop
```

**Important:** Cursors are opaque — treat them as black-box strings. Do not attempt to parse or construct cursor values. The cursor format may change between API versions.

---

## 8. CORS

FC's API explicitly allows cross-origin requests from `https://app.empowered.vote`. No CORS configuration is needed on the Accounts side — FC handles it.

**Allowed origins (configured in FC's `src/app.ts`):**

- `https://fc.empowered.vote`
- `https://app.empowered.vote`
- `http://localhost:5173` (dev)
- `http://localhost:5174` (dev alt)

If the Accounts team is developing locally against FC's production API, requests from `http://localhost:*` will be blocked. Use FC's local dev server (`npm run dev` in the FC repo) or request a temporary local origin addition.

---

## 9. Error Responses

| HTTP Status | Code | When |
|-------------|------|------|
| `401 Unauthorized` | — | No `Authorization` header, expired token, or revoked session |
| `403 Forbidden` | `FORBIDDEN` | `:id` in URL does not match the authenticated user's own ID |
| `500 Internal Server Error` | `POST_HISTORY_FETCH_FAILED` | Database error (rare) |

**401 response body:**

```json
{ "error": "Missing token" }
```
or
```json
{ "error": "Session expired or revoked" }
```

**403 response body:**

```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "You can only view your own post history"
  }
}
```

**500 response body:**

```json
{
  "error": {
    "code": "POST_HISTORY_FETCH_FAILED",
    "message": "<database error message>"
  }
}
```

**Recommended Accounts UI handling:**

- On 401: Prompt the user to re-authenticate and redirect to login
- On 403: Show a generic access denied message (should not occur in normal flow since the user's own ID is used)
- On 500: Show a "Failed to load post history" message with a retry option

---

## 10. Cross-Product Vision

FC is the **reference implementation** of the EV Post History Standard — a cross-product API contract that all Empowered.Vote products should implement.

### What this means for Accounts

Today, the Accounts profile page will display post history from FC. In the future, Accounts will fan out to multiple products (FC, Civic Spaces, and future products), each of which exposes a `GET /api/users/:id/posts` endpoint following this same shape.

### Recommended fan-out architecture: client-side (v1)

For v1, we recommend the profile page performs the fan-out **client-side** — the browser makes parallel `fetch()` calls to each product's `/api/users/:id/posts` endpoint, then merges and sorts the results by `createdAt`.

**Why client-side for v1:**
- No new server route required on the Accounts API
- Each product receives the user's own JWT directly (no token forwarding)
- CORS is already configured on each product's API
- Simpler to implement and debug

**Tradeoffs to revisit for v2:**
- All product API endpoints are exposed to the browser (minor)
- N parallel requests from the browser instead of one to Accounts (acceptable at current scale)
- A server-side aggregation proxy would be cleaner at scale — centralizes retry logic, hides product topology from clients, enables caching — but adds a new Accounts API route and requires the Accounts server to forward user tokens

**v1 implementation sketch:**

```javascript
const [fcPosts, civicPosts] = await Promise.allSettled([
  fetch(`https://fc.empowered.vote/api/users/${userId}/posts`, { headers }),
  fetch(`https://civicspaces.empowered.vote/api/users/${userId}/posts`, { headers }),
]);

const allPosts = [
  ...(fcPosts.status === 'fulfilled' ? await fcPosts.value.json().then(r => r.data) : []),
  ...(civicPosts.status === 'fulfilled' ? await civicPosts.value.json().then(r => r.data) : []),
].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
```

Use `Promise.allSettled` (not `Promise.all`) so a failure from one product doesn't blank the entire history.

### The EV Post History Standard (summary)

Every product in the EV ecosystem that has user-generated posts should implement:

- `GET /api/users/:id/posts` — auth-gated, self-only for Connect-tier users
- Cursor-based pagination with `{ data, meta: { cursor, hasMore } }` response envelope
- Required fields per post: `postId`, `threadId` (or equivalent context ID), `threadTitle` (or context name), `communityId`, `communityName`, `communitySlug` (or equivalent navigation identifier), `postExcerpt`, `createdAt`, `isEdited`, `authorPseudonym`
- Pseudonym rule: ALWAYS snapshot display name at post time; NEVER expose legal name

FC's implementation (this document) is the canonical model. When Civic Spaces adds their post history endpoint, it should match this shape.

### Future: Empower-tier public profiles

The `:id` endpoint parameter is intentionally URL-based rather than always derived from the authenticated user, to support a future access model where Empower-tier users opt into publicly browsable post histories. This will be a relaxation of the auth gate, not a URL change. The Accounts profile page can prepare for this by accepting a `:userId` path parameter even when displaying the current user's own data.

---

*Document version: 1.0*
*FC API version: Phase 6.1*
*Next review: When Civic Spaces adds post history endpoint*
