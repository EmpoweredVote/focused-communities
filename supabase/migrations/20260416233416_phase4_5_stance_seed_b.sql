-- Phase 4.5 Seed B: authored content for topics 11-16 (values-based, no partisan labels)

-- Topic: Housing Supply (669cac97-66a6-4087-b036-936fbe62efb3)
UPDATE inform.compass_stances SET
  description = 'This stance holds that the private housing market has failed to provide adequate housing at prices most people can afford and that direct government construction and operation of public housing is the only reliable path to universal access. Proponents argue that subsidizing private developers or relying on market incentives produces insufficient and unevenly distributed supply. Public housing operated as a social good rather than a profit center is seen as the solution.',
  example_perspectives = ARRAY[
    'A low-income renter who has been displaced by rising costs may see direct government housing provision as the only mechanism that removes profit motive from the equation.',
    'A housing policy researcher who has studied the limits of market responses to housing shortages may see public construction as the most direct tool for guaranteed supply.',
    'Someone who views stable housing as a social foundation similar to public education may believe it warrants the same direct public provision model.'
  ]
WHERE topic_id = '669cac97-66a6-4087-b036-936fbe62efb3' AND value = 1;

UPDATE inform.compass_stances SET
  description = 'This stance holds that rent caps and inclusionary zoning requirements on new developments, combined with public funding for affordable housing construction, can achieve broad affordability without replacing the private market. Proponents see a combination of price controls and public investment as necessary to prevent displacement while adding supply. Market dynamics alone are seen as insufficient without active intervention to ensure affordability.',
  example_perspectives = ARRAY[
    'A renter in a neighborhood experiencing rapid gentrification may see rent caps as the most immediate protection against displacement while new affordable units are built.',
    'A community organizer focused on keeping long-term residents in their neighborhoods may support a combination of supply expansion and price controls.',
    'A housing nonprofit professional who works with both subsidy programs and private developers may see this hybrid approach as the most realistic path to meaningful affordability.'
  ]
WHERE topic_id = '669cac97-66a6-4087-b036-936fbe62efb3' AND value = 2;

UPDATE inform.compass_stances SET
  description = 'This stance supports a mix of subsidies for affordable housing projects, down payment assistance for first-time buyers, and zoning reforms to reduce barriers to new construction. It holds that targeted interventions at different points in the housing market can improve affordability without requiring wholesale restructuring. Proponents see this as a practical set of tools that works within existing market structures while addressing specific affordability gaps.',
  example_perspectives = ARRAY[
    'A first-generation homebuyer who needs down payment assistance to enter the market may support targeted programs that make ownership accessible without broader market disruption.',
    'A policymaker looking for interventions with proven track records may favor a portfolio of tested tools over structural overhauls.',
    'A community development professional who works within the existing zoning and finance system may see permit simplification and targeted subsidies as achievable near-term improvements.'
  ]
WHERE topic_id = '669cac97-66a6-4087-b036-936fbe62efb3' AND value = 3;

UPDATE inform.compass_stances SET
  description = 'This stance holds that restrictive zoning regulations—single-family-only zones, minimum lot sizes, height limits, parking minimums—are the primary driver of housing scarcity and that removing these barriers will allow private developers to build enough supply to reduce prices. Proponents argue that deregulation produces more housing at all price points faster and more efficiently than subsidy programs. The goal is to let the market respond to demand without artificial constraints.',
  example_perspectives = ARRAY[
    'A developer who wants to build denser housing but is blocked by local zoning restrictions may see deregulation as the fastest path to adding units.',
    'An economist who studies supply-demand dynamics in housing markets may see restrictive zoning as the primary cause of price inflation and deregulation as the most effective remedy.',
    'A homeowner who believes the neighborhood has grown unaffordable for their children may support upzoning and regulatory reduction to create more options.'
  ]
WHERE topic_id = '669cac97-66a6-4087-b036-936fbe62efb3' AND value = 4;

UPDATE inform.compass_stances SET
  description = 'This stance holds that housing prices and supply are best determined by market forces without government intervention, and that subsidy programs and rent controls create inefficiencies and distortions that ultimately worsen affordability. Proponents argue that markets, when not constrained by regulation, will produce the housing that people actually demand at prices they can afford. Government involvement is seen as the problem rather than the solution.',
  example_perspectives = ARRAY[
    'A property rights advocate who believes government interference in housing markets consistently produces worse outcomes than voluntary transactions may hold this position on principle.',
    'An investor who has seen rent control lead to housing deterioration and reduced supply in other cities may believe market-based pricing produces better-maintained and more abundant housing.',
    'Someone who believes subsidy programs primarily benefit developers and bureaucracies while failing actual households may favor complete government withdrawal from housing markets.'
  ]
WHERE topic_id = '669cac97-66a6-4087-b036-936fbe62efb3' AND value = 5;

-- Topic: Tariffs / Trade Policy (683c8084-2281-4920-a07c-18439b2dd413)
UPDATE inform.compass_stances SET
  description = 'This stance holds that free trade without tariffs produces maximum economic efficiency, lower consumer prices, and global prosperity through comparative advantage. Proponents argue that tariffs are ultimately taxes on domestic consumers and that protectionist policies cost more jobs in import-dependent industries than they save in protected ones. International trade agreements and tariff elimination are seen as paths to shared global growth.',
  example_perspectives = ARRAY[
    'A consumer goods retailer who imports most inventory may see tariff elimination as directly reducing costs passed on to customers.',
    'An economist who studies trade theory may see free trade as the evidence-based path to economic growth and lower prices for households.',
    'A port worker or logistics professional whose livelihood depends on international trade volume may see tariff reductions as essential to their sector''s health.'
  ]
WHERE topic_id = '683c8084-2281-4920-a07c-18439b2dd413' AND value = 1;

UPDATE inform.compass_stances SET
  description = 'This stance supports broad tariff reduction while maintaining targeted tariffs on products whose production causes significant environmental harm or exploits labor standards far below U.S. norms. Proponents argue that free trade should not come at the cost of racing to the bottom on environmental and labor protections. Most tariffs are seen as inefficient taxes, but some selective tariffs aligned with sustainability goals are justified.',
  example_perspectives = ARRAY[
    'An environmental advocate who believes carbon-intensive imports undercut domestic producers who comply with environmental rules may support targeted tariffs on high-emission goods.',
    'A union worker whose industry competes with goods made under unsafe conditions may support tariffs as a labor standards enforcement tool.',
    'A trade policy professional who sees sustainability-linked tariffs as consistent with international trade law and values may favor this selective approach.'
  ]
WHERE topic_id = '683c8084-2281-4920-a07c-18439b2dd413' AND value = 2;

UPDATE inform.compass_stances SET
  description = 'This stance holds that tariffs are a legitimate policy tool for protecting industries and jobs that are strategically important or that face unfair competition from abroad, while broad free trade should otherwise be the default. Proponents see selective tariffs as a way to preserve manufacturing capacity, rural agricultural sectors, or defense-critical industries that might otherwise be vulnerable to foreign undercutting. A strategic rather than blanket approach to tariffs is the goal.',
  example_perspectives = ARRAY[
    'A worker in a manufacturing sector that has seen domestic plant closures driven by lower-cost foreign competition may see targeted tariffs as protecting their job and community.',
    'A national security analyst who tracks domestic production capacity for defense-critical materials may support tariffs that preserve industries deemed essential.',
    'A farmer competing with heavily subsidized foreign agricultural products may see protective tariffs as a necessary leveling mechanism.'
  ]
WHERE topic_id = '683c8084-2281-4920-a07c-18439b2dd413' AND value = 3;

UPDATE inform.compass_stances SET
  description = 'This stance holds that countries which use unfair trade practices—subsidizing exports, manipulating currencies, or blocking American goods—should face retaliatory tariffs until they adopt fairer rules. Proponents argue that unilateral free trade in the face of unfair foreign competition is not free trade at all—it is a subsidy to cheating. Tariffs on specific unfair-trading partners are seen as a negotiating tool to achieve more balanced outcomes.',
  example_perspectives = ARRAY[
    'A manufacturer who has watched domestic market share erode due to foreign competitors receiving government subsidies may see retaliatory tariffs as the most direct corrective.',
    'A trade negotiator who believes leverage through tariffs is necessary to achieve reciprocal market access may see targeted tariffs as essential to effective diplomacy.',
    'A worker in an industry facing dumping—where foreign producers sell below cost to capture market share—may see increased tariffs as the only viable defensive tool.'
  ]
WHERE topic_id = '683c8084-2281-4920-a07c-18439b2dd413' AND value = 4;

UPDATE inform.compass_stances SET
  description = 'This stance holds that broad tariffs on all imports are the most effective tool for rebuilding domestic manufacturing capacity and reducing trade deficits that represent genuine economic losses. Proponents argue that decades of low tariffs hollowed out American industrial communities and that comprehensive tariffs are necessary to reverse that trend. They view self-sufficiency in key industries as a national security and economic resilience priority.',
  example_perspectives = ARRAY[
    'A resident of a former manufacturing community who has seen decades of industrial decline may see broad tariffs as the only policy strong enough to reverse the trajectory.',
    'Someone who believes national self-sufficiency in manufacturing is essential to security and resilience may view comprehensive tariffs as an investment in strategic independence.',
    'A worker who believes that lower-priced imports come with hidden costs—unemployment, community decline, reduced tax base—may see tariffs as pricing those costs honestly.'
  ]
WHERE topic_id = '683c8084-2281-4920-a07c-18439b2dd413' AND value = 5;

-- Topic: Religious Freedom (6b9ba6d9-1001-43f5-b073-4d37130696fd)
UPDATE inform.compass_stances SET
  description = 'This stance holds that public institutions must be entirely secular and that religious exemptions from civil rights laws create a two-tiered system in which some people can opt out of laws that everyone else must follow. Proponents argue that allowing religious exemptions in employment, housing, and public accommodation creates legal cover for discrimination. Equal treatment under civil rights law is seen as non-negotiable regardless of the asserted religious basis for non-compliance.',
  example_perspectives = ARRAY[
    'A person who was denied housing or employment based on a religious exemption may see the elimination of such exemptions as essential to their practical equality under law.',
    'A civil rights attorney who has litigated cases where religious exemptions shielded discriminatory practices may view them as incompatible with equal protection principles.',
    'A secularist who believes public institutions should reflect shared civic values rather than any particular religious tradition may favor strict separation in all government contexts.'
  ]
WHERE topic_id = '6b9ba6d9-1001-43f5-b073-4d37130696fd' AND value = 1;

UPDATE inform.compass_stances SET
  description = 'This stance holds that sincere religious beliefs deserve respect and legal protection, but that those protections stop at the point where they override anti-discrimination laws in employment and housing—contexts where people depend on equal access for their basic security. Proponents see religion and civil rights as compatible when both are properly scoped: faith governs religious practice and internal community life, but does not override others'' access to jobs or housing.',
  example_perspectives = ARRAY[
    'A faith leader who supports both religious freedom and equal treatment of employees may see this framework as allowing religious organizations to function while protecting workers.',
    'A renter who relies on fair housing law as protection against discrimination may see employment and housing as contexts where civil rights must take precedence.',
    'Someone who has deep personal faith but also believes in the equal dignity of all people may see this balance as reflecting both values without sacrificing either.'
  ]
WHERE topic_id = '6b9ba6d9-1001-43f5-b073-4d37130696fd' AND value = 2;

UPDATE inform.compass_stances SET
  description = 'This stance holds that both religious freedom and equal civil rights are fundamental values that require ongoing case-by-case balancing rather than a blanket rule favoring one over the other. Courts and legislators must assess specific contexts—the nature of the institution, the type of right at stake, the degree of burden—to reach outcomes that respect both. Proponents see rigid categorical rules as oversimplifying genuinely complex conflicts between important competing rights.',
  example_perspectives = ARRAY[
    'A judge who has presided over religious freedom cases may see fact-specific balancing as the constitutionally required approach rather than categorical rules.',
    'A religious liberty scholar who values both sincere faith expression and nondiscrimination may believe that most conflicts can be resolved through careful analysis without sacrificing either value.',
    'A mediator who works with faith communities and civil rights organizations may see dialogue and tailored solutions as producing more durable outcomes than blanket rules.'
  ]
WHERE topic_id = '6b9ba6d9-1001-43f5-b073-4d37130696fd' AND value = 3;

UPDATE inform.compass_stances SET
  description = 'This stance holds that individuals and organizations should be legally protected when they act in accordance with sincerely held religious beliefs, including in commercial or employment contexts where those beliefs might conflict with anti-discrimination norms. Proponents argue that forcing people to violate their conscience in their professional lives is an infringement on religious freedom that goes beyond what a pluralistic society should require. Religious exemptions are seen as essential to genuine freedom of belief.',
  example_perspectives = ARRAY[
    'A small business owner whose faith shapes their approach to business operations may see compelled participation in activities that violate those beliefs as a genuine burden on their freedom.',
    'A faith community member who believes that religious freedom is hollow if it does not extend to daily life decisions may support broad exemption rights.',
    'A legal scholar who reads the First Amendment''s free exercise clause expansively may see current exemption protections as constitutionally required rather than merely optional.'
  ]
WHERE topic_id = '6b9ba6d9-1001-43f5-b073-4d37130696fd' AND value = 4;

UPDATE inform.compass_stances SET
  description = 'This stance holds that religious freedom is among the most fundamental rights in a free society and that faith-based organizations should have complete autonomy over their internal operations, employment, and mission without government interference or requirements to operate contrary to their beliefs. Proponents argue that religious communities have historically served as vital social institutions and that government-imposed constraints on their operations undermine both their mission and the First Amendment.',
  example_perspectives = ARRAY[
    'A leader of a religious organization whose mission depends on hiring people who share its core beliefs may view government hiring mandates as an existential threat to its organizational identity.',
    'A theologian who believes that authentic religious community requires internal governance according to faith principles may oppose any government role in those decisions.',
    'A person whose church, mosque, or synagogue provides essential community services and who fears those services would be curtailed by compliance burdens may support full organizational autonomy.'
  ]
WHERE topic_id = '6b9ba6d9-1001-43f5-b073-4d37130696fd' AND value = 5;

-- Topic: Deportation / Citizenship Paths (83eeb217-0289-47df-bde9-c53866b5b3e9)
UPDATE inform.compass_stances SET
  description = 'This stance holds that deporting people who have built their lives in the United States causes irreversible harm to individuals, families, and communities and that the appropriate response to long-term undocumented presence is a pathway to legal status. Proponents argue that enforcement focuses resources on the wrong problem and that the better outcome—for society and for those affected—is regularization rather than removal.',
  example_perspectives = ARRAY[
    'A community health worker whose patients include long-term undocumented residents may see deportation as severing years of established care relationships with serious health consequences.',
    'A member of a family in which some members are citizens and others are undocumented may see deportation stops as essential to keeping families intact.',
    'An immigration attorney who has worked on cases where deportation separated parents from U.S.-born children may view citizenship pathways as the humane and practical alternative.'
  ]
WHERE topic_id = '83eeb217-0289-47df-bde9-c53866b5b3e9' AND value = 1;

UPDATE inform.compass_stances SET
  description = 'This stance holds that deportation resources should be focused on those who have committed serious violent crimes, while others—regardless of immigration status—should have pathways to legal residency rather than face removal. It argues that broad enforcement sweeps harm communities and consume resources that could be better used for genuine public safety threats. Legal status pathways for those without serious criminal records are seen as both more humane and more effective.',
  example_perspectives = ARRAY[
    'A police chief who relies on immigrant community cooperation to solve crimes may see targeted enforcement as protecting the relationships that make neighborhoods safer.',
    'An employer whose workforce includes long-term employees without documentation may favor policies that create legal status rather than disrupt stable employment relationships.',
    'A voter who distinguishes between public safety threats and people who are contributing community members may support this enforcement prioritization.'
  ]
WHERE topic_id = '83eeb217-0289-47df-bde9-c53866b5b3e9' AND value = 2;

UPDATE inform.compass_stances SET
  description = 'This stance draws a distinction between people who recently crossed the border without authorization and those who have lived in the country for years and established deep community roots. It holds that recency and duration of residence are morally relevant factors—recent crossings represent an active choice to evade current law, while long-term presence has created genuine community bonds and dependencies. Legal status pathways for long-term residents alongside enforcement for recent crossers is seen as a principled distinction.',
  example_perspectives = ARRAY[
    'A community leader who sees decades-long residents as integral parts of the social fabric may support status pathways for them while accepting enforcement at the border.',
    'A policymaker looking for a distinction that is both legally grounded and politically sustainable may see tenure as a meaningful and defensible line.',
    'A humanitarian who recognizes that someone who arrived twenty years ago has a qualitatively different relationship to the community than someone who arrived last month may find this tiered approach just.'
  ]
WHERE topic_id = '83eeb217-0289-47df-bde9-c53866b5b3e9' AND value = 3;

UPDATE inform.compass_stances SET
  description = 'This stance holds that all people without legal immigration status should ultimately be removed, but that prioritizing cases by criminal history makes practical use of limited enforcement resources while maintaining the principle that unauthorized presence is not acceptable. Proponents see this as an orderly application of existing law rather than a departure from it—the priority order reflects resource constraints, not a partial amnesty.',
  example_perspectives = ARRAY[
    'A law enforcement professional who has to allocate deportation resources efficiently may see prioritizing criminal cases as a practical necessity that still upholds the law.',
    'A voter who supports the rule of law in immigration but accepts that resource limits require sequencing may see criminal-priority enforcement as the responsible approach.',
    'Someone who immigrated legally and wants enforcement to be consistent but understands that it must be sequenced may see this as a pragmatic implementation of the underlying principle.'
  ]
WHERE topic_id = '83eeb217-0289-47df-bde9-c53866b5b3e9' AND value = 4;

UPDATE inform.compass_stances SET
  description = 'This stance holds that immigration law must be applied immediately and universally regardless of how long someone has been in the country or what family ties they have formed. Proponents argue that creating exceptions based on tenure or family circumstances makes enforcement impossible and signals that unauthorized presence will eventually be overlooked. Consistent enforcement without exceptions is seen as necessary to restore credibility to the immigration system and deter future unauthorized entry.',
  example_perspectives = ARRAY[
    'A border official who has watched selective enforcement cycles create repeated waves of unauthorized crossing may see universal enforcement as the only credible deterrent.',
    'A voter who believes the pattern of limited enforcement followed by amnesties has perpetuated the problem may see immediate and universal deportation as the only way to break that cycle.',
    'Someone who views immigration law as fundamentally no different from other laws—which must be enforced consistently to have meaning—may hold this as a matter of legal principle.'
  ]
WHERE topic_id = '83eeb217-0289-47df-bde9-c53866b5b3e9' AND value = 5;

-- Topic: Social Security (87d20824-a6e9-407b-983c-65440084a0ab)
UPDATE inform.compass_stances SET
  description = 'This stance holds that Social Security benefits have not kept pace with the actual cost of living for seniors and should be expanded, funded by removing the payroll tax cap that currently exempts high earnings from contribution. Proponents argue that the program''s long-term funding gap is a solvable revenue problem rather than a benefit design problem, and that reducing benefits on those who depend on the program most would cause serious harm. Full funding through expanded contributions is seen as both feasible and fair.',
  example_perspectives = ARRAY[
    'A retiree who relies on Social Security as their primary income and has seen benefit purchasing power erode may support expansion as restoring promised security.',
    'A worker approaching retirement who has contributed their whole career and wants to know the program will be there may support raising the cap to ensure solvency.',
    'An economist who studies the distributional effects of the payroll cap may see its removal as correcting an upward redistribution built into the current structure.'
  ]
WHERE topic_id = '87d20824-a6e9-407b-983c-65440084a0ab' AND value = 1;

UPDATE inform.compass_stances SET
  description = 'This stance supports a targeted benefit increase for lower-income retirees—who depend most heavily on Social Security—combined with modest tax increases on higher earners to fund the improvement. It holds that the program serves its core anti-poverty mission best when benefits are scaled toward those most in need. A combination of revenue increases and modest benefit enhancements is seen as strengthening the program''s long-term health.',
  example_perspectives = ARRAY[
    'A social worker whose elderly clients depend on Social Security as their only meaningful income source may support benefit improvements for the most vulnerable retirees.',
    'A middle-income worker who has other retirement savings may support paying slightly more to ensure the program remains robust for those without other resources.',
    'A policy analyst who tracks poverty rates among elderly Americans and sees Social Security as the primary intervention may support incremental benefit improvements funded by revenue adjustments.'
  ]
WHERE topic_id = '87d20824-a6e9-407b-983c-65440084a0ab' AND value = 2;

UPDATE inform.compass_stances SET
  description = 'This stance holds that Social Security faces a long-term funding shortfall that requires modest adjustments to both the revenue and benefit sides to maintain the program without dramatic changes to either. Proponents see targeted tweaks—closing loopholes, modest benefit adjustments for higher earners, and small revenue changes—as sufficient to achieve long-term solvency without either large benefit cuts or major tax increases.',
  example_perspectives = ARRAY[
    'A fiscal policy analyst who has modeled Social Security''s long-term trajectory may see small, bipartisan adjustments as more sustainable than large structural changes.',
    'A voter who values program stability and predictability above all else may prefer modest adjustments that preserve the basic structure rather than disruptive reforms.',
    'A lawmaker looking for a politically achievable path to program solvency may see shared, modest sacrifices as the most workable formula.'
  ]
WHERE topic_id = '87d20824-a6e9-407b-983c-65440084a0ab' AND value = 3;

UPDATE inform.compass_stances SET
  description = 'This stance holds that adjusting the retirement age upward and reducing benefits for higher-income retirees who do not depend on Social Security for survival is a fiscally responsible path to long-term program solvency. Proponents argue that the retirement age was set when life expectancy was far shorter and that higher earners who have other retirement resources are not the intended core beneficiaries. Means-testing and retirement age adjustment are seen as preserving the program for those who genuinely need it.',
  example_perspectives = ARRAY[
    'A fiscal steward focused on long-term program viability may see retirement age adjustment as reflecting demographic reality rather than a benefit cut.',
    'A higher-income retiree who has substantial private savings may personally accept benefit reductions as reasonable if they protect the program for lower-income beneficiaries.',
    'A policy analyst who studies Social Security''s original anti-poverty mission may see means-testing as refocusing benefits on those for whom the program was primarily designed.'
  ]
WHERE topic_id = '87d20824-a6e9-407b-983c-65440084a0ab' AND value = 4;

UPDATE inform.compass_stances SET
  description = 'This stance holds that individuals should control their own retirement savings through private investment accounts rather than contributing to a government-managed collective pool. Proponents argue that private accounts historically produce better returns than Social Security, create actual assets that can be passed to heirs, and remove government from a role better left to individual financial decision-making. The transition is seen as restoring individual ownership and control over retirement savings.',
  example_perspectives = ARRAY[
    'A younger worker who is skeptical that Social Security will be solvent when they retire may see private accounts as a more reliable path to retirement security.',
    'An investor who believes markets historically outperform government trust funds over long time horizons may see privatization as producing better outcomes for individual retirees.',
    'Someone who values individual autonomy and believes government programs create dependency may see private accounts as restoring personal responsibility for retirement planning.'
  ]
WHERE topic_id = '87d20824-a6e9-407b-983c-65440084a0ab' AND value = 5;

-- Topic: Campaign Finance (92730f69-ae57-401c-8ad1-2d07834a895d)
UPDATE inform.compass_stances SET
  description = 'This stance holds that private money in politics—whether from corporations, individuals, or organizations—systematically distorts policy outcomes in favor of those with wealth and that the only way to restore democratic equality is to fund campaigns entirely through public money with no private contributions. Proponents argue that the current system is a form of legal corruption in which policy access is purchased rather than earned through votes.',
  example_perspectives = ARRAY[
    'A voter who believes their representative votes to serve major donors rather than constituents may see public financing as the only way to realign political incentives with voters.',
    'A small-donor political activist who has seen their contributions dwarfed by large organizational spending may feel that the system structurally disadvantages ordinary citizens.',
    'A democracy reform advocate who studies the correlation between donor interests and legislative outcomes may see public financing as the structural fix that removes the conflict of interest.'
  ]
WHERE topic_id = '92730f69-ae57-401c-8ad1-2d07834a895d' AND value = 1;

UPDATE inform.compass_stances SET
  description = 'This stance holds that corporate donations and large-scale dark money organizations have an outsized influence on elections that distorts democratic representation, and that strict limits on these sources of funding are necessary. It supports continued individual contributions within reasonable limits but targets the most aggregated and anonymous forms of political money as the primary threat to democratic integrity.',
  example_perspectives = ARRAY[
    'A community organizer who has watched corporate-funded campaigns dominate local elections may see limits on large institutional donors as essential to giving individual voices weight.',
    'A journalist who tracks political spending may see dark money organizations—which spend without disclosing donors—as particularly problematic for democratic accountability.',
    'A voter who is concerned that corporations receive policy outcomes that serve shareholders at the expense of workers and communities may support limits on corporate political activity.'
  ]
WHERE topic_id = '92730f69-ae57-401c-8ad1-2d07834a895d' AND value = 2;

UPDATE inform.compass_stances SET
  description = 'This stance holds that voters are entitled to know who is funding political campaigns and that full, real-time disclosure of all political donations is the most important reform regardless of whether spending limits are increased or decreased. Proponents argue that transparency enables voters to evaluate candidates'' financial relationships and make informed decisions, and that disclosure requirements are constitutionally less fraught than spending limits.',
  example_perspectives = ARRAY[
    'A voter who wants to know who is funding the political ads they see may see disclosure requirements as a minimum condition for informed democratic participation.',
    'A journalist whose reporting depends on public campaign finance records may see full disclosure as essential to the accountability function of a free press.',
    'A citizen who believes political spending is a form of speech that should be permitted but publicly visible may see disclosure as the appropriate compromise between free expression and democratic accountability.'
  ]
WHERE topic_id = '92730f69-ae57-401c-8ad1-2d07834a895d' AND value = 3;

UPDATE inform.compass_stances SET
  description = 'This stance holds that political spending is a form of protected speech and that current restrictions infringe on the constitutional right to participate in the political process by contributing money. Proponents argue that political donations and expenditures are how citizens and organizations communicate their views on public affairs, and that restricting this activity weakens democratic participation. Reducing current restrictions is seen as expanding rather than contracting democratic freedom.',
  example_perspectives = ARRAY[
    'A First Amendment advocate who views political spending as expressive activity protected by the Constitution may see campaign finance restrictions as speech regulation.',
    'A small advocacy organization that has struggled to get its message out within tight spending limits may see restrictions as impeding its ability to participate in public debate.',
    'A voter who believes that people and organizations have a right to support candidates whose positions they agree with—regardless of the dollar amount—may see reduction of restrictions as consistent with free political participation.'
  ]
WHERE topic_id = '92730f69-ae57-401c-8ad1-2d07834a895d' AND value = 4;

UPDATE inform.compass_stances SET
  description = 'This stance holds that all campaign finance laws and limits constitute government regulation of political speech and should be eliminated, allowing individuals, organizations, and corporations to spend without restriction. Proponents argue that contribution limits distort the political process by favoring incumbents and well-established political networks while disadvantaging challengers who need large donations to be competitive. A completely open market for political spending is seen as the only constitutionally consistent position.',
  example_perspectives = ARRAY[
    'A constitutional strict constructionist who sees no textual basis for campaign finance regulation may view all such laws as unconstitutional infringements on political expression.',
    'A political newcomer or outsider candidate who needs substantial early funding to establish credibility may see contribution limits as barriers that protect established political actors.',
    'Someone who fundamentally believes that private individuals and organizations should be able to support any political cause in any amount without government interference may hold this position as a matter of principle.'
  ]
WHERE topic_id = '92730f69-ae57-401c-8ad1-2d07834a895d' AND value = 5;
