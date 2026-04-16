# Phase 3: Read API + Cache - Context

**Gathered:** 2026-04-15
**Status:** Ready for planning

<domain>
## Phase Boundary

All public read paths are live, tested with real data, and cached — community directory, community hub (with stance cards), thread lists, and thread detail with replies. No authentication required for any read endpoint. Write routes and cache invalidation are Phase 4.

**Schema prerequisite:** `inform.*` stances table needs a `supporting_points` field (text[] or separate table) added before this phase executes. Researcher should verify what exists in `inform.*` and flag if the migration needs to be part of Phase 3 scope.

</domain>

<decisions>
## Implementation Decisions

### Response Envelope
- All responses wrap payload in `{ data }` — both lists and single objects
- Paginated lists: `{ data: [...], meta: { cursor: string | null, hasMore: boolean } }` — no total count
- Single resources: `{ data: { ... } }` — same wrapper, no `meta`
- Errors: `{ error: { code: "UPPER_SNAKE_CASE", message: "human string" } }` with appropriate HTTP status
- Default page sizes: communities = 20, threads = 20, posts in thread = 50
- All endpoints support `?limit=` up to server-enforced max of 100

### Community Search & Filter
- `GET /api/communities` supports `?q=` (keyword) and `?sort=newest|popular`
- `?q=` runs `ILIKE '%term%'` against community name AND topic description (case-insensitive substring)
- `?sort=newest` = `created_at DESC` (default), `?sort=popular` = `member_count DESC`
- No faceted filters in v1 — keyword + sort covers the real use case
- Sharded/sliced communities appear as flat list items with a `sliceLabel` field (e.g. `"Northeast"`)
- Frontend handles grouping of sliced communities for display

### Stance Card Content
- `GET /api/communities/:id/stances` joins into `inform.*`
- Returns: `position` (1-5, internal ordering only), `text` (stance label/description), `supportingPoints` (string array)
- Position numbers are **not displayed** to users on the hub page — no "Position 1" labels; numbers are internal ordering only
- Stances always returned in canonical 1-5 order; inversion is a Compass-side display preference, not an API concern
- If no stance data exists for a topic: `{ data: [] }` with HTTP 200 — frontend shows "stances coming soon" state

### Thread Excerpt Rules
- Thread list items include a server-generated `excerpt` field
- Excerpt: 200-character max, plain text (markdown stripped), truncated at nearest word boundary with `…`
- Thread/post bodies support markdown — API stores and returns raw markdown; frontend renders
- Thread list item shape: `{ id, title, excerpt, authorPseudonym, replyCount, createdAt, lastActivityAt }`
- `replyCount` = visible posts only (moderation_status = 'visible')
- Default thread list sort: `lastActivityAt DESC` (most recently active bubbles up)
- Override via `?sort=newest` (createdAt DESC) or `?sort=active` (lastActivityAt DESC)

### Claude's Discretion
- Cache key design and TTL implementation details (roadmap specifies: communities 5 min, stances 30 min, thread lists 30 sec)
- In-memory Map fallback behavior when Redis is unavailable
- Cursor encoding format (opaque base64 is fine)
- Exact markdown stripping implementation for excerpts

</decisions>

<specifics>
## Specific Ideas

- The Compass deliberately avoids anchoring political meaning to position numbers (even randomizes orientation per session). Focused Communities should honor this — stance cards show text only, never "1 of 5" style labels.
- Inversion in the Compass is a shared global display preference (not personal), used to prevent users from anchoring "1 = left" as a fixed assumption. The hub page shows all five stances as readable cards — no orientation concept needed.
- `sliceLabel` pattern mirrors Compass's existing sharding model where large topics spawn multiple communities.

</specifics>

<deferred>
## Deferred Ideas

- Full-text search (tsvector/relevance ranking) for community search — upgrade from ILIKE if dataset grows
- Activity-based community sorting (by last post date) — requires join, Phase 4+ optimization
- Faceted filters for community directory (category, topic type, etc.) — Phase 5+ UI concern
- Stance card source/citation links — not in current inform.* model, future inform enhancement
- Supporting points as a separate relational table (vs text[]) — researcher should flag if text[] is insufficient

</deferred>

---

*Phase: 03-read-api-cache*
*Context gathered: 2026-04-15*
