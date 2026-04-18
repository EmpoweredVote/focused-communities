-- Community expansion: create one FC community for each live Compass topic.
-- The five original communities already exist; this adds the remaining 21.
-- Also fixes the Taxation community which was mapped to a non-live topic version.

-- Fix: point the existing Taxation community to the live topic version.
UPDATE connect.communities
SET
  name        = 'Taxation and Public Spending',
  topic_id    = 'f7e5678d-dadd-4556-a2fc-446e24642ceb'
WHERE slug = 'taxation-and-spending';

-- New communities — one per live Compass topic that had no FC community.
INSERT INTO connect.communities (slug, name, description, topic_id) VALUES

  ('affordable-housing',
   'Affordable Housing',
   'Explore five perspectives on housing affordability, rent control, zoning, and the proper role of government in ensuring access to stable housing.',
   '669cac97-66a6-4087-b036-936fbe62efb3'),

  ('campaign-finance-reform',
   'Campaign Finance Reform',
   'Discuss how elections are funded, the influence of money in politics, and what reforms — if any — would best protect democratic representation.',
   '92730f69-ae57-401c-8ad1-2d07834a895d'),

  ('childcare-affordability',
   'Childcare Affordability & Access',
   'Explore the costs of childcare, workforce implications, and what role — if any — government should play in making quality childcare accessible to families.',
   'c1ac1330-47f7-44ec-baf3-c913d926b97c'),

  ('civil-rights',
   'Civil Rights and Social Justice',
   'Engage with five perspectives on civil rights protections, systemic inequality, and what our laws and institutions owe to all citizens.',
   '0bc588c6-39e1-4084-b5de-cac909b8b762'),

  ('climate-change',
   'Climate Change and Environmental Protection',
   'Discuss climate science, environmental policy, the energy transition, and how to balance economic concerns with long-term environmental stewardship.',
   'f1e44d66-5d27-4b51-b54f-b7ace86f6a3c'),

  ('data-center-development',
   'Data Center Development & Energy Costs',
   'Explore the tradeoffs of large-scale data center expansion — economic development, energy consumption, water use, and impact on local communities.',
   '4559b513-0fd8-4ed1-babd-f3b554162f40'),

  ('deportation-priorities',
   'Deportation Priorities',
   'Discuss who should be prioritized for deportation, how enforcement should be conducted, and how to weigh public safety against humanitarian considerations.',
   '44905f3b-e105-4f6c-afc7-5d223813dbac'),

  ('fossil-fuel-policy',
   'Fossil Fuel Policy',
   'Engage with perspectives on oil, gas, and coal production — energy independence, climate impact, economic effects, and the appropriate pace of the energy transition.',
   'a22215c3-6693-4bc2-b248-01aebba14570'),

  ('healthcare-access',
   'Healthcare Access',
   'Discuss how Americans access and pay for healthcare — the roles of government, insurers, and markets in ensuring quality care is available to all.',
   'e8dad4a8-eb93-4931-91f5-d8fb5d7dd529'),

  ('jail-capacity',
   'Jail Capacity and Incarceration Alternatives',
   'Explore perspectives on incarceration rates, jail overcrowding, alternatives to detention, and how the justice system can balance public safety with rehabilitation.',
   'c267e137-0ff9-4e7d-9d13-e3cea1756cd0'),

  ('medicare-medicaid',
   'Medicare / Medicaid',
   'Discuss the future of Medicare and Medicaid — eligibility, funding levels, program scope, and what changes would best serve seniors, low-income families, and taxpayers.',
   'cab61e8a-64fe-4bbd-bc08-fe9914d0091b'),

  ('misinformation-algorithms',
   'Misinformation and the Role of Algorithms in Democracy',
   'Engage with perspectives on online misinformation, algorithmic amplification, platform responsibility, and the appropriate role of government in regulating digital speech.',
   'ddd65d64-9dc7-4208-a30f-59f4b9c0653d'),

  ('religious-freedom',
   'Religious Freedom',
   'Discuss the boundaries of religious liberty — how to balance sincere religious belief with anti-discrimination protections and shared civic obligations.',
   '6b9ba6d9-1001-43f5-b073-4d37130696fd'),

  ('reproductive-rights',
   'Reproductive Rights and Abortion Access',
   'Explore five perspectives on abortion access, reproductive autonomy, fetal rights, and the proper role of government in regulating reproductive healthcare.',
   'af2fdfd6-02c4-49df-b09c-cf8536f4773f'),

  ('same-sex-marriage',
   'Same-Sex Marriage',
   'Engage with diverse perspectives on the legal recognition of same-sex marriage, religious liberty, and what equality under the law requires.',
   'c5ab4eab-702f-49b8-9277-8ea53f3835c6'),

  ('social-security',
   'Social Security',
   'Discuss the future of Social Security — long-term solvency, benefit levels, retirement age, and how to ensure reliable support for retirees and future generations.',
   '87d20824-a6e9-407b-983c-65440084a0ab'),

  ('redistricting',
   'State Redistricting and Gerrymandering',
   'Explore how political districts are drawn, the effects of partisan gerrymandering on representation, and what fair redistricting should look like.',
   '48cc9585-ec22-4f53-8d42-6839828dd36f'),

  ('transgender-athletes',
   'Transgender Athletes',
   'Discuss the inclusion of transgender athletes in competitive sports — competitive fairness, inclusion, scientific evidence, and the rights of all participants.',
   'd1618b9c-0b9e-45af-b986-bb33d270b8e4'),

  ('ukraine-russia',
   'Ukraine - Russia Conflict',
   'Engage with perspectives on U.S. involvement in the Ukraine-Russia conflict — military aid, diplomacy, NATO commitments, and the limits of American responsibility abroad.',
   '24e9212c-b011-422a-865c-093e35050901'),

  ('tariff-policy',
   'United States Tariff Policy',
   'Discuss American tariff and trade policy — protectionism versus free trade, effects on domestic manufacturing, and trade relationships with other nations.',
   '683c8084-2281-4920-a07c-18439b2dd413'),

  ('voting-rights',
   'Voting Rights and Electoral Integrity',
   'Explore perspectives on voter access, election security, ballot laws, and what it means to have free, fair, and trustworthy elections.',
   'd1792200-1d3b-4955-a0b7-0e6980d7a7b2');
