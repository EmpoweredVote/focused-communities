-- Phase 4.5: Add description and example_perspectives to inform.compass_stances
ALTER TABLE inform.compass_stances
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS example_perspectives TEXT[] NOT NULL DEFAULT '{}';

-- Must drop and recreate to change RETURNS TABLE signature
DROP FUNCTION IF EXISTS connect.get_stances_for_community(UUID);

CREATE FUNCTION connect.get_stances_for_community(p_community_id UUID)
RETURNS TABLE (
  "position"            INT,
  text                  TEXT,
  supporting_points     TEXT[],
  description           TEXT,
  example_perspectives  TEXT[]
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    s.value AS "position",
    s.text,
    COALESCE(s.supporting_points, '{}')    AS supporting_points,
    s.description,
    COALESCE(s.example_perspectives, '{}') AS example_perspectives
  FROM connect.communities c
  JOIN inform.compass_stances s ON s.topic_id = c.topic_id
  WHERE c.id = p_community_id
  ORDER BY s.value ASC;
$$;

GRANT EXECUTE ON FUNCTION connect.get_stances_for_community(UUID) TO anon, authenticated;
