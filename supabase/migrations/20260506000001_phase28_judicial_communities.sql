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
      'How should voters weigh a judge''s sentencing philosophy — leniency vs. accountability — when evaluating their fitness for the bench?',
      v_criminal_justice_id
    ),
    (
      'access-to-justice',
      'Access to Justice',
      'How should voters assess whether a judge''s record prioritizes equal access to the courts for all litigants, including those without resources?',
      v_access_to_justice_id
    ),
    (
      'government-deference',
      'Government Deference',
      'How should voters evaluate whether a judge''s rulings show appropriate skepticism or deference toward government agencies and executive authority?',
      v_gov_deference_id
    ),
    (
      'court-transparency',
      'Court Transparency',
      'How should voters judge a legal candidate''s commitment to open proceedings, public access to rulings, and courtroom accountability?',
      v_transparency_id
    ),
    (
      'legal-interpretation',
      'Legal Interpretation',
      'How should voters evaluate a judge''s interpretive approach — strict textualism vs. evolving standards — and what that means for future rulings?',
      v_interpretation_id
    ),
    (
      'bail-and-pretrial',
      'Bail and Pretrial',
      'How should voters assess a judge''s bail-setting record — balancing public safety concerns against the presumption of innocence for defendants?',
      v_bail_pretrial_id
    ),
    (
      'prosecution-priorities',
      'Prosecution Priorities',
      'How should voters evaluate how a prosecutor chooses which cases to pursue aggressively and which to resolve through diversion or dismissal?',
      v_prosecution_id
    ),
    (
      'police-accountability',
      'Police Accountability',
      'How should voters assess a prosecutor''s record on holding law enforcement accountable — including decisions to charge or decline cases involving officers?',
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
