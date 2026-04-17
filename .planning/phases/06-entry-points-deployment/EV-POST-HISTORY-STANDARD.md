# EV Post History Standard

**Version:** 1.0
**Date:** 2026-04-17
**Owner:** Empowered.Vote platform team
**Status:** Active — FC is the reference implementation

---

## 1. Purpose

The EV Accounts product aggregates post history from all EV products into a unified activity timeline, giving users a single place to review everything they've contributed across the platform.

To enable this, every EV product that hosts user-generated posts MUST implement this standard. The standard defines:

- The API endpoint path and authentication contract
- The required fields each product returns per post
- Pseudonym rules (protecting user identity while preserving post provenance)
- Pagination behavior
- Error response codes

Focused Communities is the reference implementation. This document describes the standard and uses FC's implementation as the canonical example. The final section provides an adoption guide for Civic Spaces.

---

## 2. API Contract

### Endpoint

Every EV product implements this endpoint at the same path:

```
GET /api/users/:id/posts
```

The `:id` parameter is the user's Supabase UUID (from the shared EV Accounts system).

### Authentication

- **Method:** Bearer JWT (Supabase JWT issued by the shared EV-Accounts Supabase project)
- **Header:** `Authorization: Bearer <jwt>`
- **Token issuer:** Shared EV Supabase project (`kxsdzaojfaibhuzmclfq`)

### Access Control

- **Connect accounts:** Self-only. The `:id` in the URL must match the authenticated user's ID. Requests for another user's history return `403`.
- **Future (Empower accounts):** Public profile history may be permitted; each product decides per their own access model. The `:id` URL param is the lookup key (not the auth identity) to support this future pattern without URL changes.

### Query Parameters

| Parameter | Type | Default | Max | Description |
|-----------|------|---------|-----|-------------|
| `cursor` | string | (none) | — | Opaque cursor for next-page fetch; omit for first page |
| `limit` | integer | 20 | 100 | Number of items per page |

### Response Envelope

All responses use this envelope:

```json
{
  "data": [ /* PostHistoryItem[] */ ],
  "meta": {
    "cursor": "string | null",
    "hasMore": true
  }
}
```

- `data`: Array of `PostHistoryItem` objects (see section 3)
- `meta.cursor`: Opaque string to pass as `?cursor=` on the next request; `null` when no more pages
- `meta.hasMore`: `true` if more items exist beyond this page; `false` when this is the last page

---

## 3. Required Fields

Each item in the `data` array MUST include these fields:

| Field | Type | Description |
|-------|------|-------------|
| `postId` | string (UUID) | Unique identifier for the post within this product |
| `sourceProduct` | string | Product identifier — see registered values below |
| `threadId` | string (UUID) | Identifier for the thread, topic, or context the post belongs to |
| `threadTitle` | string | Human-readable title of the thread or topic |
| `communityId` | string (UUID) | Identifier for the community, space, or category the thread belongs to |
| `communityName` | string | Human-readable name of the community or space |
| `postExcerpt` | string | First ~200 characters of post body, truncated at a word boundary with ellipsis if truncated |
| `createdAt` | string (ISO 8601) | Post creation timestamp (e.g., `"2026-04-17T17:00:00Z"`) |
| `isEdited` | boolean | `true` if the post has been edited since creation |
| `authorPseudonym` | string | Display name active at the time the post was created (snapshotted — see section 4) |

### Optional Fields

| Field | Type | Description |
|-------|------|-------------|
| `communitySlug` | string | URL-safe slug for the community; enables direct hub links |
| `postUrl` | string | Direct URL to the post in context; enables deep-linking from Accounts |

### Registered `sourceProduct` Values

| Product | `sourceProduct` Value |
|---------|----------------------|
| Focused Communities | `"focused-communities"` |
| Civic Spaces | `"civic-spaces"` |

New products must register their `sourceProduct` value with the platform team before implementing this standard.

---

## 4. Pseudonym Rules

**NEVER expose a user's legal name.** Post history is returned using the author's pseudonym (display name) only.

### Snapshotting

The `authorPseudonym` MUST be the display name that was active at the time the post was created — not the user's current display name.

This means:
- If a user changes their display name after posting, old posts retain the original display name
- `authorPseudonym` is snapshotted at write time, stored alongside the post, and never updated retroactively
- This is both a privacy protection and a historical accuracy requirement

### Implementation Pattern

Store the display name alongside the post at creation time. In FC this is the `author_display_name` column on `connect.posts`, populated by a trigger that reads `public.connected_profiles.display_name` at insert time.

Products without a snapshot column must add one before implementing this standard. Do not compute `authorPseudonym` dynamically by joining to the current user profile at query time — that would expose the current name, breaking the pseudonym guarantee.

---

## 5. Pagination Contract

### First Page

Omit the `cursor` parameter:

```
GET /api/users/{id}/posts?limit=20
```

### Subsequent Pages

Pass the cursor value from the previous response's `meta.cursor`:

```
GET /api/users/{id}/posts?cursor={meta.cursor}&limit=20
```

### Stopping Condition

Stop fetching when `meta.hasMore === false` or when `meta.cursor === null`. Both conditions indicate the final page.

### Cursor Properties

- **Opaque:** Consumers must treat the cursor as an opaque string. Do not parse, construct, or modify cursor values.
- **Page-size-specific:** A cursor obtained with `?limit=20` is not guaranteed to work with `?limit=50`. Always use consistent limit values within a pagination session.
- **Not persistent:** Cursors are not guaranteed to remain valid indefinitely. Use them immediately to retrieve the next page.

### Default and Max Limits

| Setting | Value |
|---------|-------|
| Default limit | 20 |
| Maximum limit | 100 |

Requests with `limit` above 100 should clamp to 100 (not error).

---

## 6. Error Responses

| HTTP Status | Code | Meaning |
|-------------|------|---------|
| `401` | `UNAUTHORIZED` | Missing or invalid JWT token |
| `403` | `FORBIDDEN` | Authenticated user does not have access to the requested `:id`'s history |
| `500` | `POST_HISTORY_FETCH_FAILED` (or product-specific code) | Server error during history retrieval |

All error responses use the envelope:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable description"
  }
}
```

---

## 7. Accounts Aggregation Pattern

When an Accounts user views their unified post history, the Accounts backend:

1. **Issues parallel requests** to each registered EV product's `/api/users/:id/posts` endpoint, using the user's Supabase JWT
2. **Merges results** across all products by `createdAt`, sorted newest first
3. **Labels each item** using `sourceProduct` to indicate which product it came from
4. **Links each item** using `postUrl` (if provided) or constructs product-specific URLs using known URL templates (see section 8 for FC's template)
5. **Paginates per-product independently** — each product may be on a different page; Accounts requests the next page from each product as needed to fill the unified timeline

### Parallel Request Behavior

Products may be independently slow or temporarily unavailable. Accounts should:
- Set a reasonable per-product timeout (e.g., 3 seconds)
- Surface available products' data even if one product times out
- Display a per-product "unavailable" state rather than failing the entire history view

---

## 8. FC Reference Implementation

Focused Communities is the reference implementation of this standard.

| Property | Value |
|----------|-------|
| **Base URL** | `https://fc.empowered.vote` |
| **Endpoint** | `GET https://fc.empowered.vote/api/users/:id/posts` |
| **`sourceProduct`** | `"focused-communities"` |
| **Thread link template** | `https://fc.empowered.vote/communities/{communitySlug}/threads/{threadId}` |
| **Implementation file** | `src/routes/users.ts` |

### FC Response Example

```json
{
  "data": [
    {
      "postId": "a1b2c3d4-...",
      "sourceProduct": "focused-communities",
      "threadId": "e5f6g7h8-...",
      "threadTitle": "Should the federal minimum wage be raised to $15/hr?",
      "communityId": "i9j0k1l2-...",
      "communityName": "Minimum Wage",
      "communitySlug": "minimum-wage",
      "postExcerpt": "Raising the minimum wage would help millions of workers who...",
      "createdAt": "2026-04-17T15:30:00Z",
      "isEdited": false,
      "authorPseudonym": "Prairie Wind"
    }
  ],
  "meta": {
    "cursor": "eyJ0IjoiMjAyNi0wNC0xN1QxNTozMDowMFoiLCJpZCI6ImExYjJjM2Q0In0=",
    "hasMore": true
  }
}
```

### FC Implementation Notes

- Cursor encodes `{ t: createdAt, id: postId }` as base64 JSON — opaque to consumers
- `isEdited` is derived from `updated_at !== created_at` (no separate boolean column)
- `postExcerpt` uses `generateExcerpt(body, 200)` from `src/lib/utils.ts`, which strips markdown and truncates at word boundaries
- `authorPseudonym` comes from `author_display_name` on `connect.posts`, snapshotted at insert time by a database trigger
- Only posts with `moderation_status = 'visible'` are included; hidden posts are excluded silently
- The `!inner` join on threads and communities ensures posts in hidden threads/communities are also excluded

---

## 9. Civic Spaces Adoption Guide

Civic Spaces does not currently implement this standard. This section provides everything needed to add the endpoint.

### What to Build

Create one new endpoint:

```
GET /api/users/:id/posts
```

### Auth Gate

1. Validate the Bearer JWT from the `Authorization` header using the shared EV Supabase project's JWT secret
2. Verify that `:id` matches the authenticated user's ID; return `403` if not

### Required Fields

Return all required fields from section 3. The key mapping from Civic Spaces data model:

| Standard Field | Map From |
|----------------|----------|
| `postId` | Post record ID |
| `sourceProduct` | Hardcode `"civic-spaces"` |
| `threadId` | Discussion/topic thread ID |
| `threadTitle` | Thread or topic title |
| `communityId` | Space or category ID |
| `communityName` | Space or category name |
| `postExcerpt` | First ~200 chars of post body, word-boundary truncated |
| `createdAt` | Post creation timestamp (ISO 8601) |
| `isEdited` | Whether the post has been edited |
| `authorPseudonym` | Snapshotted display name (see pseudonym requirement below) |
| `postUrl` | Direct URL to post in Civic Spaces (recommended optional field) |

### Pseudonym Snapshotting

If Civic Spaces does not currently snapshot display names at post creation time, a schema addition is required:

1. Add a `author_display_name` column (or equivalent) to the posts table
2. Populate it at insert time from the user's current display name
3. Never update this column on name changes

This may require a migration and a backfill for existing posts. For backfilled posts where the original pseudonym is unknown, use the user's current display name as a best-effort fallback — and mark `isEdited: false` even if the post was edited (since the name mismatch is a data gap, not an edit).

### Pagination

Use cursor-based pagination matching the contract in section 5. Sort by `createdAt` descending, then by `postId` descending as a tiebreaker. Encode the cursor as an opaque string (base64 JSON is a simple approach).

### Response Envelope

Use the exact envelope from section 2:

```json
{
  "data": [ /* PostHistoryItem[] */ ],
  "meta": {
    "cursor": "string | null",
    "hasMore": true
  }
}
```

### Testing

Before signaling readiness to Accounts:

1. Verify `GET /api/users/:id/posts` returns `401` with no token
2. Verify it returns `403` when `:id` does not match authenticated user
3. Verify the response includes all required fields
4. Verify `authorPseudonym` reflects the name at post time (not current name)
5. Verify pagination: fetch page 1, use returned cursor for page 2, verify `hasMore` is `false` on last page

---

*EV Post History Standard v1.0 — Focused Communities team*
*Questions: contact the FC team or platform team*
