-- Slug history: archive old slugs when a community is renamed so external
-- links (Compass, shared URLs, bookmarks) continue to resolve correctly.

ALTER TABLE connect.communities
  ADD COLUMN slug_history text[] NOT NULL DEFAULT '{}';

-- Archive the old slug into history before any rename takes effect.
CREATE OR REPLACE FUNCTION connect.fn_archive_slug()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.slug <> OLD.slug THEN
    NEW.slug_history = array_append(OLD.slug_history, OLD.slug);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_archive_slug
  BEFORE UPDATE OF slug ON connect.communities
  FOR EACH ROW EXECUTE FUNCTION connect.fn_archive_slug();

-- GIN index so slug_history @> ARRAY[slug] lookups stay fast as communities grow.
CREATE INDEX idx_communities_slug_history ON connect.communities USING gin(slug_history);
