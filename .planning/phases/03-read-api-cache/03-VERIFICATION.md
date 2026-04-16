---
phase: 03-read-api-cache
status: human_needed
verified: 2026-04-16
---

# Phase 3 Verification Report

## Goal Assessment

The phase goal is: "All read paths are live, tested with real data, and cached — anyone can browse communities, read stances, and read threads without authentication."

All five read endpoints are fully implemented, wired into Express, covered by passing tests, and TypeScript-clean. The only blocker to claiming the goal "live with real data" is that the Phase 3 schema migration (`20260416074245_phase3_schema_gaps.sql`) has not been pushed to the live Supabase instance. The migration adds three required columns (`slice_label`, `last_activity_at`, `supporting_points`) and the `connect.get_stances_for_community` RPC function used by the stances endpoint. Until the migration is applied, hitting the live API will return errors for fields that do not yet exist in the database.

Everything else — implementation, wiring, caching, fallback, types, tests — is verified and correct.

## Must-Have Verification

| # | Criterion | Status | Evidence |
|---|-----------|--------|----------|
| 1 | Paginated community list (cursor-based) | VERIFIED | `src/routes/communities.ts:28–35` — cursor decoded with `decodeCursor`, OR clause built against `sortColumn` + `id`; `encodeCursor` called on last item at line 60; `limit+1` probe at line 37 |
| 2 | Stance cards joined from inform.* | VERIFIED (code) | `src/routes/stances.ts:27–29` — calls `connect.get_stances_for_community` RPC; migration at `supabase/migrations/20260416074245_phase3_schema_gaps.sql:78–98` defines the SECURITY DEFINER cross-schema join; returns `position`, `text`, `supportingPoints` — no party labels |
| 3 | Thread list with excerpts and author pseudonym | VERIFIED | `src/routes/threads.ts:49–57` — body excluded, `generateExcerpt(t.body)` at line 52, `authorPseudonym: t.author_display_name` at line 53; cursor pagination via `last_activity_at`/`created_at` |
| 4 | Flat reply list with author pseudonym and timestamp | VERIFIED | `src/routes/posts.ts:67–93` — `order('created_at', ascending: true)`, maps `author_display_name` → `authorPseudonym`, returns `createdAt` and `updatedAt`; no cursor/meta (flat list, documented at line 91) |
| 5 | Cache TTLs (communities 5min, stances 30min, threads 30s, Redis fallback) | VERIFIED | `src/middleware/cache.ts:4–8` — `COMMUNITIES: 5*60`, `STANCES: 30*60`, `THREAD_LIST: 30`, `THREAD_DETAIL: 30`; `src/lib/redis.ts:3–61` — `memoryStore` Map initialized at line 4, used in both `cacheGet` and `cacheSet` when Redis client is null or throws |

Note on criterion 2: The SQL migration file containing the RPC function is present and correct but has not been pushed to the live database. The code path is fully wired; the database object it depends on does not yet exist in production.

## Test Coverage

All tests pass.

```
Test Files  3 passed (3)
      Tests  30 passed (30)
   Duration  844ms
```

The `read-api.test.ts` suite covers all five route groups: `GET /api/communities`, `GET /api/communities/:id`, `GET /api/communities/:id/stances`, `GET /api/communities/:id/threads`, `GET /api/threads/:id`, `GET /api/threads/:id/posts`. Tests stub `fetch` directly (supabase-js uses the global `fetch`), exercise the happy path and 404/error cases, and confirm field shapes including the absence of `body` in thread-list responses and the absence of `moderation_status` in thread-detail responses.

## TypeScript

`npx tsc --noEmit` exits 0 — no errors.

## Issues / Gaps

One gap: the schema migration in `supabase/migrations/20260416074245_phase3_schema_gaps.sql` has been written and committed but has not been applied to the live Supabase database via `supabase db push`. Until it is applied:

- `connect.communities.slice_label` does not exist — `GET /api/communities` will fail.
- `connect.threads.last_activity_at` does not exist — `GET /api/communities/:id/threads` will fail on the `active` (default) sort.
- `inform.compass_stances.supporting_points` does not exist — the RPC function cannot be created.
- `connect.get_stances_for_community` does not exist — `GET /api/communities/:id/stances` will return a Supabase error.

This is an operational/deployment gap, not a code gap. The SQL is correct and ready.

## Human Verification Items

1. **Apply migration to live database**
   Run `supabase db push` from the project root (or apply the migration through the Supabase dashboard) to create the required columns and RPC function.

2. **Smoke test community list against live DB**
   `GET /api/communities` — confirm 200 with `data` array, `meta.cursor`, and `sliceLabel` field present.

3. **Smoke test stances endpoint against live DB**
   `GET /api/communities/:id/stances` for a community whose topic has rows in `inform.compass_stances` — confirm stance cards return with `position`, `text`, `supportingPoints`.

4. **Smoke test thread list with active sort**
   `GET /api/communities/:id/threads` (default `sort=active`) — confirm `last_activity_at` column is used for ordering and `lastActivityAt` appears in response.

5. **Confirm in-memory cache fallback activates without Redis env vars**
   Deploy without `UPSTASH_REDIS_REST_URL` set; make two identical requests and confirm second response is served from memory (no second DB round-trip visible in logs).

6. **Confirm Redis TTLs in production**
   With Redis env vars set, verify via Upstash console that cached keys carry the correct TTL values (300 s for communities, 1800 s for stances, 30 s for threads).

## Next Phase Readiness

Phase 4 (write paths: create thread, create post, membership) is unblocked from a code-structure perspective — all read routes, middleware, and utilities are in place. However, the Phase 3 migration should be applied before Phase 4 development begins so that integration tests against a real database work correctly from the start.
