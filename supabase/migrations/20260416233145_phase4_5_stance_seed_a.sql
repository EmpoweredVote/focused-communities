-- Phase 4.5 Seed A: authored content for topics 1-10 (values-based, no partisan labels)

-- Topic: School Vouchers / Education Funding (00b95a6a-75db-4521-b523-3326bba938de)
UPDATE inform.compass_stances SET
  description = 'This stance holds that public schools are the foundation of equal educational opportunity and deserve the full weight of public investment. Redirecting tax dollars to private institutions is seen as undermining a shared civic institution that serves all children regardless of background or means. Proponents believe concentrated public investment produces stronger outcomes for entire communities.',
  example_perspectives = ARRAY[
    'A parent in a rural area where the public school is the only viable option may see vouchers as draining the resources that school depends on.',
    'An educator who has experienced funding cuts reducing classroom resources and staff may view voucher expansion as compounding those pressures.',
    'A citizen who believes strong public institutions are essential to a functioning democracy may prioritize public school investment as a civic obligation.'
  ]
WHERE topic_id = '00b95a6a-75db-4521-b523-3326bba938de' AND value = 1;

UPDATE inform.compass_stances SET
  description = 'This approach directs the majority of education funding to public schools while creating a limited safety valve for families in genuinely underserved areas. The goal is to keep public schools well-resourced while giving the most disadvantaged students a path to better options when their local school consistently underperforms. Accountability requirements on participating private schools are central to this stance.',
  example_perspectives = ARRAY[
    'A family in a low-income area where the nearby school is chronically underfunded may see targeted vouchers as a lifeline that does not harm others.',
    'A fiscal steward who wants to protect public school budgets while acknowledging that some students need alternatives may value this targeted approach.',
    'An advocate for children in poverty who believes both access and educational quality matter may see this as a pragmatic balance.'
  ]
WHERE topic_id = '00b95a6a-75db-4521-b523-3326bba938de' AND value = 2;

UPDATE inform.compass_stances SET
  description = 'This stance maintains existing public school funding as a protected baseline while allowing means-tested voucher programs with defined accountability standards for participating private schools. It seeks to preserve both the public education system and some degree of family choice within clear guardrails. Proponents believe accountability requirements prevent public funds from flowing to institutions without oversight.',
  example_perspectives = ARRAY[
    'A taxpayer who believes public funds should always come with accountability strings—regardless of the school type—may find this balance reasonable.',
    'A parent who values school choice but worries about private schools using public money without standards may support this regulated approach.',
    'A policymaker focused on reducing inequality without destabilizing the existing public system may see this as a sustainable path.'
  ]
WHERE topic_id = '00b95a6a-75db-4521-b523-3326bba938de' AND value = 3;

UPDATE inform.compass_stances SET
  description = 'This stance broadens voucher access to most families, treating education funding as following the student rather than the institution. It holds that competition between schools improves overall quality and that parents are best positioned to choose the right educational environment for their child. A baseline funding floor for public schools is preserved to ensure they remain viable options.',
  example_perspectives = ARRAY[
    'A parent who has researched alternatives and found them better suited to their child''s learning needs may strongly value expanded choice.',
    'Someone who believes market competition drives improvement in most domains may see school competition in a similar light.',
    'A family that has relocated to a district with underperforming schools may see expanded vouchers as the fastest path to a better education for their child.'
  ]
WHERE topic_id = '00b95a6a-75db-4521-b523-3326bba938de' AND value = 4;

UPDATE inform.compass_stances SET
  description = 'This stance holds that education funding belongs to the student and should follow them to any school their family chooses, including faith-based institutions. Universal vouchers treat all schools as equally legitimate recipients of public education funds, maximizing individual and family freedom. Advocates argue this approach respects religious liberty and forces all schools to compete for students on merit.',
  example_perspectives = ARRAY[
    'A family whose values align with faith-based education may see universal vouchers as the only way to access their preferred school with public support.',
    'Someone who views individual liberty as a core governing principle may see universal school choice as keeping education decisions in the hands of families rather than government.',
    'A community that has watched neighborhood schools decline despite sustained public funding may see universal vouchers as a structural reset.'
  ]
WHERE topic_id = '00b95a6a-75db-4521-b523-3326bba938de' AND value = 5;

-- Topic: Racial Equity / Civil Rights (0bc588c6-39e1-4084-b5de-cac909b8b762)
UPDATE inform.compass_stances SET
  description = 'This stance holds that historical injustices have created ongoing structural disadvantages that require active institutional remediation and financial reparations to correct. Proponents argue that equal treatment under existing law is insufficient when the starting conditions themselves reflect generations of unequal treatment. Mandatory equity requirements are seen as necessary to produce genuine equality of outcome.',
  example_perspectives = ARRAY[
    'A descendant of those who experienced state-sanctioned exclusion from wealth-building opportunities may view reparations as a matter of correcting a documented economic harm.',
    'A researcher who studies how historical policies shaped current wealth and health disparities may see structural remediation as the only evidence-based response.',
    'A community leader in an area with persistent poverty linked to historical exclusion may see mandatory equity requirements as the fastest route to measurable change.'
  ]
WHERE topic_id = '0bc588c6-39e1-4084-b5de-cac909b8b762' AND value = 1;

UPDATE inform.compass_stances SET
  description = 'This stance supports strengthening civil rights enforcement mechanisms and taking targeted action against documented patterns of systemic discrimination in hiring, lending, and housing. It does not call for universal mandates or reparations but does hold that existing laws are often under-enforced. Proponents believe vigorous enforcement of current civil rights statutes, plus targeted remedies where discrimination is proven, can meaningfully reduce inequality.',
  example_perspectives = ARRAY[
    'A worker who has experienced or witnessed hiring discrimination may see stronger enforcement as the most practical path to fairness.',
    'An attorney or advocate who works discrimination cases may believe the existing legal framework is sound but chronically under-resourced.',
    'A business owner who believes in genuine equal opportunity may support stricter enforcement to ensure competitors are not gaining advantage through discriminatory practices.'
  ]
WHERE topic_id = '0bc588c6-39e1-4084-b5de-cac909b8b762' AND value = 2;

UPDATE inform.compass_stances SET
  description = 'This stance holds that current civil rights laws provide an adequate framework and that the goal should be consistent, neutral enforcement of equal opportunity rules without race-based preferences or mandates. It treats individuals rather than groups as the primary unit of rights. Proponents believe equal treatment under clearly applied rules is both the fairest and most durable path to an equitable society.',
  example_perspectives = ARRAY[
    'Someone who believes the law should be blind to group identity and applied uniformly to every individual may see this as the most principled stance.',
    'A small business owner navigating compliance may prefer clear, neutral rules over outcome-based mandates that require complex tracking.',
    'A community member who believes genuine opportunity requires removing barriers rather than engineering results may favor this approach.'
  ]
WHERE topic_id = '0bc588c6-39e1-4084-b5de-cac909b8b762' AND value = 3;

UPDATE inform.compass_stances SET
  description = 'This stance holds that federal civil rights enforcement should be narrowly scoped to cases with clear, documented evidence of intentional discrimination rather than addressing broad statistical disparities. Proponents argue that statistical differences in outcomes do not by themselves prove discrimination and that expansive enforcement creates compliance burdens without targeting genuine wrongdoing. Individual rights rather than group-level outcomes should guide enforcement priorities.',
  example_perspectives = ARRAY[
    'An employer who believes disparate outcome statistics do not prove intent may want enforcement focused on actual discriminatory acts rather than numerical targets.',
    'A legal scholar who views intent as the proper standard for discrimination claims may see this stance as consistent with constitutional principles.',
    'Someone concerned about government overreach into private hiring and organizational decisions may favor a narrower, evidence-based enforcement standard.'
  ]
WHERE topic_id = '0bc588c6-39e1-4084-b5de-cac909b8b762' AND value = 4;

UPDATE inform.compass_stances SET
  description = 'This stance holds that government should not consider race in any program, preference, or policy and that all race-based distinctions—however intended—undermine the principle of equal treatment under law. Proponents believe that affirmative action and similar programs are themselves a form of discrimination and that genuinely colorblind institutions are the only durable path to equality. Removing race as a factor in any government or public institutional decision is the goal.',
  example_perspectives = ARRAY[
    'Someone who believes race-conscious policies violate the equal protection principle may see their elimination as a constitutional and moral imperative.',
    'A student who feels their own achievements were discounted or devalued by race-based admissions processes may support purely merit-based selection.',
    'A voter who believes group-based preferences breed resentment and division rather than unity may view colorblind policy as essential to social cohesion.'
  ]
WHERE topic_id = '0bc588c6-39e1-4084-b5de-cac909b8b762' AND value = 5;

-- Topic: Ukraine Aid (24e9212c-b011-422a-865c-093e35050901)
UPDATE inform.compass_stances SET
  description = 'This stance holds that Ukraine''s defense against unprovoked military aggression is a matter of global security that directly affects the stability of international order. Significantly increasing military aid is seen as the most effective deterrent against further aggression and as fulfilling obligations to allies who rely on U.S. commitments. Proponents argue that ensuring Ukraine''s complete victory is less costly in the long run than allowing territorial conquest to succeed.',
  example_perspectives = ARRAY[
    'A veteran or security professional who believes deterring aggression early prevents larger conflicts later may see maximum support as strategically sound.',
    'A citizen of a NATO-allied country who worries about spillover may view robust U.S. support as essential to their own security.',
    'Someone who believes that allowing territorial conquest through military force sets a dangerous global precedent may see a complete Ukrainian victory as a necessary outcome.'
  ]
WHERE topic_id = '24e9212c-b011-422a-865c-093e35050901' AND value = 1;

UPDATE inform.compass_stances SET
  description = 'This stance supports continuing military and economic assistance at current levels to help Ukraine maintain its territorial defense without escalating American involvement. It holds that the United States has a strategic interest in preventing a military conquest in Europe but does not advocate for expanding commitments beyond current levels. Proponents see sustained support as both morally appropriate and geopolitically necessary.',
  example_perspectives = ARRAY[
    'A foreign policy analyst who tracks European security may see current aid levels as a proportionate commitment that deters further escalation.',
    'A taxpayer who supports Ukraine''s right to self-defense but wants fiscal discipline in foreign commitments may find current levels appropriate.',
    'A lawmaker focused on maintaining alliances without provoking direct confrontation may see this calibrated approach as the responsible path.'
  ]
WHERE topic_id = '24e9212c-b011-422a-865c-093e35050901' AND value = 2;

UPDATE inform.compass_stances SET
  description = 'This stance holds that humanitarian support for civilian populations affected by the conflict is appropriate, but that military escalation should be avoided in favor of encouraging a negotiated settlement. Proponents argue that diplomatic solutions, even imperfect ones, prevent casualties on all sides and reduce the risk of wider conflict. They see the U.S. role as a facilitator of peace rather than a supplier of weapons.',
  example_perspectives = ARRAY[
    'A humanitarian worker focused on civilian protection may prioritize aid that reduces suffering over military support that prolongs fighting.',
    'Someone with a strong commitment to diplomatic resolution of international disputes may see continued arms supply as an obstacle to peace negotiations.',
    'A citizen wary of the United States being drawn into prolonged foreign military entanglements may favor limited engagement with a clear diplomatic off-ramp.'
  ]
WHERE topic_id = '24e9212c-b011-422a-865c-093e35050901' AND value = 3;

UPDATE inform.compass_stances SET
  description = 'This stance holds that the United States should redirect resources currently allocated to Ukraine aid toward pressing domestic needs such as infrastructure, healthcare, and economic development. Proponents argue that European nations with more direct stakes in the conflict should bear the primary burden of support. They do not oppose Ukraine''s right to defend itself but believe American taxpayer resources are better deployed at home.',
  example_perspectives = ARRAY[
    'A citizen in a community with deteriorating infrastructure or limited healthcare access may feel that foreign aid competes with urgent local needs.',
    'Someone who believes European allies have the resources and the greater stake to lead this effort may see U.S. reduction as a reasonable rebalancing.',
    'A fiscal steward focused on domestic priorities may argue that the United States cannot indefinitely fund foreign conflicts while its own challenges go unmet.'
  ]
WHERE topic_id = '24e9212c-b011-422a-865c-093e35050901' AND value = 4;

UPDATE inform.compass_stances SET
  description = 'This stance holds that the United States should not be involved in the Ukraine conflict in any capacity—military or financial—and that the conflict is a matter for those directly involved to resolve. Proponents believe that foreign entanglements draw America into conflicts that do not serve its national interest and risk unintended escalation. Complete non-involvement is seen as the only way to avoid being drawn into a wider war.',
  example_perspectives = ARRAY[
    'Someone with a strong non-interventionist philosophy who believes the U.S. should not act as the world''s policeman may see total disengagement as principled.',
    'A citizen deeply concerned about the risk of nuclear escalation may see ending all involvement as the safest path for Americans.',
    'A taxpayer who believes American resources should be fully devoted to domestic challenges may support complete withdrawal from foreign military financing.'
  ]
WHERE topic_id = '24e9212c-b011-422a-865c-093e35050901' AND value = 5;

-- Topic: Deportation Enforcement A (44905f3b-e105-4f6c-afc7-5d223813dbac)
UPDATE inform.compass_stances SET
  description = 'This stance holds that deportation enforcement causes serious harm to individuals, families, and communities and that undocumented residents who have built lives here should be protected from removal. Proponents argue that enforcement resources are better spent on legal pathways and integration support rather than deportation operations. They view the removal of established community members as a disproportionate response to civil immigration status.',
  example_perspectives = ARRAY[
    'A member of a mixed-status family who has seen relatives face deportation may see enforcement as a direct threat to their family''s stability.',
    'A community organizer working in immigrant neighborhoods may see deportation enforcement as undermining trust between residents and public institutions.',
    'Someone who believes immigration status violations are civil rather than criminal matters may oppose the use of criminal enforcement tools to address them.'
  ]
WHERE topic_id = '44905f3b-e105-4f6c-afc7-5d223813dbac' AND value = 1;

UPDATE inform.compass_stances SET
  description = 'This stance holds that deportation should be reserved for individuals who have committed serious violent crimes, and that people without criminal records—regardless of immigration status—should not be subject to removal. It draws a clear line between immigration status and public safety, arguing that broad deportation efforts harm communities without making them safer. Resources should focus on genuine public safety threats.',
  example_perspectives = ARRAY[
    'A law enforcement professional who sees community cooperation as essential to solving crimes may worry that broad deportation chills immigrant communities'' willingness to report crimes.',
    'A neighbor or employer of long-term undocumented residents who views them as community assets may see targeted enforcement as a more proportionate approach.',
    'A parent concerned about children being separated from non-criminal parents may support limiting deportation to those who pose documented public safety risks.'
  ]
WHERE topic_id = '44905f3b-e105-4f6c-afc7-5d223813dbac' AND value = 2;

UPDATE inform.compass_stances SET
  description = 'This stance draws a distinction between recent arrivals—who knowingly entered without authorization—and long-term residents who have built deep community ties over many years. Enforcement focused on recent crossings upholds the rule of law while recognizing that removing people who have lived, worked, and raised families here for decades carries different moral and social costs. Legal pathways for long-term residents are part of this approach.',
  example_perspectives = ARRAY[
    'A policymaker looking for a distinction that is both legally grounded and socially sustainable may see tenure as a meaningful line.',
    'A citizen who believes the law must be applied but recognizes the difference between a recent crossing and a 20-year resident with a family may support this tiered approach.',
    'A social services worker who sees the community impact of removing long-established residents may favor enforcement focused on those with shorter stays.'
  ]
WHERE topic_id = '44905f3b-e105-4f6c-afc7-5d223813dbac' AND value = 3;

UPDATE inform.compass_stances SET
  description = 'This stance holds that all people without legal immigration status should be removed, with prioritization given to those with criminal records to use enforcement resources efficiently. It argues that law must be applied consistently to have meaning and that selective enforcement undermines respect for immigration rules. Proponents believe that upholding the law fully, even when difficult, is essential to maintaining an orderly and fair immigration system.',
  example_perspectives = ARRAY[
    'A citizen who believes laws must be enforced as written—not selectively—to preserve their legitimacy may see consistent deportation as the only principled stance.',
    'Someone who immigrated through the legal process and waited years for lawful status may feel that non-enforcement is unfair to those who followed the rules.',
    'A border community resident who has seen uncontrolled crossings may see consistent enforcement as necessary to restore order and deter future unauthorized entry.'
  ]
WHERE topic_id = '44905f3b-e105-4f6c-afc7-5d223813dbac' AND value = 4;

UPDATE inform.compass_stances SET
  description = 'This stance holds that unauthorized presence should be addressed as rapidly as possible without distinctions based on how long someone has been here or whether they have family ties. Proponents argue that creating exceptions based on tenure or family circumstances creates incentives for prolonged unauthorized stays and makes enforcement unworkable. The rule of law requires that immigration status, not circumstances, determines the outcome.',
  example_perspectives = ARRAY[
    'Someone who believes that creating any exception to immigration status enforcement creates a permanent loophole may see this as the only logically consistent position.',
    'A citizen deeply concerned about national security and border integrity may see speed and universality of enforcement as necessary to credible deterrence.',
    'A voter who feels previous administrations allowed gradual erosion of immigration rules through selective enforcement may favor a decisive, comprehensive approach.'
  ]
WHERE topic_id = '44905f3b-e105-4f6c-afc7-5d223813dbac' AND value = 5;

-- Topic: Data Centers & Energy (4559b513-0fd8-4ed1-babd-f3b554162f40)
UPDATE inform.compass_stances SET
  description = 'This stance holds that data center construction should be paused until energy infrastructure can reliably meet demand without raising costs for residential customers. Proponents argue that unconstrained data center growth places an unfair burden on households and that the power grid must be expanded before adding large new commercial loads. The moratorium is a temporary measure to protect ratepayers until supply catches up.',
  example_perspectives = ARRAY[
    'A homeowner who has seen utility bills rise and attributes part of that increase to industrial energy demand may support a pause until the grid expands.',
    'A grid reliability engineer who is concerned about peak demand strain may see a moratorium as necessary to prevent outages during high-use periods.',
    'A community advocate in a low-income area where energy costs consume a high share of household income may prioritize ratepayer protection over commercial development.'
  ]
WHERE topic_id = '4559b513-0fd8-4ed1-babd-f3b554162f40' AND value = 1;

UPDATE inform.compass_stances SET
  description = 'This stance holds that data centers should be permitted to operate but must fund their own dedicated power generation and be prohibited by law from passing infrastructure costs to residential ratepayers. It supports continued data center development as long as those facilities fully internalize their energy costs. Proponents see this as the market-consistent solution: those who create demand should pay for the infrastructure they require.',
  example_perspectives = ARRAY[
    'A ratepayer advocate who believes large commercial users should not be able to socialize their infrastructure costs onto households may see dedicated power requirements as essential.',
    'An economist who believes in pricing externalities accurately may favor requiring data centers to fund their full energy footprint.',
    'A utility regulator looking to protect residential customers without blocking economic development may see cost-separation requirements as a workable compromise.'
  ]
WHERE topic_id = '4559b513-0fd8-4ed1-babd-f3b554162f40' AND value = 2;

UPDATE inform.compass_stances SET
  description = 'This stance allows data center development to proceed but requires impact assessments, energy cost-sharing agreements with utilities, and community benefit commitments before projects are approved. It holds that data centers can be net positives for communities if structured correctly, but that approval should be contingent on demonstrated benefit rather than automatic. Community input and transparent impact data are integral to each decision.',
  example_perspectives = ARRAY[
    'A local government official weighing job creation against infrastructure costs may see impact assessments as necessary to make an informed decision.',
    'A community organization that wants economic development but with neighborhood protections may favor conditional approval over blanket permission or denial.',
    'An environmental planner who tracks cumulative infrastructure strain may see energy cost-sharing agreements as a way to ensure growth is genuinely sustainable.'
  ]
WHERE topic_id = '4559b513-0fd8-4ed1-babd-f3b554162f40' AND value = 3;

UPDATE inform.compass_stances SET
  description = 'This stance supports data center development through streamlined permitting while requiring companies to publicly disclose projected energy demand and potential rate impacts so regulators and communities can make informed decisions. It holds that transparency is the primary safeguard and that burdensome pre-approval requirements slow economic development unnecessarily. Data centers are seen as valuable infrastructure that generates tax revenue and jobs.',
  example_perspectives = ARRAY[
    'An economic development official focused on attracting business investment may see streamlined permitting as necessary to remain competitive with other regions.',
    'A technology professional who sees data infrastructure as foundational to a modern economy may view regulatory friction as counterproductive.',
    'A local official who values the tax base generated by large commercial facilities may support a disclosure-first approach over restrictive pre-conditions.'
  ]
WHERE topic_id = '4559b513-0fd8-4ed1-babd-f3b554162f40' AND value = 4;

UPDATE inform.compass_stances SET
  description = 'This stance holds that data center investment should be actively welcomed and that regulatory barriers should be minimized to attract the economic activity these facilities bring. Proponents argue that data center growth generates substantial tax revenue, employment, and regional economic development that benefits all residents. Market and regulatory forces over time will address any energy impacts, and government intervention risks driving investment elsewhere.',
  example_perspectives = ARRAY[
    'A landowner or developer who sees data center projects as major economic opportunities may favor policies that attract rather than deter that investment.',
    'A voter in an area with limited private-sector investment may see welcoming data centers as one of the most practical paths to local economic growth.',
    'Someone who generally believes market forces allocate resources better than government mandates may see minimal regulation as the default stance absent proven harm.'
  ]
WHERE topic_id = '4559b513-0fd8-4ed1-babd-f3b554162f40' AND value = 5;

-- Topic: Tax Rates - Wealth (45ca4740-a861-4c8c-b3b5-0a49cf953501)
UPDATE inform.compass_stances SET
  description = 'This stance holds that wealth concentration at the top of the income distribution has reached a point where significantly higher taxes on high earners and large corporations are both economically sound and necessary to fund essential public services. Proponents argue that current tax rates allow accumulation of economic and political power that undermines fairness. Higher taxes on wealth are seen as a corrective mechanism for structural imbalances.',
  example_perspectives = ARRAY[
    'A worker who has seen wages stagnate while corporate profits and executive compensation grow may view higher corporate taxes as a rebalancing of economic gains.',
    'A public health or education advocate who sees funding shortfalls limiting service quality may see higher taxes on wealth as the most available revenue source.',
    'An economist who studies wealth inequality and its effects on economic mobility may see higher marginal rates as consistent with evidence on opportunity and growth.'
  ]
WHERE topic_id = '45ca4740-a861-4c8c-b3b5-0a49cf953501' AND value = 1;

UPDATE inform.compass_stances SET
  description = 'This stance supports modest increases in tax rates for high earners while protecting the current rates that apply to middle-income households. It holds that those with the highest incomes can absorb a modest increase without significant economic harm while generating revenue for services that benefit a broader population. The goal is targeted adjustment rather than broad restructuring of the tax code.',
  example_perspectives = ARRAY[
    'A middle-income household that would not be affected by the increase may support it as a way to fund services they use without raising their own burden.',
    'A fiscal analyst who believes targeted rate adjustments on top earners are the path of least economic disruption may favor this measured approach.',
    'A voter who wants government to function well but opposes broad tax increases may see this as a proportionate response to specific revenue needs.'
  ]
WHERE topic_id = '45ca4740-a861-4c8c-b3b5-0a49cf953501' AND value = 2;

UPDATE inform.compass_stances SET
  description = 'This stance holds that current tax rates are broadly appropriate and that the priority should be eliminating loopholes, special carve-outs, and deductions that allow some high earners and corporations to pay significantly less than the stated rate. It argues that equal enforcement of existing rules would generate substantial revenue without raising rates on anyone. Tax simplification and consistent application are seen as more durable than rate changes.',
  example_perspectives = ARRAY[
    'A citizen who believes that closing loopholes is more equitable than raising rates may see this as ensuring that everyone actually pays what the law requires.',
    'A business owner who pays the stated tax rate and competes with firms that exploit loopholes may support eliminating preferential treatment.',
    'A tax policy analyst who believes effective rates matter more than statutory rates may focus on enforcement and loophole closure as the highest-impact reform.'
  ]
WHERE topic_id = '45ca4740-a861-4c8c-b3b5-0a49cf953501' AND value = 3;

UPDATE inform.compass_stances SET
  description = 'This stance holds that lower tax rates across all income levels stimulate economic activity, investment, and job creation in ways that produce broad benefits over time. Proponents argue that allowing individuals and businesses to retain more of their earnings leads to productive private-sector investment that grows the overall economic base. Tax reduction is seen as a tool for expanding prosperity rather than simply benefiting those at the top.',
  example_perspectives = ARRAY[
    'A small business owner who believes retaining more earnings would allow them to hire more staff or invest in expansion may favor broad rate reductions.',
    'An investor who believes lower capital gains taxes encourage risk-taking and productive investment may see rate cuts as pro-growth.',
    'Someone who fundamentally believes individuals and private actors allocate resources more efficiently than government may see lower taxes as desirable in principle.'
  ]
WHERE topic_id = '45ca4740-a861-4c8c-b3b5-0a49cf953501' AND value = 4;

UPDATE inform.compass_stances SET
  description = 'This stance holds that the current tax burden is fundamentally too high and that a flat rate applied uniformly to all income levels is both fairer and more economically productive than a progressive structure. Proponents argue that a flat tax eliminates complexity, removes disincentives to earn more, and treats all citizens as equals before the law. Drastic reduction in tax rates is seen as essential to restoring economic dynamism.',
  example_perspectives = ARRAY[
    'Someone who believes that progressive tax structures penalize success and distort incentives may see a flat tax as both fairer and more efficient.',
    'An entrepreneur who has watched high marginal rates reduce the return on building a successful enterprise may favor a dramatic simplification and reduction.',
    'A voter who believes that a smaller tax footprint leads to a more productive and freer society may see drastic cuts as an expression of core values about the proper role of government.'
  ]
WHERE topic_id = '45ca4740-a861-4c8c-b3b5-0a49cf953501' AND value = 5;

-- Topic: Redistricting (48cc9585-ec22-4f53-8d42-6839828dd36f)
UPDATE inform.compass_stances SET
  description = 'This stance holds that elected officials have an inherent conflict of interest when drawing the districts that determine their own electoral futures, and that only citizens with no connection to elected office or parties can produce fair maps. Independent citizen commissions are seen as the structural solution that removes self-interest from the process entirely. Proponents argue this is the only way to ensure districts reflect communities rather than political calculations.',
  example_perspectives = ARRAY[
    'A voter who has watched politicians draw districts that protect incumbents rather than communities may see citizen commissions as the only trustworthy alternative.',
    'A good-government advocate who believes structural conflicts of interest require structural solutions may see removing elected officials entirely as the necessary reform.',
    'A civics educator who values democratic legitimacy may see independent commissions as essential to public trust in the electoral process.'
  ]
WHERE topic_id = '48cc9585-ec22-4f53-8d42-6839828dd36f' AND value = 1;

UPDATE inform.compass_stances SET
  description = 'This stance supports commissions that operate independently of the legislature but include balanced representation from the major political parties to ensure that both large blocs of voters have a voice in the process. It holds that purely citizen commissions without any party representation may not reflect the actual political landscape. Equal-party representation on an independent body is seen as a practical compromise between partisan control and pure independence.',
  example_perspectives = ARRAY[
    'A voter who trusts neither party to draw fair maps on its own but wants both represented in the oversight process may see this as a reasonable middle path.',
    'A political scientist who studies electoral systems may see balanced commission membership as a workable check on extreme partisan manipulation.',
    'A community organizer who wants redistricting input from people knowledgeable about how parties operate may favor this model over purely non-partisan selection.'
  ]
WHERE topic_id = '48cc9585-ec22-4f53-8d42-6839828dd36f' AND value = 2;

UPDATE inform.compass_stances SET
  description = 'This stance holds that elected legislators, who are accountable to voters, should retain primary responsibility for redistricting but must operate under strict procedural rules—including supermajority thresholds—that prevent one party from acting unilaterally. Bipartisan legislative committees with mandatory supermajority approval force negotiation and compromise between opposing sides. Proponents argue accountability to voters is an important check that independent commissions lack.',
  example_perspectives = ARRAY[
    'A lawmaker who believes elected officials should remain accountable for major governmental decisions may see legislative redistricting with supermajority rules as appropriately democratic.',
    'A political analyst who believes cross-party negotiation produces more durable district maps may favor requiring bipartisan agreement before any map can pass.',
    'A voter who prefers accountability through elections over expert or citizen panels may see legislative commissions with strict rules as the right compromise.'
  ]
WHERE topic_id = '48cc9585-ec22-4f53-8d42-6839828dd36f' AND value = 3;

UPDATE inform.compass_stances SET
  description = 'This stance holds that state legislatures, as democratically elected bodies, are the appropriate institution to handle redistricting, with courts serving as a backstop to prevent extreme maps that clearly violate legal standards. It holds that court review provides sufficient protection against the most egregious gerrymanders while preserving legislative authority. Proponents value the democratic legitimacy of legislative decision-making over technocratic alternatives.',
  example_perspectives = ARRAY[
    'A lawmaker who believes elected representatives should retain core governmental functions like redistricting may favor this approach with judicial oversight as a check.',
    'A legal scholar who believes courts are the appropriate corrective mechanism for constitutional violations—rather than preventive structural changes—may support this framework.',
    'A voter who trusts the judicial system more than technocratic commissions to catch genuine abuses may see court oversight as sufficient protection.'
  ]
WHERE topic_id = '48cc9585-ec22-4f53-8d42-6839828dd36f' AND value = 4;

UPDATE inform.compass_stances SET
  description = 'This stance holds that the party that wins a state legislative majority has earned the right to draw district lines as part of governing, and that redistricting is a legitimate exercise of political power won at the ballot box. Proponents argue that voters know that legislative control includes redistricting authority and can exercise that judgment at the next election. Outside interference from courts or commissions is seen as undermining democratic results.',
  example_perspectives = ARRAY[
    'A voter in the majority party who sees electoral victory as conferring the right to govern—including redistricting—may view current arrangements as simply democracy working as designed.',
    'A political strategist who views redistricting as an inherent tool of governance may see efforts to constrain it as weakening legitimate political authority.',
    'Someone who is skeptical of unelected commissions or courts overriding elected majorities may prefer that the winning party exercise this power without external interference.'
  ]
WHERE topic_id = '48cc9585-ec22-4f53-8d42-6839828dd36f' AND value = 5;

-- Topic: Homeless / Public Sleeping (4938766b-b45a-46e3-93bd-b8b30651271a)
UPDATE inform.compass_stances SET
  description = 'This stance holds that criminalizing homelessness punishes people for lacking housing rather than addressing its causes, and that enforcement resources would produce better outcomes if redirected to permanent supportive housing and mental health services. Proponents argue that policing the act of sleeping in public does not reduce homelessness—it displaces it—while consuming resources that could fund lasting solutions. The right to be in public space without criminal sanction is seen as fundamental.',
  example_perspectives = ARRAY[
    'A social worker who has watched encampment sweeps displace the same people repeatedly without reducing their numbers may see enforcement as an ineffective and costly non-solution.',
    'A person who has experienced homelessness and lost possessions, documents, or medication during a sweep may view enforcement as deepening the crisis rather than resolving it.',
    'A housing advocate who tracks the costs of emergency services used by the unhoused may see permanent supportive housing as dramatically cheaper than repeated enforcement cycles.'
  ]
WHERE topic_id = '4938766b-b45a-46e3-93bd-b8b30651271a' AND value = 1;

UPDATE inform.compass_stances SET
  description = 'This stance holds that people should not face criminal penalties for sleeping in public but that cities have an obligation to actively offer shelter, outreach, and service connections. Decriminalization is paired with real investment in alternatives so that the absence of enforcement does not mean the absence of support. Proponents see voluntary service connections—not compulsion or criminalization—as the path to reducing both homelessness and its visible public presence.',
  example_perspectives = ARRAY[
    'A public health professional who sees shelter and outreach as more effective than criminal citations in connecting people to services may favor this investment-focused approach.',
    'A civil liberties advocate who opposes criminalizing the status of being homeless may support removing criminal penalties while still building shelter capacity.',
    'A city resident who wants homelessness reduced through lasting solutions rather than displacement to another neighborhood may see this as a more durable approach.'
  ]
WHERE topic_id = '4938766b-b45a-46e3-93bd-b8b30651271a' AND value = 2;

UPDATE inform.compass_stances SET
  description = 'This stance holds that enforcement of public camping rules is appropriate only when adequate shelter space is actually available as an alternative, and that citations should divert people to services rather than into the criminal justice system. It rejects both the idea that sleeping in public should always be permitted and the idea that enforcement is appropriate when no real alternative exists. The availability of shelter is a precondition for enforcement legitimacy.',
  example_perspectives = ARRAY[
    'A municipal attorney who has read the Grants Pass Supreme Court decision may see shelter-availability as the legally required precondition for enforcement.',
    'A city council member trying to respond to both business district concerns and the rights of unhoused residents may see conditional enforcement as the only defensible policy.',
    'A community member who supports both accountability and compassion may find this conditionality to be the most principled balance.'
  ]
WHERE topic_id = '4938766b-b45a-46e3-93bd-b8b30651271a' AND value = 3;

UPDATE inform.compass_stances SET
  description = 'This stance holds that public property should not serve as permanent encampment sites and that prohibitions on camping must be enforced, but that jurisdictions have an obligation to maintain basic shelter capacity. Graduated warnings give individuals time to access services before penalties apply, and maintaining some shelter infrastructure ensures enforcement is not purely punitive. Public order and basic safety nets are both seen as necessary.',
  example_perspectives = ARRAY[
    'A business owner whose storefront is adjacent to a long-standing encampment may see clear rules and enforcement as essential to maintaining a viable commercial area.',
    'A resident who walks through affected public spaces regularly may support enforcement that comes with real shelter alternatives rather than pure displacement.',
    'A local official who believes both public order and human dignity are achievable may favor graduated enforcement that gives individuals time and options before penalties.'
  ]
WHERE topic_id = '4938766b-b45a-46e3-93bd-b8b30651271a' AND value = 4;

UPDATE inform.compass_stances SET
  description = 'This stance holds that public camping and sleeping should be prohibited with meaningful criminal penalties because public spaces must remain accessible and safe for all residents, and existing social services are available to those who seek help. Proponents argue that tolerating encampments harms neighborhoods, deters other residents from using public spaces, and ultimately does not serve those experiencing homelessness. Firm enforcement is seen as necessary to maintain order and deter further encampment growth.',
  example_perspectives = ARRAY[
    'A parent who avoids taking children through certain public areas due to encampment conditions may see firm enforcement as restoring access to shared public space.',
    'A voter who believes government''s first obligation is maintaining safe and usable public infrastructure may see camping bans as a core public order function.',
    'A resident who believes the existence of social services means there is no need to tolerate encampments in public may support enforcement as consistent with available alternatives.'
  ]
WHERE topic_id = '4938766b-b45a-46e3-93bd-b8b30651271a' AND value = 5;

-- Topic: Immigration + Public Services (4e2c69ce-591e-4197-9cd5-7aceff79d390)
UPDATE inform.compass_stances SET
  description = 'This stance holds that immigration is broadly beneficial and that access to public services should not be conditioned on immigration status. Proponents argue that denying services to residents—regardless of status—produces worse public health, education, and safety outcomes for entire communities. Making legal immigration easier and ensuring all residents can access services is seen as both humane and practically sound.',
  example_perspectives = ARRAY[
    'A public health worker who sees uninsured, undocumented patients presenting with preventable conditions may believe early intervention regardless of status is cheaper and more humane.',
    'A school administrator whose district includes many immigrant families may see service access for all students as essential to educational outcomes.',
    'Someone whose own family immigrated and benefited from public services during a vulnerable period may see denying those same resources to others as inconsistent with national values.'
  ]
WHERE topic_id = '4e2c69ce-591e-4197-9cd5-7aceff79d390' AND value = 1;

UPDATE inform.compass_stances SET
  description = 'This stance supports keeping legal immigration pathways open and broad while allowing most residents—regardless of immigration status—to access public services for practical community-wellbeing reasons. It holds that isolating portions of the population from services degrades community health and safety for everyone. Legal immigration remains valued, and status restrictions on services are seen as counterproductive rather than principled.',
  example_perspectives = ARRAY[
    'A local official managing public health infrastructure who understands that communicable disease does not check immigration status may see broad service access as a public safety matter.',
    'A business owner who employs immigrants and relies on a healthy, educated workforce may see access to services as a community investment that benefits employers.',
    'A neighbor who interacts daily with undocumented families and sees them as contributing community members may support service access regardless of legal status.'
  ]
WHERE topic_id = '4e2c69ce-591e-4197-9cd5-7aceff79d390' AND value = 2;

UPDATE inform.compass_stances SET
  description = 'This stance holds that current immigration levels and the current framework for service eligibility—tying most benefits to lawful status—represent a reasonable equilibrium that should be maintained rather than significantly expanded or contracted. It does not call for new restrictions or new expansions, viewing the current system as an imperfect but workable balance between openness and orderly management of flows.',
  example_perspectives = ARRAY[
    'A voter who is broadly satisfied with existing immigration policy and wants stability rather than disruption in either direction may hold this position.',
    'An administrator managing programs tied to lawful status may see the current eligibility framework as workable and prefer incremental refinement over structural change.',
    'A community member who sees immigration as broadly positive but is uncertain about the fiscal effects of expanding service eligibility may favor maintaining the status quo while gathering more data.'
  ]
WHERE topic_id = '4e2c69ce-591e-4197-9cd5-7aceff79d390' AND value = 3;

UPDATE inform.compass_stances SET
  description = 'This stance holds that legal immigration pathways should be more selective and that public services should be available only to those with documented legal status. Proponents argue that expanding service access to undocumented residents imposes costs on taxpayers and creates incentives for unauthorized entry. They support legal immigration as a managed, orderly process and see service restrictions as necessary to uphold that distinction.',
  example_perspectives = ARRAY[
    'A taxpayer who believes public benefits should be a return on legal participation in the system may see restricting services to lawful residents as a matter of fairness.',
    'Someone who immigrated legally and waited years to access full benefits may view service parity for undocumented residents as undercutting the value of following legal pathways.',
    'A voter concerned about long-term fiscal sustainability may favor limiting service expansion to those who have entered through legal channels.'
  ]
WHERE topic_id = '4e2c69ce-591e-4197-9cd5-7aceff79d390' AND value = 4;

UPDATE inform.compass_stances SET
  description = 'This stance holds that immigration levels should be reduced substantially and that public services should be available only to those with legal status, as a means of both reducing fiscal strain and reinforcing clear boundaries between lawful and unauthorized presence. Proponents see lower immigration and stricter service limits as necessary to protect wages, public resources, and the integrity of the legal immigration system. They view current levels as unsustainable.',
  example_perspectives = ARRAY[
    'A worker in a sector with high immigrant labor participation who is concerned about wage competition may see reduced immigration levels as economically protective.',
    'A fiscal watchdog focused on long-term program sustainability may see service restrictions as necessary to keep public commitments affordable.',
    'A voter who believes the primary obligation of government is to citizens and legal residents may see reduced immigration and strict service limits as consistent with that principle.'
  ]
WHERE topic_id = '4e2c69ce-591e-4197-9cd5-7aceff79d390' AND value = 5;

-- Topic: AI Regulation - Liability/Disclosure (666bf03d-81fc-4138-ab15-69ae734c9023)
UPDATE inform.compass_stances SET
  description = 'This stance holds that AI development benefits from the freedom to experiment and iterate rapidly, and that government regulation before harms are demonstrated stifles innovation. Proponents argue that industry self-governance and competitive market pressure will produce the right incentives for responsible AI development. Premature regulation risks locking in current approaches and putting U.S. companies at a disadvantage relative to less-regulated international competitors.',
  example_perspectives = ARRAY[
    'A technology entrepreneur building AI-powered products may see regulatory constraints as slowing down the development cycle without addressing actual, proven harms.',
    'An investor in AI startups may believe regulation creates barriers to entry that entrench large incumbents while preventing new approaches from emerging.',
    'A researcher who believes AI''s benefits—in medicine, climate, and productivity—are best unlocked by removing friction may favor a permissive development environment.'
  ]
WHERE topic_id = '666bf03d-81fc-4138-ab15-69ae734c9023' AND value = 1;

UPDATE inform.compass_stances SET
  description = 'This stance supports developing voluntary safety guidelines and industry standards while stopping short of mandatory regulation, allowing companies to adopt best practices at their own pace. Proponents believe that the AI field is moving too fast for rigid regulation and that voluntary frameworks can be updated more flexibly as the technology evolves. They see government''s role as convening and guiding, not mandating.',
  example_perspectives = ARRAY[
    'A technology policy professional who has seen rigid regulations outlast the problems they were designed to solve may favor flexible voluntary standards over statutory requirements.',
    'A company executive who wants to demonstrate responsibility without being bound by regulations written before the technology is fully understood may prefer voluntary commitments.',
    'A researcher who believes that well-designed voluntary frameworks can achieve compliance rates comparable to regulation without the rigidity may favor this approach.'
  ]
WHERE topic_id = '666bf03d-81fc-4138-ab15-69ae734c9023' AND value = 2;

UPDATE inform.compass_stances SET
  description = 'This stance holds that AI developers should be legally required to disclose known risks associated with their systems and be held liable when those systems cause documented harm. It applies standard product liability principles to AI: if a company knows a system poses risks and deploys it anyway, they bear responsibility for the consequences. Proponents argue that liability and disclosure requirements already apply to most products and there is no principled reason AI should be exempt.',
  example_perspectives = ARRAY[
    'A consumer advocate who believes product liability is a foundational protection may see no reason AI systems should be exempt from standard accountability rules.',
    'A person who was harmed by a biased AI hiring or lending tool may feel that without liability, companies have no financial incentive to fix known flaws.',
    'A legal professional who specializes in product liability may see existing tort law frameworks as naturally applicable to AI systems that cause measurable harm.'
  ]
WHERE topic_id = '666bf03d-81fc-4138-ab15-69ae734c9023' AND value = 3;

UPDATE inform.compass_stances SET
  description = 'This stance holds that high-risk applications of AI—in hiring, healthcare, lending, and policing—warrant mandatory safety testing before deployment and outright prohibitions in contexts where the risk of harm is particularly high. It does not oppose AI broadly but argues that consequential decisions affecting people''s lives require a higher standard of accountability than other applications. Pre-deployment testing and sector-specific bans are seen as proportionate responses to specific, documented risks.',
  example_perspectives = ARRAY[
    'A healthcare worker who would be subject to AI-assisted triage or diagnostic decisions may want mandatory safety testing before those systems are used in clinical settings.',
    'A job applicant who has been evaluated by an AI screening tool with no transparency or appeal process may support mandatory testing and sector bans where errors are especially consequential.',
    'A civil rights attorney who tracks discriminatory outcomes in AI hiring and lending tools may see mandatory testing as the minimum necessary to prevent systemic harm at scale.'
  ]
WHERE topic_id = '666bf03d-81fc-4138-ab15-69ae734c9023' AND value = 4;

UPDATE inform.compass_stances SET
  description = 'This stance holds that AI systems capable of causing serious harm should require explicit government approval before deployment and that some categories of AI application are too dangerous to permit at all. Proponents argue that the pace of AI development has outrun society''s ability to understand and manage its risks, and that a precautionary framework with strict approval requirements is the only responsible approach. The potential for catastrophic misuse justifies treating AI as a highly regulated industry.',
  example_perspectives = ARRAY[
    'A safety researcher focused on worst-case AI failure scenarios may believe that strict pre-approval requirements are the only reliable way to prevent catastrophic outcomes.',
    'A policymaker who has watched other powerful technologies—nuclear, biotechnology—require stringent regulation may see a strict approval framework as the appropriate historical analogy.',
    'A citizen deeply concerned about autonomous systems making decisions in warfare, criminal justice, or critical infrastructure may want government review before any such systems are deployed.'
  ]
WHERE topic_id = '666bf03d-81fc-4138-ab15-69ae734c9023' AND value = 5;
