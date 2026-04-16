-- =================================================================
-- Migration: phase3_schema_gaps
-- Phase 3 Plan 01: Close schema column gaps required by read API
-- =================================================================
--
-- Purpose: Add columns and indexes required by Phase 3 read endpoints.
-- This migration closes two confirmed gaps in the connect.* schema
-- (slice_label on communities, last_activity_at on threads) and
-- conditionally adds the inform.* stances table enhancements.
--
-- Sections:
--   1. slice_label on connect.communities  — always applied
--   2. last_activity_at on connect.threads — always applied
--   3. supporting_points on inform.compass_stances — BLOCKED (see below)
--   4. connect.get_stances_for_community RPC function — BLOCKED (see below)
--
-- Note on inform schema dependency:
--   Sections 3 and 4 require inform.compass_stances to exist in the
--   remote database. That table could not be verified at migration
--   authoring time (no linked Supabase CLI / DATABASE_URL unavailable).
--   See BLOCKED comment at the end of this file.
-- =================================================================


-- ============================================================
-- 1. Add slice_label to connect.communities
--    NULL = not sharded; populated when community is a named
--    slice of a larger topic (e.g. 'Northeast', 'Ages 18-35').
-- ============================================================

ALTER TABLE connect.communities ADD COLUMN slice_label TEXT;
-- NULL = not sharded; populated when community is a named slice of a larger topic

CREATE INDEX idx_communities_slice_label
  ON connect.communities(slice_label)
  WHERE slice_label IS NOT NULL;


-- ============================================================
-- 2. Add last_activity_at to connect.threads
--    Semantically distinct from updated_at: tracks the most
--    recent visible-post activity for thread-list sorting.
--    Defaults to now() at thread creation; updated by Phase 4
--    write trigger when a new visible post is added.
--    Composite partial index covers the default sort:
--    community_id + last_activity_at DESC, visible threads only.
-- ============================================================

ALTER TABLE connect.threads
  ADD COLUMN last_activity_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Composite index for the default thread list sort (community_id + last_activity_at DESC, filtered by visible)
CREATE INDEX idx_threads_community_last_activity
  ON connect.threads(community_id, last_activity_at DESC)
  WHERE moderation_status = 'visible';


/*
 * BLOCKED: inform.compass_stances could not be verified in the database.
 * The Supabase CLI was not linked and no DATABASE_URL was available at
 * migration authoring time, so the existence and column names of
 * inform.compass_stances could not be confirmed.
 *
 * The supporting_points ALTER and get_stances_for_community RPC function
 * cannot be safely created until inform.compass_stances is verified.
 *
 * Proceed to Task 2 — the stances endpoint (03-03) will need to be
 * deferred or adapted once the inform schema is confirmed.
 *
 * Once inform.compass_stances is confirmed, add:
 *
 *   ALTER TABLE inform.compass_stances
 *     ADD COLUMN IF NOT EXISTS supporting_points TEXT[] NOT NULL DEFAULT '{}';
 *
 *   CREATE OR REPLACE FUNCTION connect.get_stances_for_community(p_community_id UUID)
 *   RETURNS TABLE (
 *     position          INT,
 *     text              TEXT,
 *     supporting_points TEXT[]
 *   )
 *   LANGUAGE sql
 *   STABLE
 *   SECURITY DEFINER
 *   AS $$
 *     SELECT
 *       s.position,
 *       s.text,
 *       COALESCE(s.supporting_points, '{}') AS supporting_points
 *     FROM connect.communities c
 *     JOIN inform.compass_stances s ON s.topic_id = c.topic_id
 *     WHERE c.id = p_community_id
 *     ORDER BY s.position ASC;
 *   $$;
 *
 *   GRANT EXECUTE ON FUNCTION connect.get_stances_for_community(UUID)
 *     TO anon, authenticated;
 */
