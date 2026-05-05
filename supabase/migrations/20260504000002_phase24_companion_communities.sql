-- Phase 24: Companion Focused Communities
-- Adds 10 connect.communities rows (one per LOCAL topic from Phase 23) and
-- back-fills inform.compass_topics.fc_community_slug for each of those topics.
-- Source: .planning/phases/24-companion-focused-communities/24-CONTEXT.md + 24-RESEARCH.md
-- Phase 23 migration: 20260504000001_phase23_local_compass_topics.sql

BEGIN;

-- ============================================================
-- SECTION 1: connect.communities INSERTs (10 rows)
-- ============================================================

INSERT INTO connect.communities (slug, name, description, topic_id)
SELECT 'residential-zoning',
       'Residential Zoning',
       'Explore neighborhood character preservation, accessory dwelling units, market-led density, transit-oriented upzoning, and how cities decide who gets to shape their own streets.',
       t.id
FROM inform.compass_topics t
WHERE t.topic_key = 'residential-zoning' AND t.is_live = true
ON CONFLICT (slug) DO NOTHING;

INSERT INTO connect.communities (slug, name, description, topic_id)
SELECT 'growth-and-development',
       'Growth and Development',
       'Discuss growth moratoriums, managed-growth planning, infrastructure-led expansion, aggressive development incentives, and how cities balance new residents with existing ones.',
       t.id
FROM inform.compass_topics t
WHERE t.topic_key = 'growth-and-development' AND t.is_live = true
ON CONFLICT (slug) DO NOTHING;

INSERT INTO connect.communities (slug, name, description, topic_id)
SELECT 'public-safety-approach',
       'Public Safety Approach',
       'Engage with increased police staffing, co-responder models, parallel crisis response investment, and redirecting portions of police budgets to mental-health and social services.',
       t.id
FROM inform.compass_topics t
WHERE t.topic_key = 'public-safety-approach' AND t.is_live = true
ON CONFLICT (slug) DO NOTHING;

INSERT INTO connect.communities (slug, name, description, topic_id)
SELECT 'homelessness-response',
       'Homelessness Response',
       'Explore encampment enforcement, shelter-first intake, housing-first programs, root-cause social services, and harm-reduction and tenant-protection approaches to homelessness.',
       t.id
FROM inform.compass_topics t
WHERE t.topic_key = 'homelessness-response' AND t.is_live = true
ON CONFLICT (slug) DO NOTHING;

INSERT INTO connect.communities (slug, name, description, topic_id)
SELECT 'economic-development',
       'Economic Development',
       'Discuss aggressive tax abatements, targeted incentives for priority sectors, infrastructure-led growth, small-business and workforce investment, and market-only approaches.',
       t.id
FROM inform.compass_topics t
WHERE t.topic_key = 'economic-development' AND t.is_live = true
ON CONFLICT (slug) DO NOTHING;

INSERT INTO connect.communities (slug, name, description, topic_id)
SELECT 'transportation-priorities',
       'Transportation Priorities',
       'Engage with road and highway investment, balanced multimodal planning, transit expansion, bicycle and pedestrian priority, and transit-oriented density as competing city visions.',
       t.id
FROM inform.compass_topics t
WHERE t.topic_key = 'transportation-priorities' AND t.is_live = true
ON CONFLICT (slug) DO NOTHING;

INSERT INTO connect.communities (slug, name, description, topic_id)
SELECT 'local-environment',
       'Local Environment',
       'Explore development-first permitting, light environmental review, balanced impact standards, strong conservation protections, and how cities weigh ecological preservation against growth.',
       t.id
FROM inform.compass_topics t
WHERE t.topic_key = 'local-environment' AND t.is_live = true
ON CONFLICT (slug) DO NOTHING;

INSERT INTO connect.communities (slug, name, description, topic_id)
SELECT 'rent-regulation',
       'Rent Regulation',
       'Discuss market-only rent setting, basic tenant protections, modest rent stabilization, strong rent control ordinances, and public housing expansion as approaches to housing costs.',
       t.id
FROM inform.compass_topics t
WHERE t.topic_key = 'rent-regulation' AND t.is_live = true
ON CONFLICT (slug) DO NOTHING;

INSERT INTO connect.communities (slug, name, description, topic_id)
SELECT 'immigration-policy',
       'Immigration Policy',
       'Engage with full federal cooperation, serious-crime-only collaboration, status-quo limited cooperation, sanctuary policies, and strong sanctuary with legal defense funding.',
       t.id
FROM inform.compass_topics t
WHERE t.topic_key = 'local-immigration' AND t.is_live = true
ON CONFLICT (slug) DO NOTHING;

INSERT INTO connect.communities (slug, name, description, topic_id)
SELECT 'city-sanitation',
       'City Sanitation',
       'Explore strict enforcement and fines, service privatization, status-quo municipal operations, expanded public staffing, and community-led sanitation models for street cleanliness.',
       t.id
FROM inform.compass_topics t
WHERE t.topic_key = 'city-sanitation' AND t.is_live = true
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- SECTION 2: inform.compass_topics.fc_community_slug back-fill (10 rows)
-- ============================================================

UPDATE inform.compass_topics SET fc_community_slug = 'residential-zoning'
WHERE topic_key = 'residential-zoning' AND is_live = true;

UPDATE inform.compass_topics SET fc_community_slug = 'growth-and-development'
WHERE topic_key = 'growth-and-development' AND is_live = true;

UPDATE inform.compass_topics SET fc_community_slug = 'public-safety-approach'
WHERE topic_key = 'public-safety-approach' AND is_live = true;

UPDATE inform.compass_topics SET fc_community_slug = 'homelessness-response'
WHERE topic_key = 'homelessness-response' AND is_live = true;

UPDATE inform.compass_topics SET fc_community_slug = 'economic-development'
WHERE topic_key = 'economic-development' AND is_live = true;

UPDATE inform.compass_topics SET fc_community_slug = 'transportation-priorities'
WHERE topic_key = 'transportation-priorities' AND is_live = true;

UPDATE inform.compass_topics SET fc_community_slug = 'local-environment'
WHERE topic_key = 'local-environment' AND is_live = true;

UPDATE inform.compass_topics SET fc_community_slug = 'rent-regulation'
WHERE topic_key = 'rent-regulation' AND is_live = true;

UPDATE inform.compass_topics SET fc_community_slug = 'immigration-policy'
WHERE topic_key = 'local-immigration' AND is_live = true;

UPDATE inform.compass_topics SET fc_community_slug = 'city-sanitation'
WHERE topic_key = 'city-sanitation' AND is_live = true;

COMMIT;
