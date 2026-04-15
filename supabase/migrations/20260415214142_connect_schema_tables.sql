-- Migration: connect_schema_tables
-- Phase 1 Plan 02: Create the complete connect.* schema
-- Tables: communities, threads, posts, thread_edits, post_edits
-- Enum: moderation_status
-- Foundation: public.connected_profiles
-- Triggers: display name snapshot (BEFORE INSERT), edit history (AFTER UPDATE)

-- ============================================================
-- 1. Schema + Enum
-- ============================================================

CREATE SCHEMA IF NOT EXISTS connect;

CREATE TYPE connect.moderation_status AS ENUM ('visible', 'hidden');
-- Only 'visible' and 'hidden' — enum values cannot be removed later, no speculative values.

-- ============================================================
-- 2. public.connected_profiles
-- Foundation table for display name snapshot trigger.
-- user_id references auth.users but we do NOT add a FK to the auth
-- schema — Supabase manages auth.users internally.
-- In public schema (not connect) so trigger functions can read it easily.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.connected_profiles (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 3. connect.communities
-- topic_id has NO FK constraint — inform schema cross-schema FK
-- deferred to Phase 3. See blocker note in STATE.md.
-- ============================================================

CREATE TABLE connect.communities (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id     UUID NOT NULL, -- No FK constraint: inform schema not yet linked. See Phase 3.
  slug         TEXT NOT NULL UNIQUE,
  name         TEXT NOT NULL,
  description  TEXT,
  member_count INT NOT NULL DEFAULT 0,
  thread_count INT NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 4. connect.threads
-- author_display_name is populated by BEFORE INSERT trigger.
-- ============================================================

CREATE TABLE connect.threads (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id        UUID NOT NULL REFERENCES connect.communities(id),
  author_id           UUID NOT NULL,
  author_display_name TEXT NOT NULL DEFAULT '',
  title               TEXT NOT NULL,
  body                TEXT NOT NULL,
  moderation_status   connect.moderation_status NOT NULL DEFAULT 'visible',
  reply_count         INT NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 5. connect.posts
-- parent_post_id is self-referencing for nested replies.
-- author_display_name is populated by BEFORE INSERT trigger.
-- ============================================================

CREATE TABLE connect.posts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id           UUID NOT NULL REFERENCES connect.threads(id),
  parent_post_id      UUID REFERENCES connect.posts(id),
  author_id           UUID NOT NULL,
  author_display_name TEXT NOT NULL DEFAULT '',
  body                TEXT NOT NULL,
  moderation_status   connect.moderation_status NOT NULL DEFAULT 'visible',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 6. connect.thread_edits
-- Captures old title + body on every thread UPDATE (via trigger below).
-- ============================================================

CREATE TABLE connect.thread_edits (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES connect.threads(id),
  editor_id UUID NOT NULL,
  old_title TEXT NOT NULL,
  old_body  TEXT NOT NULL,
  edited_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 7. connect.post_edits
-- Captures old body on every post UPDATE (via trigger below).
-- ============================================================

CREATE TABLE connect.post_edits (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id   UUID NOT NULL REFERENCES connect.posts(id),
  editor_id UUID NOT NULL,
  old_body  TEXT NOT NULL,
  edited_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 8. Display name snapshot trigger
-- BEFORE INSERT on threads and posts — reads connected_profiles
-- to snapshot the author's display name at post time.
-- Falls back to 'Unknown' if no profile found.
-- SECURITY DEFINER so function can read public.connected_profiles
-- regardless of RLS on that table.
-- ============================================================

CREATE OR REPLACE FUNCTION connect.snapshot_author_display_name()
RETURNS TRIGGER AS $$
BEGIN
  SELECT display_name INTO NEW.author_display_name
  FROM public.connected_profiles
  WHERE user_id = NEW.author_id;

  IF NEW.author_display_name IS NULL THEN
    NEW.author_display_name := 'Unknown';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_threads_snapshot_display_name
BEFORE INSERT ON connect.threads
FOR EACH ROW
EXECUTE FUNCTION connect.snapshot_author_display_name();

CREATE TRIGGER trg_posts_snapshot_display_name
BEFORE INSERT ON connect.posts
FOR EACH ROW
EXECUTE FUNCTION connect.snapshot_author_display_name();

-- ============================================================
-- 9. Edit history triggers
-- AFTER UPDATE with WHEN clause — only fires when content changes.
-- Prevents spurious trigger fires on metadata-only updates.
-- editor_id captured from OLD.author_id (the thread/post owner).
-- ============================================================

-- Thread edit history
CREATE OR REPLACE FUNCTION connect.log_thread_edit()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO connect.thread_edits(thread_id, editor_id, old_title, old_body)
  VALUES (OLD.id, OLD.author_id, OLD.title, OLD.body);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_log_thread_edit
AFTER UPDATE ON connect.threads
FOR EACH ROW
WHEN (OLD.title IS DISTINCT FROM NEW.title OR OLD.body IS DISTINCT FROM NEW.body)
EXECUTE FUNCTION connect.log_thread_edit();

-- Post edit history
CREATE OR REPLACE FUNCTION connect.log_post_edit()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO connect.post_edits(post_id, editor_id, old_body)
  VALUES (OLD.id, OLD.author_id, OLD.body);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_log_post_edit
AFTER UPDATE ON connect.posts
FOR EACH ROW
WHEN (OLD.body IS DISTINCT FROM NEW.body)
EXECUTE FUNCTION connect.log_post_edit();

-- ============================================================
-- 10. Enable Row Level Security on all tables
-- Policies are applied in Plan 01-03. RLS must be enabled here
-- so tables are locked down before policies are written.
-- ============================================================

ALTER TABLE connect.communities       ENABLE ROW LEVEL SECURITY;
ALTER TABLE connect.threads           ENABLE ROW LEVEL SECURITY;
ALTER TABLE connect.posts             ENABLE ROW LEVEL SECURITY;
ALTER TABLE connect.thread_edits      ENABLE ROW LEVEL SECURITY;
ALTER TABLE connect.post_edits        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connected_profiles ENABLE ROW LEVEL SECURITY;
