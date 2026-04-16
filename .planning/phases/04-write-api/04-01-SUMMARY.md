---
phase: 04-write-api
plan: 01
subsystem: api
tags: [express, upstash, rate-limiting, cache-invalidation, typescript, supabase]

# Dependency graph
requires:
  - phase: 02-auth-infrastructure
    provides: requireAuth middleware (JWT verify + accounts API), requireConnected tier guard
  - phase: 03-read-api-cache
    provides: cacheGet/cacheSet in redis.ts, cacheMiddleware, existing threads/posts GET routes

provides:
  - POST /api/communities/:id/threads — authenticated thread creation with validation + rate limiting
  - POST /api/threads/:id/posts — authenticated reply posting with validation + rate limiting
  - postRateLimiter singleton (src/lib/rateLimit.ts) — shared 5/hr sliding window per user
  - cacheDel utility (src/lib/redis.ts) — Redis + in-memory cache invalidation on writes

affects:
  - 04-write-api (plans 02, 03 — edit/delete endpoints can reuse postRateLimiter pattern for reference)
  - 05-frontend (Framer components that call these POST endpoints need auth token handling)

# Tech tracking
tech-stack:
  added:
    - "@upstash/ratelimit@2.0.8 — sliding window rate limiting"
  patterns:
    - "Shared rate limiter bucket: thread creation and reply posting consume from same per-user bucket"
    - "Dev/test stub pattern: rate limiter exports real Ratelimit when env vars present, otherwise stub with always-success"
    - "Write route middleware chain: requireAuth → requireConnected → handler"
    - "Validation before rate limiting: 422 returned without consuming rate limit quota"
    - "Fire-and-forget thread update: reply_count/last_activity_at update is awaited but not blocking response"
    - "Cache invalidation on write: cacheDel called after successful insert, before 201 response"

key-files:
  created:
    - src/lib/rateLimit.ts
  modified:
    - src/lib/redis.ts
    - src/routes/threads.ts
    - src/routes/posts.ts
    - package.json
    - package-lock.json

key-decisions:
  - "Validation runs before rate limiting — invalid requests do not consume rate limit quota"
  - "Thread existence check runs before validation in POST /threads/:id/posts — fail fast on missing thread"
  - "reply_count update is awaited (not fire-and-forget) for consistency, but failure does not block 201 response"
  - "cacheDel Redis error is warn-and-continue — in-memory store always cleared regardless of Redis outcome"
  - "reset from @upstash/ratelimit is milliseconds; Retry-After header divides by 1000 for seconds"

patterns-established:
  - "Write middleware chain: requireAuth, requireConnected as separate middleware handlers in array"
  - "Validation uses trimmed values and record of errors, returns 422 on any failure before any I/O"
  - "Rate limit 429 response: Retry-After header + { reason: 'rate_limited' } body"
  - "Cache invalidation key format matches cacheMiddleware key: fc:{req.path}:{JSON.stringify(req.query)}"

# Metrics
duration: 3min
completed: 2026-04-16
---

# Phase 4 Plan 01: POST Endpoints + Rate Limiter Summary

**Upstash sliding-window rate limiter (5/hr per user) and cache-invalidating POST endpoints for thread creation and reply posting**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-04-16T16:25:15Z
- **Completed:** 2026-04-16T16:28:25Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- Rate limiter singleton with real Upstash or dev/test stub, shared across all write operations
- cacheDel utility extending existing Redis module — clears both Upstash and in-memory fallback
- POST /api/communities/:id/threads: validates title (5-150 chars) + body (10-5000 chars), rate limits, inserts with trigger for display name snapshot, invalidates thread list cache, returns 201
- POST /api/threads/:id/posts: verifies thread visibility, validates body, rate limits, inserts, increments reply_count + last_activity_at, invalidates thread detail and posts list cache, returns 201

## Task Commits

1. **Task 1: Install @upstash/ratelimit, create rate limiter module, add cacheDel** - `f67ddf8` (feat)
2. **Task 2: POST /api/communities/:id/threads and POST /api/threads/:id/posts** - `d8f5421` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `src/lib/rateLimit.ts` - postRateLimiter singleton: Ratelimit.slidingWindow(5, '1 h') or dev stub
- `src/lib/redis.ts` - Added cacheDel(...keys): clears Redis + in-memory store
- `src/routes/threads.ts` - Added POST /communities/:id/threads with auth, validation, rate limit, insert, cacheDel
- `src/routes/posts.ts` - Added POST /threads/:id/posts with thread check, auth, validation, rate limit, insert, update, cacheDel
- `package.json` / `package-lock.json` - @upstash/ratelimit@2.0.8 added

## Decisions Made

- Validation runs before rate limiting — invalid requests do not consume rate limit quota. Clean UX: a user who submits a too-short title isn't penalized.
- Thread existence check is first in POST /threads/:id/posts — fails fast before spending rate limit quota on a missing thread.
- reply_count update is awaited but its failure doesn't block the 201 response (write already succeeded). No try/catch around it — Supabase errors are non-fatal here.
- cacheDel warns and continues on Redis error — in-memory store always cleared. Consistent with existing cacheGet/cacheSet fallback pattern.
- `reset` from @upstash/ratelimit is milliseconds; `Retry-After` header must divide by 1000. Documented in code.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required beyond existing UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN env vars (already documented in Phase 3). When those vars are present, the rate limiter automatically switches from stub to real Upstash.

## Next Phase Readiness

- POST endpoints complete and tested
- Rate limiter infrastructure ready for reuse by edit endpoints (plan 04-02)
- All 30 existing read tests pass
- Ready for plan 04-02: edit (PATCH) endpoints for threads and posts

---
*Phase: 04-write-api*
*Completed: 2026-04-16*
