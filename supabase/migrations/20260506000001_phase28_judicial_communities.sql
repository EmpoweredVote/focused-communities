-- Phase 28: Judicial companion Focused Communities
-- 8 connect.communities rows seeded + fc_community_slug populated on inform.compass_topics
-- Migration: 20260506000001_phase28_judicial_communities.sql

DO $$
DECLARE
  v_criminal_justice_id   UUID;
  v_access_to_justice_id  UUID;
  v_gov_deference_id      UUID;
  v_transparency_id       UUID;
  v_interpretation_id     UUID;
  v_bail_pretrial_id      UUID;
  v_prosecution_id        UUID;
  v_police_acct_id        UUID;
BEGIN

  SELECT id INTO v_criminal_justice_id   FROM inform.compass_topics WHERE topic_key = 'judicial-criminal-justice'       AND is_live = true;
  SELECT id INTO v_access_to_justice_id  FROM inform.compass_topics WHERE topic_key = 'judicial-access-to-justice'      AND is_live = true;
  SELECT id INTO v_gov_deference_id      FROM inform.compass_topics WHERE topic_key = 'judicial-government-deference'   AND is_live = true;
  SELECT id INTO v_transparency_id       FROM inform.compass_topics WHERE topic_key = 'judicial-transparency'           AND is_live = true;
  SELECT id INTO v_interpretation_id     FROM inform.compass_topics WHERE topic_key = 'judicial-interpretation'         AND is_live = true;
  SELECT id INTO v_bail_pretrial_id      FROM inform.compass_topics WHERE topic_key = 'judicial-bail-pretrial'          AND is_live = true;
  SELECT id INTO v_prosecution_id        FROM inform.compass_topics WHERE topic_key = 'judicial-prosecution-priorities' AND is_live = true;
  SELECT id INTO v_police_acct_id        FROM inform.compass_topics WHERE topic_key = 'judicial-police-accountability'  AND is_live = true;

  IF v_criminal_justice_id IS NULL THEN RAISE EXCEPTION 'topic judicial-criminal-justice not found — run Phase 27 migration first'; END IF;
  IF v_access_to_justice_id IS NULL THEN RAISE EXCEPTION 'topic judicial-access-to-justice not found'; END IF;
  IF v_gov_deference_id IS NULL THEN RAISE EXCEPTION 'topic judicial-government-deference not found'; END IF;
  IF v_transparency_id IS NULL THEN RAISE EXCEPTION 'topic judicial-transparency not found'; END IF;
  IF v_interpretation_id IS NULL THEN RAISE EXCEPTION 'topic judicial-interpretation not found'; END IF;
  IF v_bail_pretrial_id IS NULL THEN RAISE EXCEPTION 'topic judicial-bail-pretrial not found'; END IF;
  IF v_prosecution_id IS NULL THEN RAISE EXCEPTION 'topic judicial-prosecution-priorities not found'; END IF;
  IF v_police_acct_id IS NULL THEN RAISE EXCEPTION 'topic judicial-police-accountability not found'; END IF;

  INSERT INTO connect.communities (slug, name, description, topic_id)
  VALUES
    (
      'criminal-justice-philosophy',
      'Criminal Justice Philosophy',
      'When someone breaks the law, should a judge focus on punishment — or on helping them change? How a judge answers that shapes every sentence they hand down.',
      v_criminal_justice_id
    ),
    (
      'access-to-justice',
      'Access to Justice',
      'Does it take money and a good lawyer to get a fair shot in court — or should the system work for everyone? Discuss how this candidate sees equal access.',
      v_access_to_justice_id
    ),
    (
      'government-deference',
      'Government Deference',
      'When the government says it has the power to do something, should judges take their word for it — or make them prove it? Where''s the line between trust and oversight?',
      v_gov_deference_id
    ),
    (
      'court-transparency',
      'Court Transparency',
      'Should court hearings be open for anyone to watch, and should rulings be easy for regular people to read and understand? Discuss how open the legal system should be.',
      v_transparency_id
    ),
    (
      'legal-interpretation',
      'Legal Interpretation',
      'Does the law mean exactly what it says — word for word — or what it should mean for how the world works today? How judges answer this shapes real outcomes.',
      v_interpretation_id
    ),
    (
      'bail-and-pretrial',
      'Bail and Pretrial',
      'If you''re accused of a crime but not yet convicted, should you go home while you wait for trial — or stay in jail? How judges set bail changes who waits behind bars.',
      v_bail_pretrial_id
    ),
    (
      'prosecution-priorities',
      'Prosecution Priorities',
      'Prosecutors can''t go after every case. Which crimes should they fight hardest — and when should they offer a deal or let something go? Their choices shape how justice works.',
      v_prosecution_id
    ),
    (
      'police-accountability',
      'Police Accountability',
      'When a police officer is accused of wrongdoing, should the prosecutor treat them the same as anyone else? Discuss how a DA or City Attorney should handle cases involving law enforcement.',
      v_police_acct_id
    )
  ON CONFLICT (slug) DO NOTHING;

  UPDATE inform.compass_topics SET fc_community_slug = 'criminal-justice-philosophy'  WHERE id = v_criminal_justice_id  AND (fc_community_slug IS NULL OR fc_community_slug != 'criminal-justice-philosophy');
  UPDATE inform.compass_topics SET fc_community_slug = 'access-to-justice'            WHERE id = v_access_to_justice_id  AND (fc_community_slug IS NULL OR fc_community_slug != 'access-to-justice');
  UPDATE inform.compass_topics SET fc_community_slug = 'government-deference'         WHERE id = v_gov_deference_id      AND (fc_community_slug IS NULL OR fc_community_slug != 'government-deference');
  UPDATE inform.compass_topics SET fc_community_slug = 'court-transparency'           WHERE id = v_transparency_id       AND (fc_community_slug IS NULL OR fc_community_slug != 'court-transparency');
  UPDATE inform.compass_topics SET fc_community_slug = 'legal-interpretation'         WHERE id = v_interpretation_id     AND (fc_community_slug IS NULL OR fc_community_slug != 'legal-interpretation');
  UPDATE inform.compass_topics SET fc_community_slug = 'bail-and-pretrial'            WHERE id = v_bail_pretrial_id      AND (fc_community_slug IS NULL OR fc_community_slug != 'bail-and-pretrial');
  UPDATE inform.compass_topics SET fc_community_slug = 'prosecution-priorities'       WHERE id = v_prosecution_id        AND (fc_community_slug IS NULL OR fc_community_slug != 'prosecution-priorities');
  UPDATE inform.compass_topics SET fc_community_slug = 'police-accountability'        WHERE id = v_police_acct_id        AND (fc_community_slug IS NULL OR fc_community_slug != 'police-accountability');

END $$;
