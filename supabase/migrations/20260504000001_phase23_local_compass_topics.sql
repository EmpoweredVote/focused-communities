-- Phase 23: New LOCAL Compass Topics
-- Adds 10 new LOCAL-scope compass topics + 50 stances + 14 scope tags.
-- Topics: Residential Zoning, Growth and Development Pace, Public Safety Approach,
--   Homelessness Response, Economic Development Incentives, Transportation Priorities,
--   Environmental Protection vs. Development, Rent Regulation,
--   Local Immigration Enforcement, City Sanitation and Cleanliness.
-- All 10 are inserted as is_live=true with went_live_at=now().
-- Source: .planning/phases/23-new-local-compass-topics/23-CONTEXT.md + 23-RESEARCH.md

BEGIN;

-- ============================================================
-- SECTION 1: compass_topics (10 rows)
-- ============================================================

INSERT INTO inform.compass_topics
  (id, topic_key, title, short_title, question_text, is_live, went_live_at)
VALUES
  (gen_random_uuid(), 'residential-zoning', 'Residential Zoning', 'Residential Zoning',
   'What should guide decisions about housing density and neighborhood character in your city?', true, now())
ON CONFLICT DO NOTHING;

INSERT INTO inform.compass_topics
  (id, topic_key, title, short_title, question_text, is_live, went_live_at)
VALUES
  (gen_random_uuid(), 'growth-and-development', 'Growth and Development Pace', 'Growth and Development Pace',
   'How should your city manage population growth and new development?', true, now())
ON CONFLICT DO NOTHING;

INSERT INTO inform.compass_topics
  (id, topic_key, title, short_title, question_text, is_live, went_live_at)
VALUES
  (gen_random_uuid(), 'public-safety-approach', 'Public Safety Approach', 'Public Safety Approach',
   'How should your city fund and operate public safety services?', true, now())
ON CONFLICT DO NOTHING;

INSERT INTO inform.compass_topics
  (id, topic_key, title, short_title, question_text, is_live, went_live_at)
VALUES
  (gen_random_uuid(), 'homelessness-response', 'Homelessness Response', 'Homelessness Response',
   'What should be your city''s primary strategy for addressing homelessness?', true, now())
ON CONFLICT DO NOTHING;

INSERT INTO inform.compass_topics
  (id, topic_key, title, short_title, question_text, is_live, went_live_at)
VALUES
  (gen_random_uuid(), 'economic-development', 'Economic Development Incentives', 'Economic Development Incentives',
   'How should your city attract businesses and support economic development?', true, now())
ON CONFLICT DO NOTHING;

INSERT INTO inform.compass_topics
  (id, topic_key, title, short_title, question_text, is_live, went_live_at)
VALUES
  (gen_random_uuid(), 'transportation-priorities', 'Transportation Priorities', 'Transportation Priorities',
   'Where should your city focus its transportation investment?', true, now())
ON CONFLICT DO NOTHING;

INSERT INTO inform.compass_topics
  (id, topic_key, title, short_title, question_text, is_live, went_live_at)
VALUES
  (gen_random_uuid(), 'local-environment', 'Environmental Protection vs. Development', 'Environmental Protection vs. Development',
   'How should your city balance new development with environmental preservation?', true, now())
ON CONFLICT DO NOTHING;

INSERT INTO inform.compass_topics
  (id, topic_key, title, short_title, question_text, is_live, went_live_at)
VALUES
  (gen_random_uuid(), 'rent-regulation', 'Rent Regulation', 'Rent Regulation',
   'What role should your city play in regulating rents and protecting tenants?', true, now())
ON CONFLICT DO NOTHING;

INSERT INTO inform.compass_topics
  (id, topic_key, title, short_title, question_text, is_live, went_live_at)
VALUES
  (gen_random_uuid(), 'local-immigration', 'Local Immigration Enforcement', 'Local Immigration Enforcement',
   'How should your city''s police department relate to federal immigration enforcement?', true, now())
ON CONFLICT DO NOTHING;

INSERT INTO inform.compass_topics
  (id, topic_key, title, short_title, question_text, is_live, went_live_at)
VALUES
  (gen_random_uuid(), 'city-sanitation', 'City Sanitation and Cleanliness', 'City Sanitation and Cleanliness',
   'How should your city approach street cleanliness and sanitation?', true, now())
ON CONFLICT DO NOTHING;

-- ============================================================
-- SECTION 2: compass_stances (50 rows, 5 per topic)
-- ============================================================

-- -------------------------------------------------------
-- Topic: residential-zoning
-- -------------------------------------------------------

INSERT INTO inform.compass_stances
  (topic_id, value, text, description, supporting_points, example_perspectives)
SELECT
  t.id,
  1,
  'Protect existing neighborhood character strictly; require community votes before any rezoning',
  'This stance holds that existing residential neighborhoods have an established character that residents chose when they moved in, and that any change to zoning rules should require direct democratic consent from the affected community. Rezoning decisions are seen as too consequential to be left to council votes or administrative processes alone. Proponents argue that mandatory community votes protect homeowners from externally imposed density changes that could alter traffic, parking, schools, and property values.',
  ARRAY[
    'Neighborhood character and cohesion are built over decades and are difficult to restore once disrupted by rapid density changes.',
    'Requiring community votes ensures that the people most affected by rezoning decisions — existing residents — have direct input and meaningful control over the outcome.',
    'Speculative development pressure can push through rezonings that serve investors rather than existing residents; a vote requirement creates a structural check on that dynamic.'
  ],
  ARRAY[
    'A longtime homeowner who chose their neighborhood specifically for its single-family character may view mandatory rezoning votes as protecting the investment and community they built their life around.',
    'A parent who selected their home based on school capacity and neighborhood walkability may see this stance as preserving the conditions that drew them there.',
    'A resident in an established neighborhood who has watched nearby areas change rapidly may value the certainty and community control this stance provides.'
  ]
FROM inform.compass_topics t
WHERE t.topic_key = 'residential-zoning' AND t.is_live = true
ON CONFLICT (topic_id, value) DO NOTHING;

INSERT INTO inform.compass_stances
  (topic_id, value, text, description, supporting_points, example_perspectives)
SELECT
  t.id,
  2,
  'Allow modest density increases (duplexes, accessory units) with strong design review and neighborhood input',
  'This approach permits incremental increases in housing density — such as duplexes, triplexes, and accessory dwelling units — while keeping a meaningful design review process and structured neighborhood input before approvals. The goal is to allow some additional housing without dramatically altering street-level neighborhood character. Proponents hold that small-scale infill development can add supply and housing options while remaining compatible with surrounding homes when review standards are enforced.',
  ARRAY[
    'Allowing accessory dwelling units and duplexes by right in residential zones adds housing supply gradually without requiring large construction projects that transform entire blocks.',
    'Strong design review ensures that new infill development is compatible in scale and appearance with existing neighborhood character rather than creating jarring contrasts.',
    'Structured neighborhood input gives residents a voice in how modest density is shaped and located without giving any single neighbor an effective veto over reasonable development.'
  ],
  ARRAY[
    'A homeowner who supports gentle growth but wants assurance that new construction will fit the look and feel of their street may find this balance appropriate.',
    'An adult child hoping to build a small backyard unit to house an aging parent may see this stance as enabling practical family housing solutions.',
    'A city council member who hears both housing need and neighborhood concern from constituents may view incremental density with design review as a workable middle path.'
  ]
FROM inform.compass_topics t
WHERE t.topic_key = 'residential-zoning' AND t.is_live = true
ON CONFLICT (topic_id, value) DO NOTHING;

INSERT INTO inform.compass_stances
  (topic_id, value, text, description, supporting_points, example_perspectives)
SELECT
  t.id,
  3,
  'Allow multifamily and mixed-use near commercial corridors while protecting most residential zones',
  'This stance supports allowing denser housing and mixed residential-commercial development along major corridors and transit routes, while keeping most established residential areas at their existing density. The logic is that concentrating growth near commercial activity and transit limits neighborhood disruption while still expanding the overall housing supply in appropriate locations. Proponents believe targeted upzoning along corridors captures the benefits of density where infrastructure already exists to support it.',
  ARRAY[
    'Concentrating multifamily development near commercial corridors and transit stops allows housing supply to grow where services, jobs, and infrastructure are already present.',
    'Preserving most residential zones at existing density respects the expectations of residents who chose their neighborhoods while still addressing the city''s overall housing needs.',
    'Mixed-use zoning along corridors can produce neighborhood-serving retail, restaurants, and services alongside new housing — improving walkability and reducing car dependence in targeted areas.'
  ],
  ARRAY[
    'A renter who wants more affordable housing options near transit may see corridor upzoning as a way to create more units without disturbing quiet residential streets.',
    'A homeowner near a commercial corridor who has accepted that their street is already transitional may find targeted multifamily allowances reasonable given the existing context.',
    'A city planner focused on transit-oriented development may view this approach as the most efficient use of infrastructure investments already made along major routes.'
  ]
FROM inform.compass_topics t
WHERE t.topic_key = 'residential-zoning' AND t.is_live = true
ON CONFLICT (topic_id, value) DO NOTHING;

INSERT INTO inform.compass_stances
  (topic_id, value, text, description, supporting_points, example_perspectives)
SELECT
  t.id,
  4,
  'Upzone broadly to allow multifamily by right; streamline approvals and reduce parking requirements',
  'This stance holds that the city should allow multifamily housing as a permitted use across a wide range of residential zones, remove discretionary approval hurdles, and reduce or eliminate minimum parking requirements that add cost and land consumption to every project. The argument is that the housing shortage is severe enough to require broad zoning changes rather than incremental corridor-by-corridor adjustments. Proponents believe streamlined approvals and reduced parking mandates lower the cost of building new housing and allow supply to respond more quickly to demand.',
  ARRAY[
    'Minimum parking requirements consume land that could house residents and add tens of thousands of dollars per unit in construction cost — reducing or removing them directly lowers rents and purchase prices.',
    'Discretionary approval processes add time, cost, and uncertainty to housing projects; allowing multifamily by right reduces these barriers and enables faster production of needed units.',
    'A broad upzoning distributes new housing across many neighborhoods rather than concentrating density in a few corridors, which reduces the burden on any single area while adding more total supply.'
  ],
  ARRAY[
    'A renter paying a large share of their income in housing costs may see broad upzoning as the most direct path to more housing and lower rents citywide.',
    'A developer of smaller multifamily projects who encounters costly approval delays may view by-right permitting as removing unnecessary friction that does not improve project outcomes.',
    'A young person who cannot find a unit in their desired neighborhood at a price they can afford may view expanded multifamily zoning as the structural change most likely to improve their situation.'
  ]
FROM inform.compass_topics t
WHERE t.topic_key = 'residential-zoning' AND t.is_live = true
ON CONFLICT (topic_id, value) DO NOTHING;

INSERT INTO inform.compass_stances
  (topic_id, value, text, description, supporting_points, example_perspectives)
SELECT
  t.id,
  5,
  'Eliminate single-family-only zoning; allow any housing type on any lot citywide',
  'This stance holds that single-family-only zoning is an exclusionary land use regime that should be abolished entirely, allowing any type of housing — from single-family homes to apartment buildings — to be built on any residential lot in the city. Proponents argue that restricting land to one housing type per lot is the root cause of housing scarcity and affordability problems, and that only a citywide change to land use rules can produce the scale of housing needed. This approach treats all land as equally eligible for housing and lets the market and community needs determine what gets built where.',
  ARRAY[
    'Single-family-only zoning has been a primary mechanism for restricting housing supply in desirable areas for decades; eliminating it addresses the root cause rather than symptoms.',
    'Allowing any housing type on any lot gives landowners maximum flexibility to sell or develop according to the highest and best use, distributing new housing across the entire city rather than concentrating it in limited zones.',
    'Cities that have eliminated single-family-only zoning have seen increased housing production in previously restricted areas without the neighborhood character disruption that opponents predicted.'
  ],
  ARRAY[
    'A housing advocate who views exclusionary zoning as a barrier to equal access to opportunity in desirable neighborhoods may see full elimination as the only approach that achieves genuine openness.',
    'An economist who focuses on supply-side solutions to affordability may view this stance as the most structurally honest response to a shortage driven by artificial land use restrictions.',
    'A newcomer to the city who cannot find affordable housing in neighborhoods with good schools and services may see this stance as removing a structural barrier to access.'
  ]
FROM inform.compass_topics t
WHERE t.topic_key = 'residential-zoning' AND t.is_live = true
ON CONFLICT (topic_id, value) DO NOTHING;

-- -------------------------------------------------------
-- Topic: growth-and-development
-- -------------------------------------------------------

INSERT INTO inform.compass_stances
  (topic_id, value, text, description, supporting_points, example_perspectives)
SELECT
  t.id,
  1,
  'Impose growth limits; require voter approval for major annexations or large-scale developments',
  'This stance holds that unchecked population growth strains infrastructure, erodes quality of life, and fundamentally alters the character of a city in ways that existing residents cannot reverse once they occur. Requiring voter approval for major annexations and large-scale developments is seen as a democratic safeguard that ensures growth happens only when the community affirmatively chooses it. Proponents argue that growth has costs — in traffic, schools, water, and public services — that must be weighed against benefits before commitments are made.',
  ARRAY[
    'Infrastructure systems — roads, water, sewer, and schools — have finite capacity, and approving large developments before capacity is in place creates chronic service deficits that are expensive and slow to fix.',
    'Voter approval requirements ensure that the full community bears input on growth decisions whose consequences — taxes, congestion, character change — are shared by all residents.',
    'Establishing growth limits gives the city time to plan thoughtfully rather than reacting to development pressure, producing better long-term outcomes than approval-by-approval decision-making.'
  ],
  ARRAY[
    'A longtime resident in a city that has grown faster than its roads and schools can handle may see growth limits as protecting a quality of life that drew them there in the first place.',
    'A property taxpayer who has seen service quality decline as population surged ahead of infrastructure investment may view voter-controlled growth as a fiscal responsibility mechanism.',
    'A parent frustrated by school overcrowding in a fast-growing city may see mandatory voter approval for large developments as a check on the pace of change.'
  ]
FROM inform.compass_topics t
WHERE t.topic_key = 'growth-and-development' AND t.is_live = true
ON CONFLICT (topic_id, value) DO NOTHING;

INSERT INTO inform.compass_stances
  (topic_id, value, text, description, supporting_points, example_perspectives)
SELECT
  t.id,
  2,
  'Allow growth only where existing infrastructure can support it; slow approvals until capacity catches up',
  'This approach conditions development approvals on demonstrated infrastructure capacity — roads, utilities, schools, and emergency services — and slows or pauses new approvals in areas where that capacity is already strained. The goal is to ensure that new residents are added only where the city can actually serve them at an acceptable standard. Proponents hold that approving development ahead of infrastructure creates service deficits that ultimately require more expensive remediation than if growth had been paced appropriately.',
  ARRAY[
    'Tying approvals to infrastructure capacity prevents the city from making commitments to new residents that it cannot fulfill, protecting both new and existing residents from service degradation.',
    'Pausing approvals in overloaded areas creates a practical incentive for developers to build in parts of the city where infrastructure headroom exists, distributing growth more efficiently.',
    'An infrastructure-first growth policy is more fiscally responsible than approving development and then scrambling to fund the roads, schools, and utilities needed to support it.'
  ],
  ARRAY[
    'A resident near a congested arterial road who watches new subdivisions approved before road improvements are funded may see infrastructure-conditional approvals as common sense governance.',
    'A school administrator managing overcrowded classrooms in a fast-growing district may view development pauses as the only way to allow capital programs to catch up.',
    'A city finance director who has seen long-term fiscal stress created by growth commitments exceeding revenue may view capacity-based approvals as protecting the city''s financial health.'
  ]
FROM inform.compass_topics t
WHERE t.topic_key = 'growth-and-development' AND t.is_live = true
ON CONFLICT (topic_id, value) DO NOTHING;

INSERT INTO inform.compass_stances
  (topic_id, value, text, description, supporting_points, example_perspectives)
SELECT
  t.id,
  3,
  'Plan proactively — invest in infrastructure ahead of growth to support responsible expansion',
  'This stance holds that the city should actively plan for and invest in the infrastructure needed to accommodate future growth, rather than waiting for deficits to emerge or blocking development until capacity materializes on its own. Proactive capital investment in roads, utilities, schools, and parks is seen as enabling sustainable expansion that benefits both existing and new residents. Proponents argue that cities that plan ahead attract higher-quality development, maintain service standards, and avoid the reactive scramble that characterizes cities that grow without a plan.',
  ARRAY[
    'Proactive infrastructure investment allows the city to shape where and how growth occurs rather than reacting to development applications one at a time without a coherent plan.',
    'Investing in infrastructure ahead of growth leverages the city''s ability to direct development toward areas that are most cost-efficient to serve, reducing per-capita infrastructure costs over time.',
    'A city that demonstrates it can manage growth well becomes more attractive to the kinds of employers and residents who generate long-term tax base and community investment.'
  ],
  ARRAY[
    'A city council member who wants to attract employers and housing without sacrificing service quality may see proactive infrastructure investment as the governance approach that makes both possible.',
    'A newcomer who moved to a growing city for opportunity and expects adequate roads, schools, and parks may view forward infrastructure planning as a basic commitment the city owes to all residents.',
    'A developer who has built in cities with strong capital plans may see proactive infrastructure investment as reducing project risk and enabling faster, higher-quality development.'
  ]
FROM inform.compass_topics t
WHERE t.topic_key = 'growth-and-development' AND t.is_live = true
ON CONFLICT (topic_id, value) DO NOTHING;

INSERT INTO inform.compass_stances
  (topic_id, value, text, description, supporting_points, example_perspectives)
SELECT
  t.id,
  4,
  'Streamline permitting, reduce fees, and actively recruit development to grow the city''s tax base',
  'This stance holds that the city should actively work to attract development by removing bureaucratic friction from the permitting process, reducing or waiving fees that make projects less financially viable, and proactively recruiting builders and businesses. The underlying logic is that a growing tax base reduces the per-resident cost of city services and expands the pool of resources available for infrastructure and amenities. Proponents argue that cities competing for development must make the approval process as fast and predictable as possible.',
  ARRAY[
    'A larger tax base distributes the cost of city services across more residents and businesses, reducing the burden on existing property owners and enabling investment in amenities.',
    'Fast, predictable permitting is a competitive advantage: developers choose cities where approvals are reliable over those where projects face uncertain delays and mounting carrying costs.',
    'Actively recruiting employers and housing development creates jobs, housing options, and retail activity that benefit all residents — not just the developers who build the projects.'
  ],
  ARRAY[
    'A small business owner who has experienced months of permitting delays for a simple renovation may see streamlined approvals as removing unnecessary barriers to legitimate commercial activity.',
    'A city finance director watching neighboring cities capture large commercial projects may see fee reductions and recruitment as necessary to remain competitive for tax base growth.',
    'A renter hoping for more housing supply and job opportunities may see development-friendly policies as likely to produce more units and employers in the city over time.'
  ]
FROM inform.compass_topics t
WHERE t.topic_key = 'growth-and-development' AND t.is_live = true
ON CONFLICT (topic_id, value) DO NOTHING;

INSERT INTO inform.compass_stances
  (topic_id, value, text, description, supporting_points, example_perspectives)
SELECT
  t.id,
  5,
  'Remove regulatory barriers to development entirely; let market demand determine growth pace',
  'This stance holds that government-imposed regulations — zoning restrictions, development fees, lengthy approval processes, and design mandates — are the primary obstacle to adequate housing and commercial development, and that removing these barriers would allow supply to respond naturally to demand. The city''s role should be limited to basic health and safety standards; beyond that, market forces should determine what gets built, where, and at what pace. Proponents argue that regulatory overhead inflates costs and slows supply responses, causing the housing and development shortages that planning tries but fails to solve.',
  ARRAY[
    'The cost of regulatory compliance — fees, delays, design requirements, and approval uncertainty — is ultimately passed to housing consumers; reducing this overhead lowers the floor price of new housing.',
    'Market signals are faster and more accurate than planning processes at identifying where and what kind of development is needed; regulatory barriers consistently misalign supply with actual demand.',
    'Cities with minimal regulatory barriers have historically produced more housing per capita and maintained lower relative housing costs than those with extensive regulatory frameworks.'
  ],
  ARRAY[
    'A landowner who wants to develop property but faces years of approval processes and substantial fees may see deregulation as removing obstacles that serve administrative rather than genuine public safety purposes.',
    'An economist who studies regulatory barriers to housing production may view this stance as addressing the structural cause of housing scarcity rather than its symptoms.',
    'A family priced out of housing in a high-cost city who attributes the shortage to regulatory constraints may see barrier removal as the only approach likely to produce the scale of supply needed.'
  ]
FROM inform.compass_topics t
WHERE t.topic_key = 'growth-and-development' AND t.is_live = true
ON CONFLICT (topic_id, value) DO NOTHING;

-- -------------------------------------------------------
-- Topic: public-safety-approach
-- -------------------------------------------------------

INSERT INTO inform.compass_stances
  (topic_id, value, text, description, supporting_points, example_perspectives)
SELECT
  t.id,
  1,
  'Redirect a significant portion of the police budget to social services, mental health, and community programs',
  'This stance holds that a significant share of funding currently directed to law enforcement would produce better public safety outcomes if redirected to social services, mental health care, addiction treatment, and community-based programs that address the root causes of crime and disorder. Proponents argue that many calls currently handled by armed officers — including mental health crises, substance abuse incidents, and neighbor disputes — are better addressed by trained civilian responders at lower cost and with better outcomes. This approach redefines public safety as a broader public health function rather than primarily a law enforcement function.',
  ARRAY[
    'A substantial portion of calls for police service involve mental health crises or social needs that armed officers are not trained to address; redirecting those responses to trained civilian professionals produces better outcomes.',
    'Investment in community programs, youth services, and mental health access reduces the conditions that produce crime and disorder over time, addressing causes rather than only responding to effects.',
    'Redirecting a portion of the police budget does not reduce public safety if the reallocation funds interventions that demonstrably lower crisis calls and crime rates in the communities receiving them.'
  ],
  ARRAY[
    'A community member who has watched police response to a loved one''s mental health crisis escalate rather than de-escalate may see civilian-led crisis response as a safer and more effective alternative.',
    'A social worker who regularly responds to situations first handled by police may see this stance as routing people to the professional services they actually need.',
    'A resident in a neighborhood with high service demand but historically poor police-community relations may view reinvestment in community programs as a more trusted and effective safety strategy.'
  ]
FROM inform.compass_topics t
WHERE t.topic_key = 'public-safety-approach' AND t.is_live = true
ON CONFLICT (topic_id, value) DO NOTHING;

INSERT INTO inform.compass_stances
  (topic_id, value, text, description, supporting_points, example_perspectives)
SELECT
  t.id,
  2,
  'Maintain current police staffing but shift non-violent calls to unarmed mental health co-responders',
  'This approach maintains the current size of the police force while adding a parallel system of unarmed mental health co-responders who handle calls involving psychiatric crises, substance use, and other non-violent situations where an armed officer''s presence may not be appropriate. The goal is to deploy the right professional for each type of call rather than routing everything through law enforcement. Proponents hold that adding a co-response capacity improves outcomes for people in crisis without reducing the availability of officers for calls where their presence and authority are genuinely needed.',
  ARRAY[
    'Co-responder models that pair mental health professionals with officers — or deploy them independently for qualifying calls — have reduced use-of-force incidents and improved outcomes in documented pilot programs.',
    'Maintaining current police staffing ensures that response capacity for violent crime and emergencies is not reduced while a new co-response capacity is being built out.',
    'Shifting non-violent crisis calls to mental health professionals reduces the workload on officers, allowing them to focus on situations that require their specific training and authority.'
  ],
  ARRAY[
    'A police officer who feels undertrained for mental health calls may view co-responders as welcome partners who handle situations better suited to their expertise.',
    'A mental health professional who has worked alongside law enforcement may see co-response as getting the right professional to the right call, producing better outcomes for everyone involved.',
    'A family member of someone with a serious mental illness who has called 911 during a crisis may value a response option that does not begin with an armed officer arriving alone.'
  ]
FROM inform.compass_topics t
WHERE t.topic_key = 'public-safety-approach' AND t.is_live = true
ON CONFLICT (topic_id, value) DO NOTHING;

INSERT INTO inform.compass_stances
  (topic_id, value, text, description, supporting_points, example_perspectives)
SELECT
  t.id,
  3,
  'Keep current public safety funding while adding crisis response teams for mental health and addiction calls',
  'This stance supports maintaining the existing public safety budget at current levels while adding dedicated crisis response teams — staffed by social workers, paramedics, or mental health clinicians — to handle calls involving mental health emergencies and addiction. The approach treats the police budget and the crisis response budget as separate line items, each growing on its own merits rather than one coming at the expense of the other. Proponents hold that expanding the response toolkit without reducing any existing capacity is the most broadly acceptable path to improving public safety outcomes.',
  ARRAY[
    'Adding crisis response capacity alongside existing law enforcement avoids the political and operational disruption of reallocating an existing budget, making implementation faster and more durable.',
    'Mental health and addiction crises represent a significant share of 911 call volume in most cities; a dedicated response team improves the quality of those responses without affecting police deployment for other calls.',
    'Funding both traditional law enforcement and specialized crisis response recognizes that public safety requires multiple disciplines and that the two approaches address different situations.'
  ],
  ARRAY[
    'A city council member representing diverse constituents with different public safety priorities may see parallel investment as the approach most likely to build and hold broad community support.',
    'A paramedic who has responded to mental health calls without adequate behavioral health backup may see dedicated crisis teams as filling a genuine gap in the emergency response system.',
    'A voter who wants both effective policing and better crisis response but is skeptical of reallocation may see new funding for crisis teams as a more acceptable path to the same goal.'
  ]
FROM inform.compass_topics t
WHERE t.topic_key = 'public-safety-approach' AND t.is_live = true
ON CONFLICT (topic_id, value) DO NOTHING;

INSERT INTO inform.compass_stances
  (topic_id, value, text, description, supporting_points, example_perspectives)
SELECT
  t.id,
  4,
  'Increase police staffing, equipment, and pay to improve response times and deter crime',
  'This stance holds that improving public safety primarily requires a well-staffed, well-equipped, and well-compensated police force capable of responding quickly to calls and maintaining visible deterrence. Proponents argue that response time is a meaningful determinant of outcomes for crimes in progress, and that understaffed departments with poor pay structures lose officers to better-paying jurisdictions, leaving coverage gaps. Investing in the police as a core municipal function is seen as the most direct path to measurable improvements in public safety.',
  ARRAY[
    'Police staffing levels and response times are measurable and directly correlated with outcomes for time-sensitive incidents; investment in staffing produces faster, more reliable service.',
    'Competitive pay is necessary to recruit and retain qualified officers; departments that cannot offer competitive compensation lose experienced personnel to neighboring jurisdictions, compounding staffing shortages.',
    'Visible police presence and adequate patrol coverage have deterrence value that reduces the number of crimes attempted, complementing enforcement of crimes after the fact.'
  ],
  ARRAY[
    'A business owner who has experienced property crime and slow response times may see increased police staffing as the most direct improvement to the conditions their business depends on.',
    'A resident who has lived through a period of high crime and experienced the impact of inadequate police coverage may view staffing increases as restoring a fundamental city service.',
    'A property owner who pays taxes that fund city services may view competitive police compensation as a basic obligation of the city to retain the professionals delivering a core service.'
  ]
FROM inform.compass_topics t
WHERE t.topic_key = 'public-safety-approach' AND t.is_live = true
ON CONFLICT (topic_id, value) DO NOTHING;

INSERT INTO inform.compass_stances
  (topic_id, value, text, description, supporting_points, example_perspectives)
SELECT
  t.id,
  5,
  'Make expanding the police budget the top city spending priority over other municipal services',
  'This stance holds that public safety is the foundational municipal service and should receive priority funding ahead of parks, libraries, planning, and other city departments when budget tradeoffs must be made. Proponents argue that a city that cannot ensure public safety cannot effectively deliver any other service, and that residents and businesses will not remain in or invest in a city where they do not feel safe. Maximizing investment in law enforcement is seen as the precondition for a functioning city.',
  ARRAY[
    'Public safety is the baseline on which all other city services depend; residents who do not feel safe will not use parks, support local businesses, or invest in the community regardless of what other services exist.',
    'Prioritizing the police budget sends a clear signal to both residents and businesses that the city takes its most fundamental obligation seriously, which supports property values and economic stability.',
    'Fully funding law enforcement at the highest viable level reduces the crime and disorder that imposes the greatest costs on residents and businesses, producing downstream fiscal benefits that offset the budget priority.'
  ],
  ARRAY[
    'A small business owner in an area experiencing persistent property crime and slow police response may view maximum police funding as the city action most directly affecting their ability to operate.',
    'A resident who has moved to the city specifically because of its reputation for public safety may see maintaining that priority in the budget as protecting what they value most about the community.',
    'A homeowner concerned about property values may view robust public safety investment as the single city expenditure most directly correlated with neighborhood desirability and market value.'
  ]
FROM inform.compass_topics t
WHERE t.topic_key = 'public-safety-approach' AND t.is_live = true
ON CONFLICT (topic_id, value) DO NOTHING;

-- -------------------------------------------------------
-- Topic: homelessness-response
-- -------------------------------------------------------

INSERT INTO inform.compass_stances
  (topic_id, value, text, description, supporting_points, example_perspectives)
SELECT
  t.id,
  1,
  'Housing-first: provide permanent supportive housing with no preconditions; avoid criminalization entirely',
  'This stance holds that people experiencing homelessness must first be housed — without preconditions around sobriety, mental health treatment participation, or employment — before other stabilizing interventions can be effective. Criminalizing homelessness through anti-camping ordinances or trespassing enforcement is seen as counterproductive, cycling people through the criminal justice system without addressing their underlying situation. Proponents argue that stable housing is the platform from which people can address addiction, mental health, and employment challenges, and that no preconditions model has demonstrated better long-term outcomes in rigorous studies.',
  ARRAY[
    'Evidence from housing-first programs shows that people who are housed first, with no preconditions, achieve longer-term stability than those required to complete treatment before receiving housing.',
    'Criminalizing homelessness — through anti-camping citations, fines, or arrests — does not reduce homelessness; it creates criminal records that make it harder for people to secure housing and employment.',
    'Providing permanent supportive housing avoids the revolving door of temporary shelter, emergency room use, and jail stays that cost cities more per person than stable housing with wraparound services.'
  ],
  ARRAY[
    'A social worker who has observed people stabilize once housed — and seen treatment succeed only after housing was secured — may view the housing-first sequence as the approach the evidence supports.',
    'An advocate for people experiencing homelessness who has seen criminalization cycles firsthand may view enforcement-free housing access as the only approach that treats people with genuine dignity.',
    'A public health professional who tracks emergency room and jail utilization linked to homelessness may view housing-first as cost-effective as well as humane, reducing other systems'' burdens.'
  ]
FROM inform.compass_topics t
WHERE t.topic_key = 'homelessness-response' AND t.is_live = true
ON CONFLICT (topic_id, value) DO NOTHING;

INSERT INTO inform.compass_stances
  (topic_id, value, text, description, supporting_points, example_perspectives)
SELECT
  t.id,
  2,
  'Expand shelter capacity and services as the primary strategy; use enforcement only after services are offered',
  'This approach prioritizes building sufficient shelter capacity and connecting people experiencing homelessness to services — mental health care, addiction treatment, and case management — as the primary city strategy. Enforcement of camping or trespass rules is used only as a last resort after outreach workers have made a genuine offer of shelter and services, giving people an actual alternative before any citation or removal occurs. Proponents hold that enforcement without a prior service offer is both ineffective and inhumane, but that enforcement may be appropriate when services have been offered and declined.',
  ARRAY[
    'A shelter-first approach ensures the city has something to offer people before asking them to leave a location; enforcement without alternatives simply moves the problem rather than addressing it.',
    'Building adequate shelter capacity is the prerequisite for any enforcement policy to be ethically defensible — people cannot be expected to accept shelter that does not exist.',
    'Combining genuine service offers with enforcement after refusal allows the city to maintain some public order while treating people in crisis with the dignity of a real alternative.'
  ],
  ARRAY[
    'A resident near an encampment who wants the city to address the situation but also wants people to have real options before enforcement may find this sequenced approach reasonable.',
    'An outreach worker who has struggled to connect clients to services because of inadequate capacity may see shelter expansion as removing the barrier that makes their work most difficult.',
    'A business owner near a shelter who supports services but also wants the surrounding area managed well may view this approach as addressing both the humanitarian and neighborhood maintenance dimensions.'
  ]
FROM inform.compass_topics t
WHERE t.topic_key = 'homelessness-response' AND t.is_live = true
ON CONFLICT (topic_id, value) DO NOTHING;

INSERT INTO inform.compass_stances
  (topic_id, value, text, description, supporting_points, example_perspectives)
SELECT
  t.id,
  3,
  'Invest in outreach, shelter, and mental health services while enforcing reasonable public space rules',
  'This stance supports sustained investment in homeless outreach, shelter beds, and mental health and addiction services as the foundation of the city''s response, paired with enforcement of reasonable and consistently applied public space rules. The position holds that both service investment and clear behavioral standards are necessary: services without any standards create unsustainable conditions in shared public spaces, while enforcement without services is inhumane and ineffective. Proponents believe a balanced approach that invests meaningfully and enforces fairly is more durable than either extreme.',
  ARRAY[
    'Investment in outreach, shelter, and mental health services addresses the conditions driving homelessness while giving enforcement policies a humane foundation — people have real options when rules are applied.',
    'Reasonable and consistently applied public space rules protect the shared spaces that all residents depend on while remaining compatible with an active service response for those who need help.',
    'A balanced approach that visibly invests in services and maintains visible standards builds broader community support for the city''s homelessness response than approaches seen as exclusively punitive or exclusively permissive.'
  ],
  ARRAY[
    'A park user who wants both accessible, clean public spaces and humane treatment of people experiencing homelessness may see this balanced approach as addressing both concerns without sacrificing either.',
    'A city official who must respond to both service providers and business improvement districts may view this stance as the approach most likely to hold political support across constituencies with different priorities.',
    'A faith community leader who runs a shelter and also supports neighborhood well-being may find this stance aligned with both their humanitarian commitments and their community responsibilities.'
  ]
FROM inform.compass_topics t
WHERE t.topic_key = 'homelessness-response' AND t.is_live = true
ON CONFLICT (topic_id, value) DO NOTHING;

INSERT INTO inform.compass_stances
  (topic_id, value, text, description, supporting_points, example_perspectives)
SELECT
  t.id,
  4,
  'Enforce anti-camping ordinances as the primary tool while maintaining basic outreach programs',
  'This stance holds that consistent enforcement of anti-camping ordinances is the most effective mechanism for managing homelessness in public spaces, while basic outreach programs are maintained as a support option for those who seek them. The position treats visible encampments as a public safety and public health problem that enforcement can meaningfully address, and holds that cities that consistently enforce their ordinances see cleaner public spaces and reduced unsheltered homelessness compared to those that do not. Outreach programs are available but not a prerequisite for enforcement.',
  ARRAY[
    'Consistent enforcement of anti-camping ordinances produces demonstrably cleaner and safer public spaces than permissive approaches, which signals to all residents that public spaces are maintained and safe.',
    'Visible encampments attract additional encampments and create cumulative public health and safety risks; early enforcement prevents the concentration effects that make large encampments much harder to address.',
    'Enforcement-first approaches give the city a consistent, manageable response to encampments without the unpredictable scale and cost demands of open-ended service commitments as a precondition.'
  ],
  ARRAY[
    'A business owner who has seen customers avoid their block because of encampments near the entrance may view consistent enforcement as the city action most directly affecting their business conditions.',
    'A parent who takes young children to public parks and playgrounds may view anti-camping enforcement as protecting the safe, accessible use of shared spaces their family depends on.',
    'A resident who has reported encampments to the city and experienced prolonged inaction may view consistent enforcement as restoring confidence that the city can maintain its basic obligations.'
  ]
FROM inform.compass_topics t
WHERE t.topic_key = 'homelessness-response' AND t.is_live = true
ON CONFLICT (topic_id, value) DO NOTHING;

INSERT INTO inform.compass_stances
  (topic_id, value, text, description, supporting_points, example_perspectives)
SELECT
  t.id,
  5,
  'Prioritize strict enforcement of trespassing and camping bans; minimize city spending on homeless services',
  'This stance holds that the city''s primary responsibility is maintaining public order and protecting property rights, and that strict enforcement of trespassing and camping prohibitions — with minimal expenditure on city-funded homeless services — is the most appropriate response. Proponents argue that generous city services attract people experiencing homelessness from other jurisdictions, increasing demand in ways that are fiscally unsustainable, and that enforcement without significant service investment is the only approach that does not create perverse incentives. The position treats homelessness primarily as a law enforcement and property rights issue rather than a social services delivery challenge.',
  ARRAY[
    'Minimizing city-funded services reduces the incentive for people experiencing homelessness to concentrate in cities that offer the most generous benefit packages, distributing the challenge more broadly across regions.',
    'Strict enforcement of trespassing and camping prohibitions protects the property rights and physical space of businesses and residents who have legitimate claims to public and private areas.',
    'Cities that have reduced city-funded services and increased enforcement have, in some cases, seen decreases in the visible unsheltered population in their jurisdiction, regardless of where those individuals ultimately went.'
  ],
  ARRAY[
    'A property owner whose land has been repeatedly used as an unofficial campsite may view strict trespass enforcement as a basic protection of their property rights that the city is obligated to provide.',
    'A taxpayer concerned about the fiscal sustainability of growing homeless service budgets may view service minimization as a responsible stewardship of public funds.',
    'A resident in a neighborhood that has absorbed a disproportionate share of service facilities and encampments may view stricter enforcement as correcting what they see as an unequal distribution of public space burdens.'
  ]
FROM inform.compass_topics t
WHERE t.topic_key = 'homelessness-response' AND t.is_live = true
ON CONFLICT (topic_id, value) DO NOTHING;

-- -------------------------------------------------------
-- Topic: economic-development
-- -------------------------------------------------------

INSERT INTO inform.compass_stances
  (topic_id, value, text, description, supporting_points, example_perspectives)
SELECT
  t.id,
  1,
  'No corporate tax incentives; invest in public services and infrastructure to attract business organically',
  'This stance holds that the city should not offer tax abatements, grants, or other financial incentives to attract specific companies, and instead should focus its economic development spending on public services, infrastructure, workforce quality, and quality of life amenities that make the city an attractive place for businesses of all kinds to locate and grow organically. Proponents argue that targeted corporate incentives transfer wealth from taxpayers to specific companies, distort competition, and rarely produce net economic gains when properly accounted for over the full incentive period.',
  ARRAY[
    'Independent analyses of corporate tax incentive programs consistently find that most would have located in the jurisdiction anyway, making incentive payments a transfer from taxpayers to companies for decisions they would have made regardless.',
    'Investing in public services, infrastructure, and workforce development improves conditions for all businesses rather than advantaging specific recipients, producing broader and more durable economic benefits.',
    'Tax incentives for large corporations create competitive disadvantages for existing local businesses that did not receive incentives, effectively subsidizing outside competition against established community businesses.'
  ],
  ARRAY[
    'A local small business owner who has operated in the city for years without tax breaks may view corporate incentive packages as subsidizing their competition while they pay full taxes.',
    'A fiscal accountability advocate who has reviewed incentive program post-audits may see the consistent finding that most incentivized companies would have located there anyway as a compelling case against the practice.',
    'A voter concerned about public school and road funding may see corporate incentive packages that reduce tax revenue as prioritizing out-of-town companies over existing community needs.'
  ]
FROM inform.compass_topics t
WHERE t.topic_key = 'economic-development' AND t.is_live = true
ON CONFLICT (topic_id, value) DO NOTHING;

INSERT INTO inform.compass_stances
  (topic_id, value, text, description, supporting_points, example_perspectives)
SELECT
  t.id,
  2,
  'Small business support and local entrepreneur programs only; avoid large corporate subsidies',
  'This approach directs the city''s economic development resources toward small business support programs — technical assistance, small loan funds, business incubators, and local entrepreneur networks — while avoiding large corporate tax abatements or incentive packages for major employers. The position holds that small and locally-owned businesses create more durable local wealth, are less likely to relocate for a better incentive package elsewhere, and benefit the community in ways that large corporate employers often do not. Proponents argue that cultivating a strong local business ecosystem produces better long-term economic outcomes than competing for large employers.',
  ARRAY[
    'Small and locally-owned businesses recirculate a higher share of their revenue within the local economy compared to national chains, producing greater multiplier effects from each dollar of economic activity.',
    'Local businesses are embedded in the community and far less likely to relocate to a different city or country for a better incentive package, providing more stable employment and tax base over time.',
    'Small business support programs serve many businesses simultaneously, distributing economic development benefits broadly rather than concentrating them in a single large employer whose departure would have outsized impact.'
  ],
  ARRAY[
    'An entrepreneur who built a local business without public subsidy may view programs that help the next generation of local business owners as a fair use of economic development resources.',
    'A resident who prefers to shop at locally-owned businesses and values the community identity they provide may see small business programs as investing in what makes their city distinctive.',
    'An economic development professional who has tracked the long-term outcomes of large employer relocations — including subsequent departures — may see local business cultivation as producing more durable results.'
  ]
FROM inform.compass_topics t
WHERE t.topic_key = 'economic-development' AND t.is_live = true
ON CONFLICT (topic_id, value) DO NOTHING;

INSERT INTO inform.compass_stances
  (topic_id, value, text, description, supporting_points, example_perspectives)
SELECT
  t.id,
  3,
  'Targeted incentives for specific industries with community benefit agreements and job quality requirements',
  'This stance supports the selective use of economic development incentives to attract employers in targeted industries, paired with community benefit agreements that bind recipients to job quality standards — minimum wages, local hiring requirements, affordable housing contributions, and workforce training commitments. The position holds that incentives can be justified when they are conditioned on genuine community benefits, limited in scope, and subject to clawback provisions if commitments are not met. Proponents argue that this approach captures the value of strategic development while protecting against the most common pitfalls of unconditional corporate subsidies.',
  ARRAY[
    'Community benefit agreements with binding job quality requirements transform incentives from unconditional subsidies into conditional investments that only pay out when the city receives measurable returns.',
    'Targeting incentives at specific industries — such as clean energy, advanced manufacturing, or healthcare — allows the city to shape its economic mix rather than simply reacting to whatever companies approach it.',
    'Clawback provisions that require recipients to return incentive value if job or investment commitments are not met align the interests of the company with the commitments it made, reducing the risk of incentives without accountability.'
  ],
  ARRAY[
    'A workforce development professional who has seen large employers provide good training pipelines and local hiring commitments may value incentives conditioned on those outcomes as producing real community benefits.',
    'A housing advocate who has negotiated community benefit agreements may see them as a mechanism to extract affordable housing contributions from development activity that would otherwise generate no direct housing benefit.',
    'An economic development director who has both experienced the failure of unconditional incentive programs and the success of well-designed ones may view the conditionality framework as the key variable.'
  ]
FROM inform.compass_topics t
WHERE t.topic_key = 'economic-development' AND t.is_live = true
ON CONFLICT (topic_id, value) DO NOTHING;

INSERT INTO inform.compass_stances
  (topic_id, value, text, description, supporting_points, example_perspectives)
SELECT
  t.id,
  4,
  'Compete actively for major employers with significant tax abatements and infrastructure investment',
  'This stance holds that attracting major employers requires the city to compete actively through significant tax abatements, dedicated infrastructure investment, and streamlined permitting, even when the short-term fiscal cost is substantial. The argument is that major employers bring jobs, housing demand, supply chain activity, and population growth that generates long-term tax revenue exceeding the upfront incentive cost — but only if the city secures the employer in the first place. Proponents argue that cities that refuse to compete for major employers cede those opportunities to rival jurisdictions.',
  ARRAY[
    'A single major employer can create thousands of direct jobs and multiples more indirect jobs through supply chain and service activity, generating tax revenue and population growth that transforms a city''s fiscal position over a decade.',
    'The competitive reality is that major employers evaluate multiple jurisdictions simultaneously and respond to incentive packages; cities unwilling to compete will not win these opportunities regardless of other advantages.',
    'Infrastructure investments made to attract a major employer — road improvements, utility upgrades, transit extensions — typically have value to the community beyond the single employer and remain after any incentive period ends.'
  ],
  ARRAY[
    'A mayor of a city with stagnant employment and population who sees a major employer relocation as potentially transformational may view aggressive incentives as a justifiable bet on the city''s future.',
    'A construction worker or contractor who expects to benefit from the physical development a major employer generates may view incentive packages as an investment in local employment activity.',
    'A local business owner who expects major employer employees to patronize nearby shops and restaurants may view the long-term traffic and spending generated as justifying the upfront public investment.'
  ]
FROM inform.compass_topics t
WHERE t.topic_key = 'economic-development' AND t.is_live = true
ON CONFLICT (topic_id, value) DO NOTHING;

INSERT INTO inform.compass_stances
  (topic_id, value, text, description, supporting_points, example_perspectives)
SELECT
  t.id,
  5,
  'Offer maximum incentives to attract any large employer; economic growth is the top city priority',
  'This stance holds that economic growth — measured in jobs, population, and tax base — is the city''s overriding priority, and that the city should offer the most generous incentive packages available to attract any large employer regardless of the specific industry or job quality profile. Proponents argue that growth itself is the precondition for addressing other city needs, and that a city focused on conditions or requirements will lose competitive bids to more accommodating jurisdictions. Maximum incentives with minimal restrictions are seen as the approach most likely to produce the employment and tax base growth the city needs.',
  ARRAY[
    'A growing tax base from a large employer ultimately provides revenue for the schools, parks, roads, and services that residents value — without growth, those investments must be funded from existing residents alone.',
    'Attaching conditions to incentives increases the complexity of negotiations and the risk of losing competitive bids; offering maximum incentives with minimal friction maximizes the city''s competitiveness.',
    'Job creation at any wage level and in any industry generates economic activity, supply chain demand, and population growth that supports local businesses and services across the city.'
  ],
  ARRAY[
    'A city official in a community with persistent unemployment and stagnant growth may view any large employer as a catalyst that justifies maximum public investment to secure.',
    'A real estate developer who anticipates significant demand from a large employer''s workforce may view maximum incentives as an investment with compounding returns through new residential and commercial development.',
    'A resident in a city that has watched neighboring communities attract major employers may view maximum-incentive competitiveness as a necessary response to ensure their city is not left behind.'
  ]
FROM inform.compass_topics t
WHERE t.topic_key = 'economic-development' AND t.is_live = true
ON CONFLICT (topic_id, value) DO NOTHING;

-- -------------------------------------------------------
-- Topic: transportation-priorities
-- -------------------------------------------------------

INSERT INTO inform.compass_stances
  (topic_id, value, text, description, supporting_points, example_perspectives)
SELECT
  t.id,
  1,
  'Prioritize pedestrian infrastructure, cycling networks, and public transit; reduce parking requirements citywide',
  'This stance holds that the city should shift its transportation investment decisively toward pedestrian facilities, protected cycling networks, and public transit, while simultaneously reducing or eliminating minimum parking requirements that dedicate land and construction cost to car storage. The underlying position is that auto-centric transportation policy produces traffic congestion, air quality problems, and car-dependence that makes the city less livable for those who cannot or choose not to drive. Proponents argue that investing in alternative modes and removing parking mandates allows the market to determine how much parking is actually needed.',
  ARRAY[
    'Minimum parking requirements are a government mandate that increases the cost of every development, dedicates land to car storage instead of housing or commercial use, and induces driving by ensuring abundant free parking wherever one travels.',
    'Protected cycling infrastructure and high-quality pedestrian facilities reduce car trips for short-distance travel, improving traffic flow for those who continue to drive while expanding mobility options for those who cannot.',
    'Cities that have invested heavily in transit, cycling, and pedestrian infrastructure have documented reductions in per-capita vehicle miles traveled, traffic congestion, and transportation-related emissions.'
  ],
  ARRAY[
    'A daily transit rider who depends on bus or rail to reach work and services may view transit investment as the single city action most directly affecting their ability to get around efficiently and affordably.',
    'A cyclist who commutes by bike but finds routes interrupted by lack of protected infrastructure may see citywide cycling network investment as enabling safe, practical cycling for a much larger share of residents.',
    'A parent who wants their children to be able to walk or bike to school safely may view pedestrian and cycling infrastructure investment as a public safety and quality-of-life priority for families.'
  ]
FROM inform.compass_topics t
WHERE t.topic_key = 'transportation-priorities' AND t.is_live = true
ON CONFLICT (topic_id, value) DO NOTHING;

INSERT INTO inform.compass_stances
  (topic_id, value, text, description, supporting_points, example_perspectives)
SELECT
  t.id,
  2,
  'Invest equally in roads and multimodal options; require bike lanes and sidewalks on all new road projects',
  'This approach distributes transportation investment between road maintenance and capacity and multimodal infrastructure — requiring that all new road construction and major reconstruction projects include bike lanes, sidewalks, and transit accommodations as standard elements rather than optional add-ons. The position holds that all transportation modes have legitimate users and that new road projects should serve all of them rather than defaulting to cars only. Proponents argue that requiring multimodal features on new projects is more cost-effective than retrofitting them later.',
  ARRAY[
    'Including bike lanes and sidewalks in new road projects costs far less than retrofitting them later — designing for multiple modes from the start is the most fiscally efficient approach to complete streets.',
    'Equal investment across transportation modes reflects the actual diversity of how residents travel: not all residents drive, and many who do also walk, cycle, or use transit for some trips.',
    'Requiring multimodal features on all new road projects ensures that the city''s street network gradually becomes more complete without requiring a separate capital program to achieve what should be standard infrastructure.'
  ],
  ARRAY[
    'A cyclist who accepts that cars are part of the transportation mix but wants to be physically separated from high-speed traffic may view multimodal standards on all new roads as a reasonable and achievable baseline.',
    'A parent who drives but also walks with young children may value sidewalks and safe crosswalks as basic infrastructure that new road projects should always include as a matter of course.',
    'A city engineer who has seen the cost of retrofitting bike lanes into roads built without them may view multimodal requirements on new construction as the cost-effective path to a complete network over time.'
  ]
FROM inform.compass_topics t
WHERE t.topic_key = 'transportation-priorities' AND t.is_live = true
ON CONFLICT (topic_id, value) DO NOTHING;

INSERT INTO inform.compass_stances
  (topic_id, value, text, description, supporting_points, example_perspectives)
SELECT
  t.id,
  3,
  'Maintain roads while selectively adding transit connections and pedestrian improvements where density supports it',
  'This stance prioritizes keeping the existing road network in good repair while making selective investments in transit service, pedestrian improvements, and cycling infrastructure in areas where density and demand justify them. The position holds that transportation investment should be evidence-based and proportional to actual use rather than ideologically driven, and that roads serving the majority of trips should be well-maintained before resources are directed to alternative modes with limited ridership in low-density areas. Proponents believe targeted multimodal investment where conditions support it is more effective than system-wide mandates.',
  ARRAY[
    'Road maintenance has a strong return on investment — deteriorated roads cost drivers and freight operators significantly more in vehicle wear and fuel than preventive maintenance costs the city.',
    'Transit and cycling investments are most cost-effective where they are used most; concentrating those investments in denser, higher-demand corridors produces better outcomes than spreading them thinly across the entire city.',
    'Maintaining the road network that the majority of residents rely on daily is a basic city obligation; allowing roads to deteriorate while pursuing alternative mode investments creates a perception of misaligned priorities.'
  ],
  ARRAY[
    'A driver who commutes by car in a low-density area where transit is not practical may view road maintenance as the city transportation investment most directly relevant to their daily life.',
    'A business owner whose deliveries depend on functional roads may view maintaining the freight network as a prerequisite for commerce that should not be compromised in favor of facilities serving fewer users.',
    'A resident in a neighborhood dense enough to support improved bus service may value targeted transit investment while also wanting the city to ensure that roads serving the rest of the city are kept in good condition.'
  ]
FROM inform.compass_topics t
WHERE t.topic_key = 'transportation-priorities' AND t.is_live = true
ON CONFLICT (topic_id, value) DO NOTHING;

INSERT INTO inform.compass_stances
  (topic_id, value, text, description, supporting_points, example_perspectives)
SELECT
  t.id,
  4,
  'Focus on road capacity and traffic flow; transportation investment should serve the majority who drive',
  'This stance holds that the city''s transportation system should be primarily designed and funded around automobile travel, since the overwhelming majority of trips — to work, school, shopping, and services — are made by car in most American cities. Investment in road capacity, signal optimization, and parking should be the priority, with transit and cycling investments reserved for cases where they serve significant ridership rather than deployed as policy statements. Proponents argue that designing for actual travel behavior rather than aspirational behavior is more honest and more effective.',
  ARRAY[
    'In most American cities, more than 80 percent of commute and service trips are taken by car; transportation investment that primarily serves drivers is aligned with actual travel behavior rather than aspirational patterns.',
    'Road capacity and traffic flow have direct economic impacts on freight delivery, emergency response times, and the ability of workers to access employment across the metropolitan area.',
    'Optimizing signal timing and intersection design can significantly improve road throughput without construction, providing capacity improvements at a fraction of the cost of new lane miles.'
  ],
  ARRAY[
    'A commuter who drives to work in an area with no practical transit alternative may view road investment as the only transportation spending that actually affects their daily commute.',
    'A delivery driver or contractor whose income depends on moving efficiently through city streets may view road capacity and signal optimization as directly affecting their livelihood.',
    'A resident in an outlying neighborhood where transit is infrequent and cycling is impractical due to distance may see road investment as the only form of city transportation spending that serves them.'
  ]
FROM inform.compass_topics t
WHERE t.topic_key = 'transportation-priorities' AND t.is_live = true
ON CONFLICT (topic_id, value) DO NOTHING;

INSERT INTO inform.compass_stances
  (topic_id, value, text, description, supporting_points, example_perspectives)
SELECT
  t.id,
  5,
  'Prioritize highway access and abundant free parking as the foundation of local transportation policy',
  'This stance holds that easy highway access and widely available free parking are the foundations of a city''s economic competitiveness and quality of life for the residents and businesses who rely on them. The city should invest in maintaining and expanding highway connections, ensuring that parking is abundant and accessible near commercial and civic destinations, and avoiding policies — such as parking fees, reduced parking minimums, or road diets — that make car travel less convenient. Proponents argue that these facilities are the infrastructure that the city''s economy runs on.',
  ARRAY[
    'Highway access is a primary factor in where businesses locate, where workers can reach jobs, and where regional logistics networks operate; degrading highway access reduces the city''s economic reach and attractiveness.',
    'Abundant free parking is a direct subsidy to city commerce that benefits residents and businesses by reducing the friction of accessing shops, services, and employers — policies that restrict parking availability reduce economic activity.',
    'In a region with dispersed employment and incomplete transit, highway access and parking determine whether many workers can access job opportunities; restricting either limits economic mobility for car-dependent households.'
  ],
  ARRAY[
    'A commuter who moved to the suburbs specifically for highway access to regional employment centers may view highway investment and parking abundance as the transportation policy most relevant to their daily life.',
    'A retail business owner who depends on easy customer access and adequate parking to compete with online retail may view parking availability as essential infrastructure for brick-and-mortar commerce.',
    'A resident who depends on a car for all transportation — due to disability, family logistics, or distance from services — may view car-centric transportation policy as reflecting their actual needs rather than ignoring them.'
  ]
FROM inform.compass_topics t
WHERE t.topic_key = 'transportation-priorities' AND t.is_live = true
ON CONFLICT (topic_id, value) DO NOTHING;

-- -------------------------------------------------------
-- Topic: local-environment
-- -------------------------------------------------------

INSERT INTO inform.compass_stances
  (topic_id, value, text, description, supporting_points, example_perspectives)
SELECT
  t.id,
  1,
  'Require significant green space, tree preservation, and environmental review before approving any development',
  'This stance holds that the city should require substantial environmental review, meaningful tree preservation, and guaranteed green space set-asides before approving any development project, treating the natural environment as a public asset that development must preserve or replace. Proponents argue that each approval that degrades the urban tree canopy, reduces permeable surface, or eliminates natural areas has cumulative effects — stormwater runoff, heat island intensification, habitat loss — that harm the entire community and are costly to reverse. Protecting environmental features should be a precondition for development, not a mitigation after the fact.',
  ARRAY[
    'Urban tree canopy reduces surface temperatures by several degrees, lowers energy costs for surrounding buildings, and improves air quality; once mature trees are removed, it takes decades to restore their functional value.',
    'Impervious surface created by development increases stormwater runoff volumes and peak flows, contributing to flooding, stream erosion, and water quality problems that impose costs on the entire city.',
    'Requiring environmental review before approval gives the community information about cumulative impacts and ensures that mitigation is designed into the project rather than negotiated as an afterthought.'
  ],
  ARRAY[
    'A homeowner who has experienced basement flooding attributable to upstream development may view pre-approval environmental review as a safeguard against the infrastructure and private property costs of inadequate stormwater management.',
    'A parent who values urban parks and natural areas for children''s outdoor experience may see preservation requirements as protecting public assets that cannot be replaced once developed.',
    'A nature enthusiast who has watched the local tree canopy and green space shrink with each development cycle may view pre-approval review requirements as the only mechanism that actually prevents cumulative loss.'
  ]
FROM inform.compass_topics t
WHERE t.topic_key = 'local-environment' AND t.is_live = true
ON CONFLICT (topic_id, value) DO NOTHING;

INSERT INTO inform.compass_stances
  (topic_id, value, text, description, supporting_points, example_perspectives)
SELECT
  t.id,
  2,
  'Protect existing parks and tree canopy strictly; require developers to fully offset any environmental impact',
  'This approach mandates strict protection of existing parks and urban tree canopy from development encroachment and requires developers to fully offset any environmental impact they create — through on-site mitigation, fee-in-lieu contributions to a green space fund, or replanting requirements equivalent to what was removed. The position holds that the city can allow development while ensuring the total stock of environmental assets does not decline. Proponents argue that full-offset requirements internalize environmental costs into development projects rather than externalizing them to the public.',
  ARRAY[
    'Requiring full offset of environmental impacts ensures that the total stock of urban tree canopy and green space is maintained at current levels even as development occurs — the city does not lose net environmental assets over time.',
    'Fee-in-lieu programs allow developers flexibility in how they meet offset requirements while ensuring funds are directed to targeted greening investments in neighborhoods that need them most.',
    'Strict protection of existing parks from development encroachment preserves facilities that serve high-density neighborhoods where green space per resident is already scarce and alternative locations are difficult to find.'
  ],
  ARRAY[
    'A neighborhood resident whose nearby park is the only green space for blocks may view strict park protection as defending an irreplaceable community asset from development pressure that already has many alternative sites.',
    'An urban forestry professional who tracks canopy cover over time may view full-offset requirements as the minimum standard to prevent the gradual depletion that occurs when individual removals are approved without replacement.',
    'A developer who operates in cities with clear and consistent offset requirements may view them as preferable to unpredictable case-by-case negotiations, since clear rules make project costs known at the outset.'
  ]
FROM inform.compass_topics t
WHERE t.topic_key = 'local-environment' AND t.is_live = true
ON CONFLICT (topic_id, value) DO NOTHING;

INSERT INTO inform.compass_stances
  (topic_id, value, text, description, supporting_points, example_perspectives)
SELECT
  t.id,
  3,
  'Apply consistent environmental standards while giving developers reasonable flexibility on implementation',
  'This stance holds that the city should maintain clear and consistently applied environmental standards — for tree removal, green space, stormwater management, and landscaping — while giving developers reasonable flexibility in how those standards are met on specific sites. The position treats environmental protection as a non-negotiable outcome while acknowledging that rigid prescriptive rules do not always produce the best results on every site. Proponents believe that outcome-based standards with implementation flexibility produce both better environmental results and better development than rigid rules that encourage gaming or unnecessary conflict.',
  ARRAY[
    'Consistent standards applied to all projects create predictability for developers and prevent the perception that environmental requirements are negotiable depending on project size or political connections.',
    'Flexibility in how standards are met — on-site mitigation, off-site compensation, or fee contributions — allows developers to respond to site-specific constraints while ensuring the overall environmental outcome is achieved.',
    'Outcome-based standards focus regulatory attention on what the city actually cares about — net green space, canopy cover, stormwater performance — rather than process compliance that may or may not produce the desired results.'
  ],
  ARRAY[
    'A property developer who has experienced both rigid prescriptive rules that created unnecessary project complications and flexible standards that achieved the same outcome more efficiently may favor the latter approach.',
    'An environmental staff person at the city who wants to enforce meaningful requirements rather than manage gaming of technical rules may view outcome-based standards as more honest and administratively durable.',
    'A resident who wants the environment protected but also wants the city to be able to approve good projects without excessive friction may see consistent, flexible standards as the approach most likely to achieve both goals.'
  ]
FROM inform.compass_topics t
WHERE t.topic_key = 'local-environment' AND t.is_live = true
ON CONFLICT (topic_id, value) DO NOTHING;

INSERT INTO inform.compass_stances
  (topic_id, value, text, description, supporting_points, example_perspectives)
SELECT
  t.id,
  4,
  'Allow developers to pay fees in lieu of on-site preservation; prioritize economic activity over green space',
  'This stance holds that when development and environmental preservation come into direct conflict, economic activity should generally take priority, and that developers should be allowed to satisfy any environmental requirements through fee payments that go into a general greening fund rather than requiring on-site preservation that may constrain project design or viability. The position treats green space and tree canopy as fungible — a fee contribution elsewhere can compensate for removal at the project site — and prioritizes maximizing the economic productivity of each parcel. Proponents argue that economic activity generates the tax revenue that funds city services including parks.',
  ARRAY[
    'Fee-in-lieu systems allow development to proceed on its most economically productive site configuration while ensuring that a portion of value is captured for citywide greening investments.',
    'Concentrating green space investment in parks and natural areas where it is most efficiently maintained and most accessible to residents may produce better outcomes than requiring fragmented on-site preservation on each individual development parcel.',
    'Economic activity on developed land generates property taxes, sales taxes, and employment that fund the city services — including parks maintenance — that residents value; prioritizing development supports those revenue streams.'
  ],
  ARRAY[
    'A developer whose project design is constrained by on-site tree preservation requirements may find fee-in-lieu systems that allow design flexibility while contributing to a greening fund to be a reasonable alternative.',
    'A city finance official who sees property tax revenue as the primary funding source for parks and services may view development that generates that revenue as ultimately supporting more green space than preservation requirements might suggest.',
    'A business owner seeking a commercial location who prioritizes access, parking, and visibility over nearby greenery may view this stance as reflecting their actual priority ordering.'
  ]
FROM inform.compass_topics t
WHERE t.topic_key = 'local-environment' AND t.is_live = true
ON CONFLICT (topic_id, value) DO NOTHING;

INSERT INTO inform.compass_stances
  (topic_id, value, text, description, supporting_points, example_perspectives)
SELECT
  t.id,
  5,
  'Remove local environmental restrictions beyond what state and federal law requires',
  'This stance holds that local environmental regulations that exceed state and federal requirements impose unnecessary costs on development without producing proportional benefits, and that the city should limit its environmental rules to what higher levels of government mandate. Proponents argue that local regulations layered on top of state and federal requirements — additional tree preservation ordinances, local green space mandates, enhanced stormwater standards — create duplicative compliance costs, delay projects, and make the city less competitive for development compared to jurisdictions with lighter regulatory environments. The appropriate level of environmental protection should be set by state and federal agencies with broader expertise and authority.',
  ARRAY[
    'State and federal environmental regulations already provide a substantial baseline of environmental protection; local regulations that exceed them add cost and delay without a commensurate environmental benefit in most cases.',
    'Eliminating duplicative local requirements reduces compliance costs and approval timelines, making the city more competitive for development that would otherwise locate in jurisdictions with lighter regulatory environments.',
    'Environmental regulation is a state and federal competency with agencies and expertise specifically structured for it; local governments are better positioned to focus on land use, services, and infrastructure within that regulatory framework.'
  ],
  ARRAY[
    'A developer who operates across multiple jurisdictions and finds that local environmental layers add significant cost and time without improving outcomes may see regulatory streamlining to state and federal standards as a reasonable simplification.',
    'A city council member focused on removing barriers to housing production and economic development may view local environmental rules that exceed state and federal requirements as an area where local regulation has overreached.',
    'A property owner who wants to develop their land and finds local requirements more restrictive than state or federal standards may view state and federal preemption as the appropriate level of environmental governance.'
  ]
FROM inform.compass_topics t
WHERE t.topic_key = 'local-environment' AND t.is_live = true
ON CONFLICT (topic_id, value) DO NOTHING;

-- -------------------------------------------------------
-- Topic: rent-regulation
-- -------------------------------------------------------

INSERT INTO inform.compass_stances
  (topic_id, value, text, description, supporting_points, example_perspectives)
SELECT
  t.id,
  1,
  'Expand rent control to all rental units with strong tenant protections and just-cause eviction requirements',
  'This stance holds that the city should extend rent stabilization to all rental units — including newer construction — and pair it with strong just-cause eviction requirements that prevent landlords from displacing tenants without a documented, legitimate reason. Proponents argue that rent control without just-cause protections can be circumvented through eviction, and that the displacement of long-term tenants from gentrifying neighborhoods is a housing crisis that the market will not self-correct. The city has an obligation to protect residents who have built their lives in a community from being priced or displaced out of it.',
  ARRAY[
    'Rent control paired with just-cause eviction requirements prevents the two most common displacement mechanisms — rent increases and unjustified evictions — providing comprehensive stability for existing tenants.',
    'Displacement of long-term, lower-income residents from gentrifying neighborhoods severs community ties, increases commutes, and imposes costs on displaced families that are rarely reflected in market statistics.',
    'Just-cause eviction requirements do not prevent legitimate landlord actions — they simply require documentation of a genuine reason, protecting tenants from retaliatory or opportunistic removal.'
  ],
  ARRAY[
    'A longtime renter in a neighborhood experiencing rapid rent increases may view comprehensive rent control as the only mechanism that allows them to remain in the community they have lived in for years.',
    'A tenant who has received a no-cause eviction notice when market rents increased may see just-cause requirements as a basic protection against displacement used as a financial instrument.',
    'A community organizer who works with long-term residents facing displacement may view expanded rent control as addressing both the housing cost and community stability dimensions of the problem simultaneously.'
  ]
FROM inform.compass_topics t
WHERE t.topic_key = 'rent-regulation' AND t.is_live = true
ON CONFLICT (topic_id, value) DO NOTHING;

INSERT INTO inform.compass_stances
  (topic_id, value, text, description, supporting_points, example_perspectives)
SELECT
  t.id,
  2,
  'Strengthen existing rent stabilization and extend coverage to more units',
  'This approach builds on existing rent stabilization programs by strengthening their protections — tightening allowable annual increase formulas, closing exemptions that allow landlords to exit the program — and extending coverage to additional rental units not currently included. The position holds that existing rent stabilization programs are often too limited in scope to protect most renters, and that extending and strengthening them will provide meaningful housing stability without the most disruptive effects attributed to comprehensive rent control. Proponents argue that incremental improvements to existing programs are more politically durable than starting from scratch.',
  ARRAY[
    'Tightening allowable annual increase formulas in existing rent stabilization programs reduces the gap between permitted increases and actual inflation, providing more meaningful protection for covered tenants.',
    'Extending coverage to additional unit types — including single-family rentals, newer construction, or previously exempt buildings — reduces the ability of landlords to shift operations to exempt categories to avoid stabilization rules.',
    'Building on existing programs leverages administrative infrastructure already in place, making incremental expansion faster and less costly to implement than creating new regulatory systems.'
  ],
  ARRAY[
    'A tenant in a unit that barely missed current rent stabilization coverage thresholds may view extension of the program as closing a gap that has real consequences for housing stability.',
    'A renter who has benefited from existing stabilization protections and wants them extended to neighbors who are not currently covered may see program expansion as achieving greater equity in who receives protections.',
    'A housing advocate who has documented the limitations of existing programs through case data may view targeted strengthening and extension as the most direct way to improve outcomes for tenants currently falling through the gaps.'
  ]
FROM inform.compass_topics t
WHERE t.topic_key = 'rent-regulation' AND t.is_live = true
ON CONFLICT (topic_id, value) DO NOTHING;

INSERT INTO inform.compass_stances
  (topic_id, value, text, description, supporting_points, example_perspectives)
SELECT
  t.id,
  3,
  'Maintain current tenant protections while allowing market rents for new construction',
  'This stance holds that existing tenant protections — including current rent stabilization coverage and eviction regulations — should be maintained and consistently enforced, while new construction is exempt from rent regulation to preserve the economic incentive to build additional rental housing. The position is grounded in the policy judgment that rent regulation of new construction reduces new supply by making rental development less financially viable, which compounds the housing shortage over time. Proponents argue that protecting existing tenants and incentivizing new construction are both legitimate goals that can be pursued simultaneously without contradiction.',
  ARRAY[
    'Exempting new construction from rent regulation preserves the economic viability of new rental development, maintaining the supply of new units that the housing market depends on to relieve upward rent pressure over time.',
    'Maintaining existing tenant protections for already-occupied units provides housing stability for current renters without imposing new regulation on the development of additional supply.',
    'The economic evidence on new construction exemptions suggests that they produce more new housing than blanket rent control that covers all units, which benefits all renters by adding supply to a constrained market.'
  ],
  ARRAY[
    'A renter in a stabilized unit who also wants more housing options available in the city may see new construction exemptions as a reasonable trade-off that produces more supply without undermining existing protections.',
    'A rental housing developer who has analyzed the economics of rent-regulated versus market-rate new construction may view new construction exemptions as the difference between a viable and an unviable development pro forma.',
    'A city official who wants to both protect existing renters and increase housing supply may view this dual approach as avoiding the supply suppression effects attributed to comprehensive rent control while maintaining meaningful protections.'
  ]
FROM inform.compass_topics t
WHERE t.topic_key = 'rent-regulation' AND t.is_live = true
ON CONFLICT (topic_id, value) DO NOTHING;

INSERT INTO inform.compass_stances
  (topic_id, value, text, description, supporting_points, example_perspectives)
SELECT
  t.id,
  4,
  'Limit rent regulations to subsidized units; allow market rents broadly',
  'This stance holds that rent regulation should be limited to units in publicly subsidized affordable housing programs, where public investment justifies public oversight of rent levels, and that market-rate rental housing should be free to price rents based on supply and demand. The position treats rent regulation outside of subsidized housing as government interference in private contracts that distorts the rental market, reduces maintenance investment, and produces allocation inefficiencies. Proponents argue that increasing housing supply through development, rather than regulating prices, is the correct policy response to high rents.',
  ARRAY[
    'Publicly subsidized housing units represent government investment that justifies oversight of how that investment is used — rent regulation attached to subsidy programs is a condition of public funding rather than market interference.',
    'Market-rate rent regulation discourages rental property maintenance investment by compressing the return available on improvements, producing long-term housing quality deterioration that ultimately harms tenants.',
    'Supply is the long-term determinant of rent levels in a housing market; addressing high rents through supply production rather than price controls produces durable results without the allocation distortions of regulation.'
  ],
  ARRAY[
    'A landlord who maintains their property and relies on rental income as a long-term investment may view market-rate rent regulation as reducing the return that justifies ongoing maintenance and capital investment.',
    'A housing economist who studies the relationship between rent control and new supply production may view this stance as reflecting the empirical consensus on the long-term effects of broad rent regulation on housing markets.',
    'A property owner who has purchased rental property at current market prices and cash-flowed their investment based on market rents may view retroactive rent regulation as changing the terms of a contract made in good faith.'
  ]
FROM inform.compass_topics t
WHERE t.topic_key = 'rent-regulation' AND t.is_live = true
ON CONFLICT (topic_id, value) DO NOTHING;

INSERT INTO inform.compass_stances
  (topic_id, value, text, description, supporting_points, example_perspectives)
SELECT
  t.id,
  5,
  'Oppose rent control entirely; rents should be set by the market without government intervention',
  'This stance holds that rent control in any form is counterproductive government interference in the private rental market that reduces housing supply, degrades housing quality, misallocates existing units, and ultimately raises rents for uncontrolled units by suppressing supply growth. Proponents argue that the economic evidence against rent control is among the most consistent findings in housing economics and that cities that pursue supply-side solutions — building more housing — have better outcomes for renters over time than those that try to regulate prices directly. Any city-level rent regulation should be opposed.',
  ARRAY[
    'The economic research on rent control consistently finds that it reduces the supply of rental housing available in the controlled segment by inducing conversions, demolitions, and reduced new construction, ultimately harming renters overall.',
    'Rent control creates a misallocation of existing housing — tenants with below-market rents have reduced incentives to move even when their housing needs change, keeping units occupied by people they no longer fit while others who need them cannot access them.',
    'Allowing rents to reflect supply and demand sends accurate price signals to developers about where and what to build; regulated rents distort those signals and produce less new housing in high-demand areas.'
  ],
  ARRAY[
    'A property owner or developer who has seen new rental construction become financially unviable in rent-controlled cities may view rent control as the policy most directly responsible for the supply shortage it ostensibly addresses.',
    'An economics researcher who has studied the long-term effects of rent regulation programs across multiple cities may see this stance as reflecting the preponderance of the evidence on how rent control affects housing markets.',
    'A tenant seeking to rent in a city with extensive rent control may find — to their frustration — that the market has fewer available units at higher prices for uncontrolled units than comparable cities without rent control, making this stance compelling from their own experience.'
  ]
FROM inform.compass_topics t
WHERE t.topic_key = 'rent-regulation' AND t.is_live = true
ON CONFLICT (topic_id, value) DO NOTHING;

-- -------------------------------------------------------
-- Topic: local-immigration
-- -------------------------------------------------------

INSERT INTO inform.compass_stances
  (topic_id, value, text, description, supporting_points, example_perspectives)
SELECT
  t.id,
  1,
  'Refuse all ICE detainers; prohibit city employees from sharing immigration status information with federal agencies',
  'This stance holds that the city should refuse all Immigration and Customs Enforcement detainer requests and prohibit city employees — including police officers — from sharing any information about a person''s immigration status with federal agencies. Proponents argue that city police departments are funded to serve all residents, and that involving them in federal immigration enforcement undermines trust with immigrant communities, reduces crime reporting, and harms public safety by making a large segment of the population afraid to call police when they are victimized. Immigration enforcement is a federal responsibility and should remain so.',
  ARRAY[
    'When undocumented residents fear that calling the police will lead to deportation, crime goes unreported and witnesses do not come forward — reducing the safety of the entire community, not just immigrant residents.',
    'City police departments are funded to enforce state and local law; requiring them to serve as de facto federal immigration enforcement agents exceeds their mandate and diverts resources from local policing priorities.',
    'Prohibiting information sharing creates a clearly communicated trust baseline that allows immigrant community members to interact with city services — schools, health departments, and emergency services — without fear of immigration consequences.'
  ],
  ARRAY[
    'An undocumented resident who has been a crime victim but is afraid to report it for fear of deportation may view this stance as the only policy that makes them a full participant in the public safety system.',
    'A police chief who tracks crime reporting rates in immigrant communities and has seen them decline when enforcement collaboration becomes visible may view detainer refusals as a public safety strategy, not just a social position.',
    'An immigrant rights attorney who has seen clients detained after routine police contact may view information-sharing prohibitions as protecting people from consequences disproportionate to the circumstances of contact.'
  ]
FROM inform.compass_topics t
WHERE t.topic_key = 'local-immigration' AND t.is_live = true
ON CONFLICT (topic_id, value) DO NOTHING;

INSERT INTO inform.compass_stances
  (topic_id, value, text, description, supporting_points, example_perspectives)
SELECT
  t.id,
  2,
  'Comply only with court-ordered detainers; protect undocumented crime victims and witnesses from referral',
  'This approach limits local compliance with immigration detainer requests to those supported by a judicial warrant, while actively protecting undocumented crime victims and witnesses from being referred to federal immigration authorities. The position holds that a judicial standard is appropriate before the city takes the significant step of detaining someone beyond their scheduled release at federal request. Protecting crime victims and witnesses specifically addresses the public safety cost of immigration enforcement: when victims and witnesses fear referral, crimes go unsolved and offenders remain free to victimize others.',
  ARRAY[
    'A judicial warrant standard for detainer compliance aligns local immigration practice with Fourth Amendment principles — the city should require the same legal threshold for immigration detention holds as for any other deprivation of liberty.',
    'Explicitly protecting undocumented crime victims and witnesses from ICE referral preserves the city''s ability to investigate and prosecute crimes in immigrant communities, which benefits all residents.',
    'Limiting cooperation to court-ordered detainers reflects a narrow, principled distinction: the city will honor legal process from any government authority, but will not act on administrative requests that lack judicial review.'
  ],
  ARRAY[
    'A prosecutor who depends on undocumented witnesses to bring violent crime cases to trial may view victim and witness protection from referral as a practical necessity for their work, regardless of their views on immigration policy generally.',
    'A resident who wants the city to maintain the rule of law — requiring judicial process for detention holds — but who also supports immigration enforcement when properly authorized may find this position a reasonable standard.',
    'A community health worker who serves immigrant patients and has seen people avoid emergency rooms after reported ICE activity may view victim protections as extending the same benefit to medical settings, where lives depend on willingness to seek care.'
  ]
FROM inform.compass_topics t
WHERE t.topic_key = 'local-immigration' AND t.is_live = true
ON CONFLICT (topic_id, value) DO NOTHING;

INSERT INTO inform.compass_stances
  (topic_id, value, text, description, supporting_points, example_perspectives)
SELECT
  t.id,
  3,
  'Follow federal law as required but do not use city resources for proactive immigration enforcement',
  'This stance holds that the city should comply with its legal obligations under federal law — including court-ordered detainers and required information sharing — while declining to use city police, staff, or resources for proactive immigration enforcement activities that go beyond what federal law requires. The position draws a line between legal compliance and voluntary resource contribution: the city follows the law but does not augment federal enforcement capacity with local taxpayer-funded resources. Proponents hold that local law enforcement should focus on local public safety priorities funded by local taxpayers.',
  ARRAY[
    'Using city police and staff for proactive federal immigration enforcement diverts local resources from locally funded public safety priorities without compensation from the federal government funding those activities.',
    'The distinction between legal compliance and voluntary augmentation of federal enforcement is real and legally significant: the city meets its obligations without deploying local resources as an extension of a federal agency.',
    'This approach is politically durable across diverse communities because it cannot credibly be called defiance of federal law while also avoiding the use of city police as instruments of federal immigration policy.'
  ],
  ARRAY[
    'A police officer who wants a clear departmental policy on immigration contact — one that keeps them focused on local public safety rather than potentially complex federal enforcement scenarios — may find this stance operationally sensible.',
    'A fiscal steward focused on whether city police and resources are being used for locally funded purposes may see this as the appropriate jurisdictional boundary for city activity.',
    'A resident who wants the city to follow the law but also believes city police should be focused on local crime rather than serving as federal immigration agents may find this middle position well-calibrated.'
  ]
FROM inform.compass_topics t
WHERE t.topic_key = 'local-immigration' AND t.is_live = true
ON CONFLICT (topic_id, value) DO NOTHING;

INSERT INTO inform.compass_stances
  (topic_id, value, text, description, supporting_points, example_perspectives)
SELECT
  t.id,
  4,
  'Honor ICE detainers and share information proactively when federal agencies request it',
  'This stance holds that the city should honor all Immigration and Customs Enforcement detainer requests and proactively share information with federal agencies when requested, treating immigration enforcement as a legitimate law enforcement cooperation that local agencies should support. Proponents argue that respecting federal immigration law and cooperating with federal agencies is a basic obligation of local government, and that choosing to obstruct or limit that cooperation undermines the rule of law and damages intergovernmental trust. A city that enforces some laws but selectively refuses cooperation with others sends a message that legal compliance is optional.',
  ARRAY[
    'Honoring federal detainer requests demonstrates respect for federal law and the authority of federal law enforcement agencies — local jurisdictions that selectively refuse federal cooperation create a patchwork of enforcement that undermines consistent application of national law.',
    'Sharing information proactively with federal agencies when requested extends normal law enforcement cooperation — the same cooperation that local departments extend to state and other federal agencies — to immigration authorities.',
    'Undocumented residents who commit local crimes and are released without ICE notification may be free to commit additional offenses; cooperation that results in their removal prevents that outcome for the community.'
  ],
  ARRAY[
    'A resident who believes all laws on the books deserve consistent enforcement and does not see immigration law as different in kind from other federal statutes may view detainer compliance as a basic rule-of-law position.',
    'A city official who values the city''s relationship with federal agencies — and the funding and support that flows from cooperative intergovernmental relationships — may see proactive cooperation as protecting those relationships.',
    'A victim of a crime committed by someone who had prior encounters with local police but was never referred to federal authorities may view cooperation as a policy that could have prevented their victimization.'
  ]
FROM inform.compass_topics t
WHERE t.topic_key = 'local-immigration' AND t.is_live = true
ON CONFLICT (topic_id, value) DO NOTHING;

INSERT INTO inform.compass_stances
  (topic_id, value, text, description, supporting_points, example_perspectives)
SELECT
  t.id,
  5,
  'Direct city police to actively assist with immigration enforcement and support federal detention operations',
  'This stance holds that the city should go beyond passive cooperation and actively direct its police department to assist with immigration enforcement activities — including participating in joint operations, conducting immigration-related checks, and supporting federal detention operations. Proponents argue that immigration enforcement is a public safety function that directly affects the community, and that local law enforcement is well-positioned to assist federal agencies given their presence and knowledge of local conditions. Active partnership with federal immigration authorities is seen as a civic responsibility.',
  ARRAY[
    'Active partnership between local police and federal immigration authorities maximizes enforcement coverage by leveraging local officers'' familiarity with neighborhoods, individuals, and locations relevant to enforcement priorities.',
    'Cities whose police participate actively in immigration enforcement can expect closer cooperation from federal agencies on other law enforcement matters — joint operations build interagency relationships that have value beyond immigration.',
    'Proactive enforcement of immigration law at the local level demonstrates to law-abiding residents that the city applies its full law enforcement capacity to all legal violations, including violations of federal immigration law.'
  ],
  ARRAY[
    'A resident who views unauthorized immigration as a significant enough public concern to warrant active local law enforcement involvement may see city police participation as a proportional response.',
    'A city official who has received pressure from federal authorities to cooperate more actively and wants to maintain federal relationships and funding streams may see active participation as practically necessary.',
    'A voter in a community with a strong law enforcement culture who does not distinguish between federal and local law enforcement cooperation by type of offense may view active immigration assistance as consistent with supporting law enforcement generally.'
  ]
FROM inform.compass_topics t
WHERE t.topic_key = 'local-immigration' AND t.is_live = true
ON CONFLICT (topic_id, value) DO NOTHING;

-- -------------------------------------------------------
-- Topic: city-sanitation
-- -------------------------------------------------------

INSERT INTO inform.compass_stances
  (topic_id, value, text, description, supporting_points, example_perspectives)
SELECT
  t.id,
  1,
  'Significantly expand sanitation staffing, cleaning frequency, and free community disposal access; treat poor conditions as a services failure',
  'This stance holds that dirty streets and overflowing public trash receptacles are primarily a government services failure, not a behavior problem, and that the solution is substantially increased sanitation staffing, more frequent cleaning schedules, and expanded access to free or low-cost disposal services so residents and small businesses have easy, legal options for waste disposal. Proponents argue that when people do not have convenient options for disposing of waste, illegal dumping and litter are predictable outcomes that enforcement alone cannot solve. The city should meet the actual level of service demand its residents generate.',
  ARRAY[
    'Where free disposal access and collection frequency are adequate, illegal dumping rates are lower — the primary driver of dumping is the absence of a convenient legal alternative, not disregard for law.',
    'Sanitation service frequency is a direct determinant of conditions: areas that receive daily collection and cleaning maintain cleanliness even under high use, while areas with weekly service cannot absorb the same demand without visible deterioration.',
    'Framing poor sanitation conditions as a services failure rather than a compliance failure focuses attention and resources on what the city controls — staffing, equipment, frequency — rather than on behavior the city cannot directly change.'
  ],
  ARRAY[
    'A resident in a high-density neighborhood whose public trash receptacles overflow before the scheduled pickup may view this stance as accurately diagnosing the problem: the service level does not match the demand.',
    'A small business owner who lacks affordable options for disposal of commercial waste and has seen their block deteriorate despite their own efforts may see expanded city disposal services as removing the conditions that make illegal dumping attractive.',
    'A community organizer in a neighborhood with historically lower service levels who has documented the disparity compared to wealthier areas of the same city may see expanded services as correcting an inequity in how the city distributes basic public goods.'
  ]
FROM inform.compass_topics t
WHERE t.topic_key = 'city-sanitation' AND t.is_live = true
ON CONFLICT (topic_id, value) DO NOTHING;

INSERT INTO inform.compass_stances
  (topic_id, value, text, description, supporting_points, example_perspectives)
SELECT
  t.id,
  2,
  'Increase sanitation crews and prioritize historically underserved neighborhoods to equalize cleanliness citywide',
  'This approach calls for increasing sanitation staffing and directing the increase toward neighborhoods that have historically received less frequent or less thorough city cleaning services, with the goal of equalizing service levels across all parts of the city. The position holds that sanitation service has not been distributed equally across neighborhoods and that a growing city must close that gap as it expands its workforce. Proponents argue that equalized service standards are both a matter of basic civic equity and a practical approach to conditions that are most severe in areas with the greatest historical service deficits.',
  ARRAY[
    'Auditing sanitation service delivery by neighborhood and directing additional resources to historically underserved areas closes gaps that have compounded over time into significantly worse baseline conditions.',
    'Equal service standards across all neighborhoods reflect the equal tax obligations of all residents and the equal entitlement of all residents to the public goods their taxes fund.',
    'Prioritizing historically underserved neighborhoods for staffing increases produces the most visible and immediate improvement in citywide conditions because those areas start from the greatest deficit.'
  ],
  ARRAY[
    'A resident in a neighborhood that has tracked cleaning frequency data and documented disparate service levels compared to more affluent areas may view targeted increases as correcting a documented inequity.',
    'A newly elected council member representing a historically underserved district who has campaigned on basic services parity may see this stance as the core deliverable their constituents elected them to pursue.',
    'A city administrator concerned about public trust may view visibly equal service levels as essential to maintaining confidence that city government works for all residents regardless of where they live.'
  ]
FROM inform.compass_topics t
WHERE t.topic_key = 'city-sanitation' AND t.is_live = true
ON CONFLICT (topic_id, value) DO NOTHING;

INSERT INTO inform.compass_stances
  (topic_id, value, text, description, supporting_points, example_perspectives)
SELECT
  t.id,
  3,
  'Maintain current sanitation services while enforcing anti-dumping laws for businesses and large property owners',
  'This stance holds that the city''s current sanitation service levels are broadly adequate and that the primary lever for improvement is consistent enforcement of anti-dumping and property maintenance laws, particularly against commercial properties and large property owners who generate significant waste and are most visible in the code enforcement landscape. The position treats current public services as the right investment level while directing additional enforcement resources at identifiable, high-volume sources of litter and dumping. Proponents argue that this approach addresses the most consequential violations without requiring significant budget increases.',
  ARRAY[
    'Large commercial properties and property owners who fail to maintain their premises or manage waste adequately generate a disproportionate share of visible blight; focused enforcement on identifiable violators produces visible results efficiently.',
    'Maintaining current service levels avoids the labor and budget commitments of significant expansion while preserving the baseline cleaning and collection schedule that currently keeps most areas acceptably maintained.',
    'Anti-dumping enforcement that focuses on commercial and large-scale violators — rather than individual residents — addresses the sources most capable of correcting violations and most likely to respond to financial penalties.'
  ],
  ARRAY[
    'A resident satisfied with sanitation in most of their neighborhood but frustrated by a specific commercial property that repeatedly leaves debris may view targeted enforcement as the most direct solution to their concern.',
    'A city budget analyst who is skeptical of significant service expansion but supports better use of existing enforcement tools may view this as an achievable improvement within current resources.',
    'A business owner on a commercial block who maintains their own property but competes alongside businesses that do not may view equal anti-dumping enforcement as leveling the conditions under which everyone operates.'
  ]
FROM inform.compass_topics t
WHERE t.topic_key = 'city-sanitation' AND t.is_live = true
ON CONFLICT (topic_id, value) DO NOTHING;

INSERT INTO inform.compass_stances
  (topic_id, value, text, description, supporting_points, example_perspectives)
SELECT
  t.id,
  4,
  'Rely primarily on enforcement of anti-littering and property maintenance laws; hold residents and businesses responsible',
  'This stance holds that street cleanliness is primarily a behavioral and compliance issue, and that the city''s primary tool should be consistent enforcement of anti-littering and property maintenance ordinances that hold residents and businesses responsible for their own waste. Proponents argue that city sanitation services cannot substitute for individual responsibility, and that robust enforcement — including fines for violations — is both a more cost-effective and more durable solution than expanding city cleaning crews. Clear rules and consistent enforcement change the behavior that produces poor conditions.',
  ARRAY[
    'Consistent fine-based enforcement of littering and property maintenance creates a financial deterrent that changes behavior for a broader population than any service expansion the city can afford to staff.',
    'Holding property owners responsible for maintaining clean frontages and disposing of waste legally puts accountability where it belongs — with the people generating the conditions — rather than with city crews cleaning up after them.',
    'Enforcement-based approaches are self-funding in part: fines collected from violations offset some enforcement costs, unlike service expansion which requires ongoing appropriations with no offsetting revenue.'
  ],
  ARRAY[
    'A resident who takes personal responsibility for their own block and is frustrated that neighbors do not may view consistent enforcement as the mechanism that extends the same standard to everyone on the street.',
    'A small business owner who invests in maintaining their frontage and sidewalk may view enforcement against neighboring businesses that do not as creating fair and equal conditions for operating in the commercial district.',
    'A property taxpayer who believes city sanitation budgets should not grow to compensate for behavior that should be deterred through enforcement may view this stance as the fiscally responsible alternative to service expansion.'
  ]
FROM inform.compass_topics t
WHERE t.topic_key = 'city-sanitation' AND t.is_live = true
ON CONFLICT (topic_id, value) DO NOTHING;

INSERT INTO inform.compass_stances
  (topic_id, value, text, description, supporting_points, example_perspectives)
SELECT
  t.id,
  5,
  'Privatize sanitation services and require residents and businesses to contract for cleanup directly',
  'This stance holds that city-provided sanitation services create a service delivery model that is less efficient than what private contractors can provide, and that the city should privatize sanitation functions — including street cleaning and public space maintenance — requiring residents and businesses to contract directly with private providers for their cleanup needs. Proponents argue that competition among private providers produces better service at lower cost than city-operated programs, and that requiring direct contracting aligns the cost of services with those who generate the demand for them. The city''s role shifts from service provider to standards-setter and enforcer.',
  ARRAY[
    'Privatization of sanitation services introduces competitive pressure that city-operated programs do not face, with evidence in some jurisdictions of lower costs and equivalent or better service quality compared to city-run operations.',
    'Direct contracting between residents or businesses and service providers creates a price signal that aligns demand with willingness to pay, potentially reducing overconsumption of cleaning services in areas where current city provision exceeds actual need.',
    'Shifting the city''s role from operator to standards-setter allows the city to focus on defining and enforcing service quality expectations rather than managing labor, equipment, and schedules directly.'
  ],
  ARRAY[
    'A fiscal efficiency advocate who believes competitive contracting typically produces better value than government-operated services may see sanitation privatization as an application of that principle to a service well-suited to private delivery.',
    'A property manager in a commercial district who already contracts for private janitorial services may view private sanitation as extending a model they already use and find effective to the public streetscape.',
    'A resident frustrated with the reliability and quality of city sanitation service may see privatization as introducing accountability mechanisms — service contracts and market competition — that city operations currently lack.'
  ]
FROM inform.compass_topics t
WHERE t.topic_key = 'city-sanitation' AND t.is_live = true
ON CONFLICT (topic_id, value) DO NOTHING;

-- ============================================================
-- SECTION 3: compass_topic_roles (14 rows via 10 statements)
-- ============================================================

-- 6 LOCAL-only topics

INSERT INTO inform.compass_topic_roles (topic_id, role_scope, is_required)
SELECT t.id, 'local', true
FROM inform.compass_topics t
WHERE t.topic_key = 'residential-zoning' AND t.is_live = true
ON CONFLICT (topic_id, role_scope) DO NOTHING;

INSERT INTO inform.compass_topic_roles (topic_id, role_scope, is_required)
SELECT t.id, 'local', true
FROM inform.compass_topics t
WHERE t.topic_key = 'public-safety-approach' AND t.is_live = true
ON CONFLICT (topic_id, role_scope) DO NOTHING;

INSERT INTO inform.compass_topic_roles (topic_id, role_scope, is_required)
SELECT t.id, 'local', true
FROM inform.compass_topics t
WHERE t.topic_key = 'homelessness-response' AND t.is_live = true
ON CONFLICT (topic_id, role_scope) DO NOTHING;

INSERT INTO inform.compass_topic_roles (topic_id, role_scope, is_required)
SELECT t.id, 'local', true
FROM inform.compass_topics t
WHERE t.topic_key = 'local-environment' AND t.is_live = true
ON CONFLICT (topic_id, role_scope) DO NOTHING;

INSERT INTO inform.compass_topic_roles (topic_id, role_scope, is_required)
SELECT t.id, 'local', true
FROM inform.compass_topics t
WHERE t.topic_key = 'local-immigration' AND t.is_live = true
ON CONFLICT (topic_id, role_scope) DO NOTHING;

INSERT INTO inform.compass_topic_roles (topic_id, role_scope, is_required)
SELECT t.id, 'local', true
FROM inform.compass_topics t
WHERE t.topic_key = 'city-sanitation' AND t.is_live = true
ON CONFLICT (topic_id, role_scope) DO NOTHING;

-- 4 LOCAL+STATE topics (CROSS JOIN pattern, produces 2 rows each = 8 rows total)

INSERT INTO inform.compass_topic_roles (topic_id, role_scope, is_required)
SELECT t.id, scope.role_scope, true
FROM inform.compass_topics t
CROSS JOIN (VALUES ('local'), ('state')) AS scope(role_scope)
WHERE t.topic_key = 'growth-and-development' AND t.is_live = true
ON CONFLICT (topic_id, role_scope) DO NOTHING;

INSERT INTO inform.compass_topic_roles (topic_id, role_scope, is_required)
SELECT t.id, scope.role_scope, true
FROM inform.compass_topics t
CROSS JOIN (VALUES ('local'), ('state')) AS scope(role_scope)
WHERE t.topic_key = 'economic-development' AND t.is_live = true
ON CONFLICT (topic_id, role_scope) DO NOTHING;

INSERT INTO inform.compass_topic_roles (topic_id, role_scope, is_required)
SELECT t.id, scope.role_scope, true
FROM inform.compass_topics t
CROSS JOIN (VALUES ('local'), ('state')) AS scope(role_scope)
WHERE t.topic_key = 'transportation-priorities' AND t.is_live = true
ON CONFLICT (topic_id, role_scope) DO NOTHING;

INSERT INTO inform.compass_topic_roles (topic_id, role_scope, is_required)
SELECT t.id, scope.role_scope, true
FROM inform.compass_topics t
CROSS JOIN (VALUES ('local'), ('state')) AS scope(role_scope)
WHERE t.topic_key = 'rent-regulation' AND t.is_live = true
ON CONFLICT (topic_id, role_scope) DO NOTHING;

COMMIT;
