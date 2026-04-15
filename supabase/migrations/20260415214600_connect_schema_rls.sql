-- =============================================================================
-- Plan 01-03 Task 1: RLS Policies, Schema Grants, and Policy Column Indexes
-- =============================================================================
-- Security layer for the connect.* schema.
-- All auth.uid() calls are wrapped in (SELECT auth.uid()) for statement-level
-- caching (~95% faster per Supabase team benchmarks).
-- No DELETE policies anywhere -- memory over moderation (moderation_status only).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Schema grants (must precede any policy that references roles)
-- ---------------------------------------------------------------------------

GRANT USAGE ON SCHEMA connect TO anon, authenticated;

-- anon: read only on all current tables
GRANT SELECT ON ALL TABLES IN SCHEMA connect TO anon;

-- authenticated: read + write (RLS further restricts which rows)
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA connect TO authenticated;

-- Future tables in the connect schema get the same grants automatically
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA connect
  GRANT SELECT ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA connect
  GRANT SELECT, INSERT, UPDATE ON TABLES TO authenticated;

-- ---------------------------------------------------------------------------
-- 2. RLS policies for connect.communities
-- ---------------------------------------------------------------------------

-- Anyone (anon or authenticated) can read all communities
CREATE POLICY "communities_select_all"
ON connect.communities FOR SELECT
TO anon, authenticated
USING (true);

-- ---------------------------------------------------------------------------
-- 3. RLS policies for connect.threads
-- ---------------------------------------------------------------------------

-- Anyone can read visible threads
CREATE POLICY "threads_select_visible"
ON connect.threads FOR SELECT
TO anon, authenticated
USING (moderation_status = 'visible');

-- Authenticated users can insert their own threads only
CREATE POLICY "threads_insert_own"
ON connect.threads FOR INSERT
TO authenticated
WITH CHECK ((SELECT auth.uid()) = author_id);

-- Authors can update their own visible threads
CREATE POLICY "threads_update_own"
ON connect.threads FOR UPDATE
TO authenticated
USING ((SELECT auth.uid()) = author_id AND moderation_status = 'visible')
WITH CHECK ((SELECT auth.uid()) = author_id);

-- ---------------------------------------------------------------------------
-- 4. RLS policies for connect.posts
-- ---------------------------------------------------------------------------

-- Anyone can read visible posts
CREATE POLICY "posts_select_visible"
ON connect.posts FOR SELECT
TO anon, authenticated
USING (moderation_status = 'visible');

-- Authenticated users can insert their own posts only
CREATE POLICY "posts_insert_own"
ON connect.posts FOR INSERT
TO authenticated
WITH CHECK ((SELECT auth.uid()) = author_id);

-- Authors can update their own visible posts
CREATE POLICY "posts_update_own"
ON connect.posts FOR UPDATE
TO authenticated
USING ((SELECT auth.uid()) = author_id AND moderation_status = 'visible')
WITH CHECK ((SELECT auth.uid()) = author_id);

-- ---------------------------------------------------------------------------
-- 5. RLS policies for connect.thread_edits (edit history is publicly readable)
-- ---------------------------------------------------------------------------

CREATE POLICY "thread_edits_select_all"
ON connect.thread_edits FOR SELECT
TO anon, authenticated
USING (true);

-- ---------------------------------------------------------------------------
-- 6. RLS policies for connect.post_edits (edit history is publicly readable)
-- ---------------------------------------------------------------------------

CREATE POLICY "post_edits_select_all"
ON connect.post_edits FOR SELECT
TO anon, authenticated
USING (true);

-- ---------------------------------------------------------------------------
-- 7. RLS policies for public.connected_profiles
-- ---------------------------------------------------------------------------

-- Anyone can read profiles (display names are public information)
CREATE POLICY "profiles_select_all"
ON public.connected_profiles FOR SELECT
TO anon, authenticated
USING (true);

-- Users can only insert their own profile row
CREATE POLICY "profiles_insert_own"
ON public.connected_profiles FOR INSERT
TO authenticated
WITH CHECK ((SELECT auth.uid()) = user_id);

-- Users can only update their own profile row
CREATE POLICY "profiles_update_own"
ON public.connected_profiles FOR UPDATE
TO authenticated
USING ((SELECT auth.uid()) = user_id)
WITH CHECK ((SELECT auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- 8. Indexes on all policy columns
-- CRITICAL: in same migration as policies for atomic deployment
-- ---------------------------------------------------------------------------

-- threads: author lookups, community browsing, moderation filtering
CREATE INDEX idx_threads_author_id ON connect.threads(author_id);
CREATE INDEX idx_threads_community_id ON connect.threads(community_id);
CREATE INDEX idx_threads_moderation_status ON connect.threads(moderation_status);

-- posts: thread browsing, author lookups, reply threading, moderation filtering
CREATE INDEX idx_posts_thread_id ON connect.posts(thread_id);
CREATE INDEX idx_posts_author_id ON connect.posts(author_id);
CREATE INDEX idx_posts_parent_post_id ON connect.posts(parent_post_id);
CREATE INDEX idx_posts_moderation_status ON connect.posts(moderation_status);

-- thread_edits: audit history lookups by thread
CREATE INDEX idx_thread_edits_thread_id ON connect.thread_edits(thread_id);

-- post_edits: audit history lookups by post
CREATE INDEX idx_post_edits_post_id ON connect.post_edits(post_id);

-- communities: topic browsing (slug already has UNIQUE index; topic_id does not)
CREATE INDEX idx_communities_topic_id ON connect.communities(topic_id);

-- connected_profiles: user_id policy lookups
-- (UNIQUE constraint exists but an explicit index is needed for policy performance)
CREATE INDEX idx_connected_profiles_user_id ON public.connected_profiles(user_id);
