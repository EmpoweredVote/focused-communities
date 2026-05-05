-- Phase 25: Scope Audit Migration
-- Ensures all 5 LOCAL-applicable existing compass topics have correct compass_topic_roles rows.
--
-- Audit findings (2026-05-05):
--
--   topic_key     | title                                          | UUID                                   | Current scopes
--   --------------|------------------------------------------------|----------------------------------------|-------------------
--   housing       | Affordable Housing                             | 669cac97-66a6-4087-b036-936fbe62efb3   | [] (NONE — cross-cutting by default)
--   childcare     | Childcare Affordability & Access               | c1ac1330-47f7-44ec-baf3-c913d926b97c   | federal, local, state (already correct)
--   data-centers  | Data Center Development & Energy Costs         | 4559b513-0fd8-4ed1-babd-f3b554162f40   | federal, local, state (already correct)
--   homelessness  | Criminalization of Homelessness                | 4938766b-b45a-46e3-93bd-b8b30651271a   | federal, local, state (already correct — RETIRE-01 keep-both decision)
--   jail-capacity | Jail Capacity and Incarceration Alternatives   | c267e137-0ff9-4e7d-9d13-e3cea1756cd0   | local, state (already correct)
--
-- Action: Only housing needs a local row added. All others already have local scope.
-- Pattern: ON CONFLICT (topic_id, role_scope) DO NOTHING ensures idempotency.

-- Affordable Housing: add local scope
-- UUID: 669cac97-66a6-4087-b036-936fbe62efb3
INSERT INTO inform.compass_topic_roles (topic_id, role_scope, is_required)
VALUES ('669cac97-66a6-4087-b036-936fbe62efb3', 'local', true)
ON CONFLICT (topic_id, role_scope) DO NOTHING;

-- Childcare Affordability & Access: already has federal + local + state — no change
-- UUID: c1ac1330-47f7-44ec-baf3-c913d926b97c

-- Data Center Development & Energy Costs: already has federal + local + state — no change
-- UUID: 4559b513-0fd8-4ed1-babd-f3b554162f40

-- Criminalization of Homelessness: already has federal + local + state — no change (RETIRE-01: keep both)
-- UUID: 4938766b-b45a-46e3-93bd-b8b30651271a

-- Jail Capacity and Incarceration Alternatives: already has local + state — no change
-- UUID: c267e137-0ff9-4e7d-9d13-e3cea1756cd0

-- Verification: post-migration state for all 5 topics
SELECT
  ct.topic_key,
  ct.title,
  bool_or(ctr.role_scope = 'local') AS has_local,
  array_agg(ctr.role_scope ORDER BY ctr.role_scope) AS all_scopes
FROM inform.compass_topics ct
LEFT JOIN inform.compass_topic_roles ctr ON ctr.topic_id = ct.id
WHERE ct.topic_key IN (
  'housing',
  'childcare',
  'jail-capacity',
  'homelessness',
  'data-centers'
)
AND ct.is_live = true
GROUP BY ct.topic_key, ct.title
ORDER BY ct.topic_key;
