-- =============================================================================
-- Plan 01-03 Task 2: Security-Invoker Views
-- =============================================================================
-- CRITICAL: security_invoker = true is mandatory on every view.
-- Without it, the view runs as the postgres superuser and bypasses all RLS
-- policies silently -- a critical security vulnerability.
-- Both views filter on moderation_status = 'visible' so anon users never
-- see hidden content even if the view is called directly.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. published_posts: all visible posts (top-level and replies)
-- ---------------------------------------------------------------------------

CREATE VIEW connect.published_posts
WITH (security_invoker = true) AS
SELECT
  p.id,
  p.thread_id,
  p.parent_post_id,
  p.author_id,
  p.author_display_name,
  p.body,
  p.created_at,
  p.updated_at,
  p.moderation_status
FROM connect.posts p
WHERE p.moderation_status = 'visible';

-- ---------------------------------------------------------------------------
-- 2. published_replies: only replies (parent_post_id IS NOT NULL)
-- ---------------------------------------------------------------------------

CREATE VIEW connect.published_replies
WITH (security_invoker = true) AS
SELECT
  p.id,
  p.thread_id,
  p.parent_post_id,
  p.author_id,
  p.author_display_name,
  p.body,
  p.created_at,
  p.updated_at
FROM connect.posts p
WHERE p.moderation_status = 'visible'
  AND p.parent_post_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 3. Grant SELECT on both views to anon and authenticated
-- ---------------------------------------------------------------------------

GRANT SELECT ON connect.published_posts TO anon, authenticated;
GRANT SELECT ON connect.published_replies TO anon, authenticated;
