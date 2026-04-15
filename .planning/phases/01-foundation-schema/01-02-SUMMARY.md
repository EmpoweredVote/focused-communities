---
phase: 01-foundation-schema
plan: 02
subsystem: database
tags: [postgresql, supabase, migrations, rls, triggers, enums]

requires:
  - phase: 01-foundation-schema/01-01
    provides: Supabase CLI initialized, supabase/migrations/ directory exists
provides:
  - connect.* schema with all 5 tables
  - moderation_status enum (visible/hidden)
  - public.connected_profiles table
  - Display name snapshot triggers (BEFORE INSERT on threads/posts)
  - Edit history triggers (AFTER UPDATE on threads/posts)
  - RLS enabled on all 6 tables
affects: [01-03-rls-policies, 02-auth-infrastructure, 03-read-api]

tech-stack:
  added: []
  patterns: [supabase-cli-migrations, trigger-based-audit, display-name-snapshot]

key-files:
  created: [supabase/migrations/20260415214142_connect_schema_tables.sql]
  modified: []

key-decisions:
  - "moderation_status enum with only 'visible' and 'hidden' — no speculative values"
  - "topic_id UUID NOT NULL without FK — inform schema cross-schema FK deferred to Phase 3"
  - "connected_profiles in public schema for trigger access from connect functions"
  - "SECURITY DEFINER on trigger functions so snapshot can read connected_profiles regardless of RLS"
  - "WHEN clause on AFTER UPDATE triggers prevents spurious fires on metadata-only updates"

patterns-established:
  - "Migration-per-concern: tables in one file, RLS in next, views in third"
  - "Trigger-based display name snapshot: BEFORE INSERT reads connected_profiles"
  - "AFTER UPDATE with WHEN clause for edit history — prevents spurious trigger fires"

duration: 2min
completed: 2026-04-15
---

# Phase 1 Plan 02: Schema Migration Summary

**Complete connect.* schema in a single migration: 5 tables, moderation_status enum, connected_profiles foundation, BEFORE INSERT display name triggers, AFTER UPDATE edit history triggers, and RLS enabled on all 6 tables.**

## Performance
- **Duration:** 2 min
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- Created `supabase/migrations/20260415214142_connect_schema_tables.sql` with the full connect.* schema
- `connect.moderation_status` enum with exactly `'visible'` and `'hidden'` — no speculative values (enum values cannot be removed in PostgreSQL)
- `public.connected_profiles` as foundation table for display name snapshots; no FK to `auth.users` (Supabase manages that schema internally)
- `connect.communities` with `topic_id UUID NOT NULL` and no FK constraint (cross-schema FK to inform deferred to Phase 3)
- `connect.threads` and `connect.posts` with `author_display_name TEXT NOT NULL DEFAULT ''` populated by BEFORE INSERT trigger
- `connect.posts` with `parent_post_id UUID REFERENCES connect.posts(id)` for nested replies
- `connect.thread_edits` and `connect.post_edits` capturing old content on AFTER UPDATE (memory over moderation design principle)
- Two BEFORE INSERT trigger functions + triggers snapshot display name from `connected_profiles` at post time
- Two AFTER UPDATE trigger functions + triggers (with `WHEN (OLD... IS DISTINCT FROM NEW...)` clause) log edit history only when content changes
- All trigger functions marked `SECURITY DEFINER` so they can read `connected_profiles` regardless of RLS
- RLS enabled on all 6 tables — policies will be applied in Plan 01-03

## Task Commits
1. **Task 1: Create connect.* schema migration** — `7f6e30b` (feat)

**Plan metadata:** (see below)

## Files Created/Modified
- `supabase/migrations/20260415214142_connect_schema_tables.sql` — Full connect.* schema (198 lines)

## Decisions Made
- `topic_id` has no FK to inform schema — deferred to Phase 3 (cross-schema FK feasibility unverified)
- `connected_profiles` lives in `public` schema so trigger functions in `connect` schema can access it cleanly
- Trigger functions use `SECURITY DEFINER` to avoid RLS interference at trigger execution time
- `WHEN` clause on AFTER UPDATE triggers: `OLD.title IS DISTINCT FROM NEW.title OR OLD.body IS DISTINCT FROM NEW.body` — prevents unnecessary audit rows on metadata-only updates (e.g., reply_count increments)
- No `deleted_at` columns anywhere — soft delete is handled by `moderation_status` enum per design decision from Phase 1 research

## Deviations from Plan
None — plan executed exactly as written.

## Issues Encountered
None. The `supabase/migrations/` directory did not exist (only `supabase/config.toml` was present from 01-01), so it was created before running `npx supabase migration new`. This is expected for a fresh Supabase CLI init.

## Next Phase Readiness
Ready for 01-03-PLAN.md (RLS policies, grants, indexes, views).

All tables are defined, RLS is enabled (blocking all access until policies are applied in 01-03), and the trigger infrastructure is in place. The 01-03 plan can safely apply `GRANT USAGE ON SCHEMA connect`, create read/write policies using `(SELECT auth.uid())`, add performance indexes, and create public-facing views.
