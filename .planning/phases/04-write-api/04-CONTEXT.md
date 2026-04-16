# Phase 4: Write API + Rate Limiting - Context

**Gathered:** 2026-04-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Write endpoints for thread creation, reply posting, and content editing — all gated behind `requireConnectedAccount`. Every write is atomically versioned (edit history), rate-limited via Upstash Redis sliding window, and content cannot be deleted (moderation_status only). Read-only browsing is not in scope — that was Phase 3.

</domain>

<decisions>
## Implementation Decisions

### Content Validation
- Thread title: 5–150 characters, trimmed, must contain non-whitespace content
- Post body (threads and replies): 10–5,000 characters, trimmed, must contain non-whitespace content
- Validation enforced at the API layer before any DB write
- Whitespace-only submissions are rejected (trim before checking length)

### Rate Limiting Scope
- Shared bucket: thread creation AND reply posting count toward the same 5/hour limit per user_id
- Editing does NOT count against the rate limit (edits don't create new feed content)
- 429 response includes: `Retry-After` header (seconds until window resets) + body `{ reason: 'rate_limited' }`
- Implementation: Upstash Redis sliding window (as specified in roadmap)

### Edit Rules
- No time window in v1 — users can edit at any time after posting
- Edit history is publicly visible, so bad-faith rewrites are transparent
- Thread title IS editable — PATCH /api/threads/:id accepts `title`, `body`, or both
- Every edit (title or body change) creates an entry in thread_edits/post_edits
- A PATCH that sends the identical content is a no-op (no edit history entry created)

### Write Response Contract
- `POST` (create thread or reply): `201 Created` + full created object
- `PATCH` (edit thread or post): `200 OK` + full updated object
- Validation failures: `422 Unprocessable Entity` with field-level errors: `{ errors: { field: 'message' } }`
- Auth failures: `401` (no token / invalid token) or `403` (suspended account) — consistent with Phase 2 middleware
- Not-found or not-author: `404` (hides existence of moderated content — consistent with Phase 3 approach)

### Claude's Discretion
- Exact field names in the returned object shape (should follow existing Phase 3 read response conventions)
- Whether PATCH for a no-op edit returns the object unchanged or a specific message
- Upstash key naming scheme for rate limit buckets

</decisions>

<specifics>
## Specific Ideas

- Retry-After in the 429 body mirrors how the auth 403 returns `{ reason: 'suspended' }` — consistent error envelope pattern across the API
- The "edited" indicator and publicly-visible edit history were called out specifically in the roadmap success criteria — these are first-class features, not afterthoughts

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 04-write-api*
*Context gathered: 2026-04-16*
