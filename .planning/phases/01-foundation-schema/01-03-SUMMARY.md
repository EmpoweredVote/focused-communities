---
phase: 01-foundation-schema
plan: 03
subsystem: database
tags: [postgresql, supabase, rls, security, indexes, views]

requires:
  - phase: 01-foundation-schema/01-02
    provides: connect.* tables with RLS enabled, public.connected_profiles

provides:
  - RLS policies on all 6 tables (SELECT/INSERT/UPDATE)
  - Schema grants (GRANT USAGE + table-level) for anon and authenticated
  - Policy column indexes (all in same migration as policies)
  - published_posts view (security_invoker = true)
  - published_replies view (security_invoker = true, parent_post_id IS NOT NULL)

affects: [02-auth-infrastructure, 03-read-api, 04-write-api]

tech-stack:
  added: []
  patterns: [rls-with-check-pattern, security-invoker-views, policy-column-indexes]

key-files:
  created:
    - supabase/migrations/20260415214600_connect_schema_rls.sql
    - supabase/migrations/20260415214708_connect_schema_views.sql
  modified: []

key-decisions:
  - "No DELETE policies -- only moderation_status changes allowed (memory over moderation)"
  - "(SELECT auth.uid()) in every policy expression -- not bare auth.uid() (statement-level caching)"
  - "security_invoker = true on all views -- prevents silent RLS bypass by postgres superuser"
  - "Indexes in same migration as policies -- atomic deployment"

duration: 2min
completed: 2026-04-15
---

# Phase 1 Plan 03: RLS Policies + Views Summary

**RLS security layer: 12 policies with WITH CHECK on every write, 11 policy column indexes, and two security-invoker views locking down the connect.* schema before any application code runs.**

## Performance
- **Duration:** 2min
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Applied GRANT USAGE ON SCHEMA connect and table-level grants for anon (SELECT) and authenticated (SELECT/INSERT/UPDATE)
- Added ALTER DEFAULT PRIVILEGES so future tables in the connect schema inherit the same grants automatically
- Created 12 RLS policies across 6 tables (communities, threads, posts, thread_edits, post_edits, connected_profiles)
  - Anon and authenticated can SELECT visible rows on all tables
  - Authenticated can INSERT only rows where author_id / user_id matches their own UID
  - Authenticated can UPDATE only their own visible rows (USING + WITH CHECK on all 3 UPDATE policies)
  - Edit history tables (thread_edits, post_edits) are publicly readable
  - No DELETE policies anywhere -- moderation uses moderation_status column only
- All 10 auth policy expressions use (SELECT auth.uid()) -- zero bare auth.uid() calls
- 11 indexes on policy columns (author_id, community_id, moderation_status, thread_id, parent_post_id, post_id, topic_id, user_id) in the same migration as the policies
- Created connect.published_posts view (security_invoker = true): all visible posts (top-level and replies)
- Created connect.published_replies view (security_invoker = true): visible replies only where parent_post_id IS NOT NULL
- Both views granted SELECT to anon and authenticated

## Task Commits

1. **Task 1: RLS policies, schema grants, indexes** - `9ed6ea4` (feat)
2. **Task 2: Security-invoker views** - `b3ae858` (feat)
**Plan metadata:** (docs -- see final commit)

## Files Created/Modified

- `supabase/migrations/20260415214600_connect_schema_rls.sql` -- 152 lines: grants, 12 policies, 11 indexes
- `supabase/migrations/20260415214708_connect_schema_views.sql` -- 54 lines: 2 security-invoker views + grants

## Decisions Made

- **No DELETE policies** -- Only moderation_status = 'hidden' is used to suppress content. This preserves the edit audit trail and avoids data loss. Carry forward to all future phases.
- **(SELECT auth.uid()) throughout** -- Wrapping auth.uid() in a SELECT subquery enables statement-level plan caching. Verified: zero bare auth.uid() calls in either migration file.
- **security_invoker = true on all views** -- Without this, Supabase views run as postgres superuser and silently bypass all RLS policies. This is a known security footgun; both views are explicitly marked.
- **Indexes in same migration as policies** -- Ensures policy-column indexes are always deployed together with the policies that depend on them; cannot be applied out of order.

## Deviations from Plan

None -- plan executed exactly as written.

## Issues Encountered

None.

## Next Phase Readiness

Phase 1 complete. All 3 migration files exist and apply in correct timestamp order:
1. `20260415214142_connect_schema_tables.sql` -- schema, tables, triggers, RLS enabled
2. `20260415214600_connect_schema_rls.sql` -- grants, policies, indexes
3. `20260415214708_connect_schema_views.sql` -- security-invoker views

Phase 1 success criteria can now be verified:
- connect schema with moderation_status enum exists
- 5 connect.* tables + public.connected_profiles created
- Display name snapshot triggers (BEFORE INSERT) in place
- Edit history triggers (AFTER UPDATE with WHEN clause) in place
- RLS enabled and policies applied on all 6 tables
- Schema grants for anon and authenticated applied
- security_invoker views deployed
- All policy columns indexed

Ready for Phase 2: Auth Infrastructure.
