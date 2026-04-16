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
--   3. supporting_points on inform.compass_stances — applied (table confirmed)
--   4. connect.get_stances_for_community RPC function — applied
--
-- Note on inform schema dependency:
--   inform.compass_stances confirmed to exist with columns:
--   id (uuid), topic_id (uuid), value (integer), text (text).
--   The RPC function uses s.value AS position (column is 'value', not 'position').
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


-- ============================================================
-- 3. Add supporting_points array to inform.compass_stances
--    (inform.compass_stances confirmed to exist with columns:
--     id, topic_id, value, text)
--    supporting_points is an ordered list of short justifications
--    for each compass position; empty by default.
-- ============================================================

-- Phase 3: Add supporting_points array to compass_stances
-- (inform.compass_stances confirmed to exist with columns: id, topic_id, value, text)
ALTER TABLE inform.compass_stances ADD COLUMN IF NOT EXISTS supporting_points TEXT[] NOT NULL DEFAULT '{}';


-- ============================================================
-- 4. RPC function: cross-schema join from connect.* to inform.*
--    Lives in connect schema with SECURITY DEFINER so anon role
--    can read inform.* without needing direct schema grants.
--    NOTE: inform.compass_stances uses 'value' (integer) for
--    position — aliased as 'position' in RETURNS TABLE.
-- ============================================================

CREATE OR REPLACE FUNCTION connect.get_stances_for_community(p_community_id UUID)
RETURNS TABLE (
  position    INT,
  text        TEXT,
  supporting_points TEXT[]
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    s.value AS position,          -- inform.compass_stances uses 'value', not 'position'
    s.text,
    COALESCE(s.supporting_points, '{}') AS supporting_points
  FROM connect.communities c
  JOIN inform.compass_stances s ON s.topic_id = c.topic_id
  WHERE c.id = p_community_id
  ORDER BY s.value ASC;
$$;

GRANT EXECUTE ON FUNCTION connect.get_stances_for_community(UUID) TO anon, authenticated;
