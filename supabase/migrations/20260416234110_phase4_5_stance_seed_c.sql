-- Phase 4.5 Seed C: authored content for topics 17-32 (values-based, no partisan labels)

-- Topic: Fossil Fuel Drilling (a22215c3-6693-4bc2-b248-01aebba14570)
UPDATE inform.compass_stances SET
  description = 'This stance holds that continued fossil fuel extraction is incompatible with avoiding the most severe consequences of climate change and that a moratorium on new drilling must begin immediately. Proponents argue that every new fossil fuel project locks in decades of additional emissions and that the window for effective climate action is closing. Halting extraction is seen as the only action sufficient to the scale and urgency of the problem.',
  example_perspectives = ARRAY[
    'A climate scientist who tracks the gap between current policy trajectories and emissions targets may see a drilling ban as the minimum action required to have a credible chance of meeting those targets.',
    'A coastal community resident whose area faces increasing flooding or storm intensity may see continued fossil fuel expansion as a direct threat to their home and community.',
    'A young person who will live with the long-term consequences of climate decisions being made today may prioritize halting new extraction as the most important intergenerational action available.'
  ]
WHERE topic_id = 'a22215c3-6693-4bc2-b248-01aebba14570' AND value = 1;

UPDATE inform.compass_stances SET
  description = 'This stance holds that existing fossil fuel production may continue to wind down naturally but that no new drilling permits should be issued, preventing the expansion of the fossil fuel footprint while allowing a managed transition. Proponents argue that stopping new permits is a more practically achievable step than an immediate moratorium on all drilling while still meaningfully bending the emissions curve. The goal is to prevent the pipeline of new extraction from growing.',
  example_perspectives = ARRAY[
    'An energy transition advocate who believes the permit pipeline is the key lever for long-term emissions reductions may see stopping new approvals as the most impactful near-term action.',
    'An investor in renewable energy who sees continued permitting of fossil fuel projects as an obstacle to market transition may support halting new permits as a signal that fossil fuels are not the future.',
    'An environmental attorney who works on permit challenges may see stopping new approvals as both legally achievable and strategically important.'
  ]
WHERE topic_id = 'a22215c3-6693-4bc2-b248-01aebba14570' AND value = 2;

UPDATE inform.compass_stances SET
  description = 'This stance holds that existing environmental regulations provide a sufficient framework for fossil fuel production and that maintaining current production levels while those rules are enforced represents the responsible middle path. Proponents see this as balancing energy security and economic stability against environmental protection without making dramatic changes in either direction. Gradual evolution through existing regulatory processes is preferred over abrupt shifts.',
  example_perspectives = ARRAY[
    'An energy industry worker whose livelihood depends on continued production may see maintaining current levels as protecting their job while accepting existing environmental safeguards.',
    'A policymaker focused on energy reliability and price stability may see current production levels as necessary to maintain affordable energy for households.',
    'A voter who sees both energy access and environmental protection as legitimate priorities may support the status quo as a workable balance while longer-term transitions proceed.'
  ]
WHERE topic_id = 'a22215c3-6693-4bc2-b248-01aebba14570' AND value = 3;

UPDATE inform.compass_stances SET
  description = 'This stance holds that expanding domestic fossil fuel production increases energy supply, reduces prices for consumers, and reduces dependence on foreign sources that may be less reliable or subject to geopolitical disruption. Proponents argue that energy security requires domestic production capacity and that expanded permitting achieves this while existing environmental rules manage the impacts. More domestic production is seen as both economically and strategically beneficial.',
  example_perspectives = ARRAY[
    'A consumer who has seen gasoline and heating prices spike with supply disruptions may see expanded domestic production as the most direct path to price stability.',
    'A national security analyst who tracks energy supply chains may see domestic production expansion as reducing strategic vulnerability to foreign energy disruption.',
    'A rural landowner or mineral rights holder who benefits from extraction royalties may see expanded permitting as a direct economic benefit to their community.'
  ]
WHERE topic_id = 'a22215c3-6693-4bc2-b248-01aebba14570' AND value = 4;

UPDATE inform.compass_stances SET
  description = 'This stance holds that environmental restrictions on fossil fuel extraction are excessive, economically damaging, and should be removed to maximize domestic energy production. Proponents argue that the economic and energy security benefits of unrestricted extraction outweigh the environmental costs and that the U.S. should produce as much fossil fuel as market demand supports. Regulatory removal is seen as restoring American energy strength.',
  example_perspectives = ARRAY[
    'An extraction industry executive who believes regulatory compliance costs have made U.S. production uncompetitive may see deregulation as essential to the industry''s viability.',
    'A voter in an energy-producing region who sees regulations as costing jobs and tax revenue without commensurate environmental benefit may support maximizing extraction.',
    'Someone who is skeptical of the scientific consensus on climate change may see environmental restrictions on fossil fuels as based on questionable premises and economically unjustified.'
  ]
WHERE topic_id = 'a22215c3-6693-4bc2-b248-01aebba14570' AND value = 5;

-- Topic: Housing Affordability (a9f53bc4-db4e-48e1-8663-c87f2c18b63d)
UPDATE inform.compass_stances SET
  description = 'This stance holds that housing is a fundamental human right and that when the market fails to provide it—as evidenced by widespread homelessness and housing insecurity—government must step in to fill the gap directly. Proponents argue that treating housing as a commodity whose price is set by market forces inevitably leaves behind those with the least buying power. Guaranteed provision is seen as the only way to ensure no one is left without shelter.',
  example_perspectives = ARRAY[
    'A social worker who manages cases involving families cycling in and out of homelessness may see guaranteed housing as the only intervention that actually breaks that cycle.',
    'A person who has experienced homelessness and navigated a fragmented system of shelters and temporary housing may view a guaranteed right to housing as a fundamentally different and necessary commitment.',
    'A public health researcher who tracks the health costs of housing instability may see guaranteed housing as a cost-effective intervention given the downstream savings in emergency services.'
  ]
WHERE topic_id = 'a9f53bc4-db4e-48e1-8663-c87f2c18b63d' AND value = 1;

UPDATE inform.compass_stances SET
  description = 'This stance holds that a substantial public investment in affordable housing construction and expanded rental assistance programs is necessary to close the gap between market-rate housing costs and what low- and moderate-income households can afford. Proponents argue that the scale of the housing affordability crisis requires a proportionate public investment response, not marginal adjustments. Millions of new units built with public funds alongside expanded vouchers are seen as the appropriate scale of intervention.',
  example_perspectives = ARRAY[
    'A housing nonprofit professional who tracks the growing gap between subsidized housing supply and the number of households that need it may see large-scale public investment as the only approach equal to the problem.',
    'A working family spending more than half their income on rent in a high-cost city may see large-scale affordable housing construction as the most direct path to relief.',
    'A city planner who has seen decades of market-rate development fail to produce housing affordable to lower-income residents may see substantial public construction as necessary.'
  ]
WHERE topic_id = 'a9f53bc4-db4e-48e1-8663-c87f2c18b63d' AND value = 2;

UPDATE inform.compass_stances SET
  description = 'This stance holds that targeted tax incentives for developers who include affordable units, assistance programs for first-time homebuyers, and permitting reforms to reduce construction barriers represent a practical, market-compatible path to improving affordability. Proponents see this as working within existing systems rather than replacing them, leveraging private capital where possible while directing public subsidy to the most acute needs. Incremental improvement is seen as more achievable and durable than structural overhaul.',
  example_perspectives = ARRAY[
    'A first-time homebuyer who needs down payment assistance but does not want to live in public housing may see targeted support programs as the appropriate form of intervention.',
    'A local official who wants to encourage development without the political difficulties of direct public construction may see zoning reform and tax incentives as achievable tools.',
    'A homebuilder who is willing to include affordable units in exchange for tax credits or expedited permitting may see this as a workable partnership between public goals and private activity.'
  ]
WHERE topic_id = 'a9f53bc4-db4e-48e1-8663-c87f2c18b63d' AND value = 3;

UPDATE inform.compass_stances SET
  description = 'This stance holds that excessive housing regulation—zoning rules, permitting delays, design mandates, environmental reviews—artificially restricts supply and drives up prices, and that removing these barriers will unlock private development sufficient to bring prices down. Proponents argue that markets respond to demand if allowed to do so, and that the primary obstacle to affordable housing is government-imposed friction in the building process. Deregulation is seen as the most direct and durable path to supply growth.',
  example_perspectives = ARRAY[
    'A developer who has watched projects fail or be delayed for years due to permitting and regulatory barriers may see deregulation as the key to making more housing economically viable to build.',
    'An economist who tracks the relationship between zoning density restrictions and housing costs may see regulatory reform as the evidence-based path to meaningful price reduction.',
    'A property owner who believes government land-use regulation has inflated housing values by restricting supply may support deregulation even at the cost of some reduction in their own property values.'
  ]
WHERE topic_id = 'a9f53bc4-db4e-48e1-8663-c87f2c18b63d' AND value = 4;

UPDATE inform.compass_stances SET
  description = 'This stance holds that housing prices and supply should be determined entirely by private markets without government programs, subsidies, or regulatory intervention. Proponents argue that government involvement in housing markets—through zoning rules, rent control, subsidies, and public housing—consistently produces worse outcomes than market allocation and that removing government entirely would allow markets to clear at prices people can actually afford.',
  example_perspectives = ARRAY[
    'A property rights advocate who believes private ownership and voluntary transactions are the only legitimate mechanisms for allocating housing may see all government programs as unjustified interference.',
    'An investor who believes subsidy programs primarily inflate costs and create perverse incentives rather than solving affordability may see their elimination as the correct diagnosis.',
    'Someone who fundamentally believes that markets, when left alone, produce the most efficient outcomes and that government housing programs have a multi-decade track record of failure may see this as the evidence-based position.'
  ]
WHERE topic_id = 'a9f53bc4-db4e-48e1-8663-c87f2c18b63d' AND value = 5;

-- Topic: Abortion (af2fdfd6-02c4-49df-b09c-cf8536f4773f)
UPDATE inform.compass_stances SET
  description = 'This stance holds that access to abortion is a fundamental component of reproductive autonomy and healthcare, and that restricting or defunding it imposes serious harm on those who need it. Proponents argue that decisions about pregnancy belong to the individual, not the government, and that public funding ensures that access is not limited to those who can afford to pay. Full access through all stages is seen as consistent with a commitment to bodily autonomy and equal healthcare access.',
  example_perspectives = ARRAY[
    'A person who has needed abortion access for a wanted pregnancy with a fatal diagnosis may see restrictions as forcing people to carry pregnancies with devastating outcomes.',
    'A healthcare provider who offers abortion services and has seen what happens when people cannot access them safely may view full legality and funding as a core public health matter.',
    'A reproductive rights advocate who views abortion as an essential component of healthcare—not a separate category—may see full access and public funding as the only consistent position.'
  ]
WHERE topic_id = 'af2fdfd6-02c4-49df-b09c-cf8536f4773f' AND value = 1;

UPDATE inform.compass_stances SET
  description = 'This stance holds that abortion should remain legal and accessible in the first and second trimesters, where the vast majority of abortions occur, with rare exceptions after that point for cases involving significant medical complications. Proponents argue that gestational limits that accommodate most circumstances while reflecting increasing fetal development represent a workable legal framework. The focus is on ensuring that most decisions can be made without legal restriction.',
  example_perspectives = ARRAY[
    'A person who has personal experience with a second-trimester diagnosis that required a difficult decision may value access protection through the second trimester.',
    'A medical professional who understands that later abortions almost always involve serious medical complications may see the late-term exception structure as medically appropriate.',
    'A voter who sees first and second trimester access as broadly defensible but has greater uncertainty about later procedures may find this framework aligned with their own reasoning.'
  ]
WHERE topic_id = 'af2fdfd6-02c4-49df-b09c-cf8536f4773f' AND value = 2;

UPDATE inform.compass_stances SET
  description = 'This stance holds that abortion should be available in the first trimester and in cases involving rape, incest, or serious maternal health risk, representing a significant but bounded set of legal protections. Proponents see first-trimester access as consistent with the period before fetal development reaches stages they find morally significant, while the exceptions reflect cases where compelling circumstances override other concerns. This is seen as a principled line based on developmental and circumstantial distinctions.',
  example_perspectives = ARRAY[
    'A person whose moral framework draws a developmental distinction early in pregnancy but not throughout may see first-trimester access as consistent with their values.',
    'A survivor of sexual violence who views coerced pregnancy as a distinct moral category may see rape and incest exceptions as essential regardless of other restrictions.',
    'A healthcare provider in a state where this framework operates may see it as allowing them to serve most patients who seek early care while having clear guidance on exceptions.'
  ]
WHERE topic_id = 'af2fdfd6-02c4-49df-b09c-cf8536f4773f' AND value = 3;

UPDATE inform.compass_stances SET
  description = 'This stance holds that abortion should only be legally permitted in cases where the pregnancy resulted from rape or incest, or where continuing the pregnancy poses a serious threat to the mother''s life. Proponents argue that outside these narrow circumstances, the fetus has a right to life that outweighs the decision to terminate. This approach is seen as protecting fetal life while acknowledging that forcing someone to carry a pregnancy resulting from violence or that threatens their survival crosses a different moral line.',
  example_perspectives = ARRAY[
    'Someone whose moral framework holds that fetal life has significant value from early in pregnancy but who cannot apply that standard to pregnancies resulting from rape may support this set of exceptions.',
    'A faith community member whose tradition opposes abortion but recognizes the moral weight of rape and life-threatening pregnancy may see this as the closest approximation to their values in law.',
    'A voter who is deeply uncomfortable with both unlimited access and absolute bans may see the narrow exception framework as the position that acknowledges both the seriousness of fetal life and extreme circumstances.'
  ]
WHERE topic_id = 'af2fdfd6-02c4-49df-b09c-cf8536f4773f' AND value = 4;

UPDATE inform.compass_stances SET
  description = 'This stance holds that abortion is the taking of a human life at every stage of pregnancy and that it must be prohibited entirely, with criminal penalties for providers and patients. Proponents argue that no exception can justify the termination of a human life and that the law must reflect the full moral weight of that position. They see a complete ban as the only position consistent with the belief that human life begins at fertilization.',
  example_perspectives = ARRAY[
    'A person whose moral or religious framework holds that human personhood begins at fertilization and admits no exceptions may see any legal abortion as incompatible with that belief.',
    'An anti-abortion activist who views the rape and incest exception as logically inconsistent—if the fetus is a person, the circumstances of conception do not change that—may hold the complete ban as the only principled position.',
    'A voter who believes that the law should reflect the full moral seriousness of ending fetal life, without compromise, may support a complete prohibition as a matter of conscience.'
  ]
WHERE topic_id = 'af2fdfd6-02c4-49df-b09c-cf8536f4773f' AND value = 5;

-- Topic: Healthcare - Government Role (be60844f-5e21-4fec-ae99-e00e95c1e19b)
UPDATE inform.compass_stances SET
  description = 'This stance holds that a single-payer government healthcare system is the most efficient and equitable way to ensure everyone has access to care, eliminating the administrative overhead and profit extraction of private insurance. Proponents argue that the U.S. already pays more per capita than countries with universal systems while leaving millions uninsured, and that consolidating to a single payer would reduce overall costs while covering everyone. Universal coverage through public administration is seen as both more humane and more economically rational.',
  example_perspectives = ARRAY[
    'A person who has been denied a claim or dropped from coverage by a private insurer at a critical moment may see profit-motivated insurance as fundamentally incompatible with healthcare access.',
    'A physician who spends significant time on insurance billing and prior authorization may see a single-payer system as reducing administrative burden and allowing more focus on patient care.',
    'A health economist who has studied comparative healthcare systems may see single-payer as consistent with the evidence on administrative efficiency and coverage outcomes.'
  ]
WHERE topic_id = 'be60844f-5e21-4fec-ae99-e00e95c1e19b' AND value = 1;

UPDATE inform.compass_stances SET
  description = 'This stance holds that a public insurance option—available alongside private plans—would provide a competitive alternative that covers those who fall through existing gaps while allowing people who prefer private coverage to keep it. Proponents argue that a public option expands access without requiring the elimination of a private insurance industry that many people choose and value. Competition from a public option is expected to improve affordability and coverage quality across the system.',
  example_perspectives = ARRAY[
    'A self-employed person who has struggled to afford individual market insurance may see a public option as providing affordable coverage without forcing a complete systemic change.',
    'A voter who values choice in healthcare but believes a public option should be available for those who want it may see this as expanding rather than restricting freedom.',
    'A healthcare policy researcher who views the public option as a proven model in other countries may see it as a practical expansion of access within a mixed system.'
  ]
WHERE topic_id = 'be60844f-5e21-4fec-ae99-e00e95c1e19b' AND value = 2;

UPDATE inform.compass_stances SET
  description = 'This stance holds that the existing mix of private insurance, employer-sponsored coverage, and government programs like Medicare and Medicaid is broadly working and should be refined rather than replaced. Proponents support regulating healthcare costs—through price transparency, prescription drug negotiation, and anti-trust action—without restructuring the fundamental delivery system. Maintaining the current system while addressing specific failures is seen as more realistic than wholesale redesign.',
  example_perspectives = ARRAY[
    'A voter who has employer-sponsored health insurance they value may resist changes that could disrupt what they currently have in pursuit of a systemic overhaul.',
    'A healthcare administrator who operates within the current system and sees it as functional despite imperfections may favor targeted regulation over structural replacement.',
    'A legislator who sees single-payer or public option reforms as politically difficult may see cost regulation within the existing framework as an achievable path to meaningful improvement.'
  ]
WHERE topic_id = 'be60844f-5e21-4fec-ae99-e00e95c1e19b' AND value = 3;

UPDATE inform.compass_stances SET
  description = 'This stance holds that government healthcare assistance should be limited to those who demonstrably cannot afford coverage on their own, while the majority of the population obtains coverage through employers or private purchase. Proponents argue that broad government healthcare programs crowd out private innovation, increase costs through price floors, and create fiscal obligations that are difficult to sustain. Targeted assistance for a defined population of genuine need is seen as more fiscally sustainable and less disruptive to the private market.',
  example_perspectives = ARRAY[
    'A fiscal steward focused on long-term government solvency may see limited, targeted assistance as a more defensible commitment than open-ended universal coverage.',
    'A private insurance professional who believes market competition produces better products and lower costs than government administration may support limiting public programs.',
    'A voter who has private insurance and is satisfied with it may oppose expansions that they believe will increase their taxes without improving their own coverage.'
  ]
WHERE topic_id = 'be60844f-5e21-4fec-ae99-e00e95c1e19b' AND value = 4;

UPDATE inform.compass_stances SET
  description = 'This stance holds that healthcare is a service best provided by competitive private markets without government administration, mandates, or programs. Proponents argue that government intervention in healthcare has driven up costs, reduced innovation, and created perverse incentives, and that removing it would restore price competition and patient choice. They believe that a deregulated healthcare market would produce better outcomes and more accessible care than any government-administered alternative.',
  example_perspectives = ARRAY[
    'Someone who believes that every sector government has taken over has become less efficient and more expensive may see healthcare deregulation as the logical extension of that principle.',
    'A provider who believes that government reimbursement rates, mandates, and administrative requirements reduce the quality of care they can offer may support moving to a fully private system.',
    'A voter who is deeply skeptical of government administration in any domain and sees healthcare as no different may favor complete privatization as consistent with their broader principles.'
  ]
WHERE topic_id = 'be60844f-5e21-4fec-ae99-e00e95c1e19b' AND value = 5;

-- Topic: Childcare (c1ac1330-47f7-44ec-baf3-c913d926b97c)
UPDATE inform.compass_stances SET
  description = 'This stance holds that childcare is a public good—like education—that should be universally available and publicly funded so that every family has access regardless of income. Proponents argue that the cost of childcare has become so high that it functionally prevents many parents, particularly mothers, from participating in the workforce, and that this represents both an economic loss and an equity problem. Universal public childcare is seen as an investment in children, families, and economic productivity.',
  example_perspectives = ARRAY[
    'A parent who has turned down a job or reduced hours because childcare costs would consume more than their earnings may see universal childcare as removing a structural barrier to workforce participation.',
    'A child development researcher who sees early childhood care quality as a significant predictor of educational and health outcomes may view universal access as an investment that pays dividends across a lifetime.',
    'A working parent who has struggled to find affordable, quality care may see childcare as deserving the same public investment as K-12 education.'
  ]
WHERE topic_id = 'c1ac1330-47f7-44ec-baf3-c913d926b97c' AND value = 1;

UPDATE inform.compass_stances SET
  description = 'This stance holds that substantial expansion of subsidies for families who cannot afford market-rate childcare, combined with provider grants to improve quality and expand capacity, represents the most effective path to broad affordability without building a fully public system. Proponents argue that the current level of subsidy is far below what is needed to address the gap between market costs and what low- and middle-income families can afford. Significant public investment is necessary even if it falls short of full universality.',
  example_perspectives = ARRAY[
    'A working-class family earning too much to qualify for existing subsidies but too little to afford market-rate care may see expanded subsidies as the most direct relief for their specific situation.',
    'A childcare center director who struggles to retain qualified staff at wages the subsidy system supports may see provider grants as essential to sustaining quality care.',
    'A legislator looking for a significant expansion of childcare access that is politically achievable may see enhanced subsidies as more feasible than a full universal system.'
  ]
WHERE topic_id = 'c1ac1330-47f7-44ec-baf3-c913d926b97c' AND value = 2;

UPDATE inform.compass_stances SET
  description = 'This stance holds that targeted tax credits for families below an income threshold and grants for provider training and facility improvements can meaningfully improve childcare affordability and quality without a full subsidy overhaul. Proponents see these as tools that work with the existing market structure to address the most acute affordability gaps and quality deficits without creating a large new government program. Proportionate, targeted intervention is preferred over broad systemic change.',
  example_perspectives = ARRAY[
    'A small childcare business owner who has struggled to afford safety upgrades or staff training may value grants that help them improve without creating new compliance burdens.',
    'A family at or just below the income threshold who would directly benefit from an expanded tax credit may see targeted support as more accessible than broad program expansion.',
    'A policymaker looking for fiscally manageable improvements to childcare access may see targeted credits and grants as achievable steps that help real families without large structural commitments.'
  ]
WHERE topic_id = 'c1ac1330-47f7-44ec-baf3-c913d926b97c' AND value = 3;

UPDATE inform.compass_stances SET
  description = 'This stance holds that excessive licensing requirements, staffing ratios, and facility mandates drive up the cost of childcare without proportionate safety benefits and that reducing these regulatory burdens would allow more providers to enter the market at lower prices. Limited subsidies for the lowest-income families are retained, but the primary lever is supply expansion through deregulation rather than subsidy expansion. Proponents argue that more providers competing on price will do more for affordability than any subsidy program.',
  example_perspectives = ARRAY[
    'A parent who lives in an area with few providers and long waiting lists may see regulatory barriers to opening new childcare businesses as the primary obstacle to finding care.',
    'A childcare entrepreneur who wants to open a new center but has been deterred by licensing costs and requirements may see deregulation as enabling new supply to enter the market.',
    'A voter who believes market competition is generally more effective than subsidy programs at lowering prices may see regulatory reduction as the most sustainable affordability strategy.'
  ]
WHERE topic_id = 'c1ac1330-47f7-44ec-baf3-c913d926b97c' AND value = 4;

UPDATE inform.compass_stances SET
  description = 'This stance holds that childcare is a family responsibility and that government subsidies, mandates, and regulations all increase costs and reduce the options available to families who prefer to manage care privately. Proponents argue that government childcare programs crowd out family-based and informal care arrangements that many families prefer and that the appropriate response to childcare costs is reducing government intervention rather than increasing it. Families should make and fund their own childcare arrangements.',
  example_perspectives = ARRAY[
    'A parent who has chosen to reduce work hours or leave the workforce to care for their own child may feel that subsidized institutional care does not reflect or support their preference.',
    'A taxpayer who does not use childcare services and does not believe others'' childcare decisions should be publicly funded may oppose subsidies as an unjustified transfer.',
    'Someone who believes that government programs consistently raise costs and reduce quality in sectors they enter may prefer keeping childcare entirely in private hands.'
  ]
WHERE topic_id = 'c1ac1330-47f7-44ec-baf3-c913d926b97c' AND value = 5;

-- Topic: Jail / Incarceration (c267e137-0ff9-4e7d-9d13-e3cea1756cd0)
UPDATE inform.compass_stances SET
  description = 'This stance holds that investment in incarceration represents a fundamental misallocation of public resources and that the same money produces better safety outcomes when invested in mental health services, addiction treatment, affordable housing, and restorative justice programs. Proponents argue that the jail system addresses the symptoms of underlying social problems rather than their causes and that reducing the incarcerated population through systemic investment is the only path to genuine safety.',
  example_perspectives = ARRAY[
    'A mental health professional who routinely sees people with untreated conditions cycle through jail rather than receiving treatment may see redirection of resources to mental health as addressing the actual problem.',
    'A family member of someone who has been repeatedly jailed for addiction-related offenses may see treatment investment as more likely to break the cycle than continued incarceration.',
    'A criminologist who studies recidivism rates and finds incarceration to be a poor predictor of reduced reoffending may view community-based alternatives as evidence-based improvements.'
  ]
WHERE topic_id = 'c267e137-0ff9-4e7d-9d13-e3cea1756cd0' AND value = 1;

UPDATE inform.compass_stances SET
  description = 'This stance holds that jail and prison populations can be safely reduced through reforms like pretrial diversion programs, elimination of cash bail, and diverting people with addiction or mental health issues to treatment rather than incarceration. Proponents argue that a significant portion of the current incarcerated population poses little public safety risk and that incarceration for these individuals is costly and counterproductive. Reducing the population through upstream intervention is preferred over building new capacity.',
  example_perspectives = ARRAY[
    'A pretrial services professional who sees low-risk defendants held in jail simply because they cannot afford bail may see bail reform as an obvious and humane correction.',
    'A defense attorney who regularly represents people whose conditions worsen in jail and who would do better in treatment may support diversion as a more effective intervention.',
    'A fiscal steward who tracks the daily cost of incarceration may see population reduction through diversion as producing both better outcomes and significant savings.'
  ]
WHERE topic_id = 'c267e137-0ff9-4e7d-9d13-e3cea1756cd0' AND value = 2;

UPDATE inform.compass_stances SET
  description = 'This stance holds that jail facilities should meet minimum constitutional standards of safety and habitability, with capital investment limited to addressing documented deficiencies rather than expanding overall capacity. Proponents see this as a responsible stewardship position: fix what is broken without building a system larger than public safety requires. Investment in alternative approaches should accompany facility improvements to ensure capacity is not expanded beyond need.',
  example_perspectives = ARRAY[
    'A corrections officer who works in an aging, unsafe facility may see maintenance and safety upgrades as necessary regardless of broader policy debates.',
    'A taxpayer who accepts that facilities must meet minimum standards but does not want to pay for capacity expansion they view as unnecessary may find this position sensible.',
    'A civil rights attorney who litigates conditions-of-confinement cases may see constitutional minimum standards as a floor that must be met regardless of broader incarceration debates.'
  ]
WHERE topic_id = 'c267e137-0ff9-4e7d-9d13-e3cea1756cd0' AND value = 3;

UPDATE inform.compass_stances SET
  description = 'This stance holds that current jail overcrowding and inadequate facilities create safety risks for both staff and those incarcerated and that the responsible response is building capacity to address those operational realities. Proponents argue that overcrowding is a documented problem that cannot be resolved solely through policy reform and that facility expansion is a practical necessity for safe operations. Adequate physical infrastructure is seen as a prerequisite for humane conditions.',
  example_perspectives = ARRAY[
    'A corrections official who manages an overcrowded facility and sees daily safety incidents resulting from overcrowding may see expansion as necessary to safe operations.',
    'A county commissioner focused on reducing legal liability from overcrowding lawsuits may see facility expansion as a risk management necessity.',
    'A public safety professional who believes detention is appropriate for people who cannot be safely supervised in the community may see adequate capacity as essential to system function.'
  ]
WHERE topic_id = 'c267e137-0ff9-4e7d-9d13-e3cea1756cd0' AND value = 4;

UPDATE inform.compass_stances SET
  description = 'This stance holds that public safety requires adequate detention capacity and that the primary tool for reducing crime is ensuring that those who commit it face meaningful consequences, including incarceration. Proponents argue that alternatives to detention leave communities less safe and that expanding capacity is necessary to give law enforcement and courts the tools they need to respond to criminal activity. Detention is seen as the appropriate primary response to crime rather than a last resort.',
  example_perspectives = ARRAY[
    'A crime victim who believes that the person who harmed them was back in the community too quickly due to inadequate detention capacity may support expansion as a public safety measure.',
    'A law enforcement professional who has had to release people before cases are resolved due to overcrowding may see capacity expansion as essential to effective justice.',
    'A voter in a community with high crime rates who believes visible enforcement and detention are necessary to deter future offending may see jail expansion as a public safety investment.'
  ]
WHERE topic_id = 'c267e137-0ff9-4e7d-9d13-e3cea1756cd0' AND value = 5;

-- Topic: Same-Sex Marriage (c5ab4eab-702f-49b8-9277-8ea53f3835c6)
UPDATE inform.compass_stances SET
  description = 'This stance holds that same-sex couples are entitled to the same legal recognition, benefits, and federal protections as any other married couple, and that this right must be uniform across all states without exception. Proponents argue that marriage equality is a matter of equal legal status under the law and that allowing states to opt out creates a patchwork of rights depending on geography. Federal recognition with full benefit parity is the only consistent position.',
  example_perspectives = ARRAY[
    'A same-sex couple whose marriage is recognized federally but who faces uncertainty when traveling to certain states may see uniform federal protection as essential to the practical security of their family.',
    'A constitutional scholar who sees equal protection under the law as requiring consistent application across states may view state variation in marriage recognition as incompatible with that principle.',
    'A family member of a same-sex couple who has seen the legal and practical consequences of their family''s marriage being treated differently may support federal standardization.'
  ]
WHERE topic_id = 'c5ab4eab-702f-49b8-9277-8ea53f3835c6' AND value = 1;

UPDATE inform.compass_stances SET
  description = 'This stance supports nationwide marriage equality while protecting the right of certain organizations—particularly religious institutions—to decline to perform or participate in marriages that conflict with their doctrinal commitments. Proponents argue that both marriage equality and sincere religious freedom are important values that need not conflict when properly scoped. Civil marriage recognition is universal; religious ceremony is a separate matter over which faith communities retain autonomy.',
  example_perspectives = ARRAY[
    'A same-sex couple who wants the full legal status of marriage but also respects that some clergy should not be required to officiate against their beliefs may find this framework appropriate.',
    'A religious leader who supports equal civil rights but believes their tradition''s definition of marriage should not be legally compelled may see this distinction as protecting their community.',
    'A civil libertarian who values both equal legal rights and genuine religious freedom may see this as a framework that takes both seriously.'
  ]
WHERE topic_id = 'c5ab4eab-702f-49b8-9277-8ea53f3835c6' AND value = 2;

UPDATE inform.compass_stances SET
  description = 'This stance holds that marriage law is a matter for individual states to determine through their own democratic processes and that the federal government should not mandate a uniform definition for all fifty states. Proponents argue that federalism allows states to reflect the diverse values of their populations and that the appropriate venue for this debate is state legislatures and courts rather than the federal government. Different states reaching different conclusions is seen as federalism working as intended.',
  example_perspectives = ARRAY[
    'A believer in state sovereignty who thinks most domestic law questions should be resolved at the state level may see this as consistent with constitutional federalism principles.',
    'A voter in a state that has chosen one approach who believes their community should govern its own domestic institutions without federal override may support state-level determination.',
    'A federalism scholar who sees the diversity of state laws on marriage and family as a feature of the constitutional system rather than a problem may favor this approach.'
  ]
WHERE topic_id = 'c5ab4eab-702f-49b8-9277-8ea53f3835c6' AND value = 3;

UPDATE inform.compass_stances SET
  description = 'This stance holds that same-sex couples should have access to civil unions with equivalent legal rights and benefits, while the specific designation of "marriage" should be reserved for opposite-sex couples. Proponents argue that this approach provides equal legal standing without requiring a redefinition of a term that has religious and cultural significance to many. Equal legal treatment through a different designation is seen as a compromise that respects both equal rights and traditional definitions.',
  example_perspectives = ARRAY[
    'Someone who holds a traditional definition of marriage as a specific cultural or religious institution but supports equal legal treatment for all couples may see civil unions as the appropriate compromise.',
    'A legislator seeking a position that provides equal legal protection without the political conflict around the word "marriage" may see civil unions as an achievable settlement.',
    'A person who distinguishes between the legal institution (which should be equal) and the cultural or religious meaning of the term (which they want preserved) may favor this distinction.'
  ]
WHERE topic_id = 'c5ab4eab-702f-49b8-9277-8ea53f3835c6' AND value = 4;

UPDATE inform.compass_stances SET
  description = 'This stance holds that marriage is a foundational social institution with a specific definition—between one man and one woman—that law should reflect and protect. Proponents argue that this definition reflects the complementary nature of the institution and its connection to biological parenthood and that redefining it in law has broad cultural and social consequences. They see the legal definition of marriage as a matter of principle that should not be altered regardless of other social trends.',
  example_perspectives = ARRAY[
    'A person whose faith tradition defines marriage in specific terms and who believes law should reflect that definition may hold this position as a matter of religious and moral conviction.',
    'A social traditionalist who believes that longstanding social institutions have endured because they serve important functions may be wary of altering their legal definition.',
    'A voter who sees the definition of marriage as foundational to their understanding of family and society may support prohibiting same-sex marriage as a matter of preserving what they view as a core social structure.'
  ]
WHERE topic_id = 'c5ab4eab-702f-49b8-9277-8ea53f3835c6' AND value = 5;

-- Topic: Immigration Levels (c6957429-bc9e-48e7-b36f-a102b968a972)
UPDATE inform.compass_stances SET
  description = 'This stance holds that national borders impose unjust restrictions on human movement and that people should be free to live and work wherever they choose without government barriers. Proponents argue that immigration restrictions primarily serve to protect existing residents from economic competition at the expense of those seeking better lives, and that free movement produces broad economic and humanitarian gains. Open borders are seen as the logical extension of principles of human freedom and equality.',
  example_perspectives = ARRAY[
    'A humanitarian advocate who sees migration as a fundamental human response to poverty, violence, or climate change may view borders as an unjust obstacle to survival and flourishing.',
    'An economist who studies the productivity gains from labor mobility may see open borders as producing significant economic benefits for both sending and receiving communities.',
    'A global citizen who identifies with humanity broadly rather than with national boundaries may view restrictions on movement as inconsistent with equal human dignity.'
  ]
WHERE topic_id = 'c6957429-bc9e-48e7-b36f-a102b968a972' AND value = 1;

UPDATE inform.compass_stances SET
  description = 'This stance holds that legal immigration levels should be increased substantially and that pathways to citizenship should be made easier and faster for those who want to contribute to the country. Proponents argue that immigration is a demographic and economic asset that fuels growth, innovation, and the tax base that supports public services. They see the current system as arbitrarily restrictive relative to actual economic and humanitarian need.',
  example_perspectives = ARRAY[
    'An employer in a sector with documented labor shortages may see expanded legal immigration as the most direct solution to workforce gaps that are limiting business growth.',
    'A tech or research professional who works alongside skilled immigrants and sees them as essential contributors may support increasing pathways for high-skilled workers.',
    'A first-generation immigrant whose family benefited from legal immigration pathways may support expanding those opportunities for others who want to contribute.'
  ]
WHERE topic_id = 'c6957429-bc9e-48e7-b36f-a102b968a972' AND value = 2;

UPDATE inform.compass_stances SET
  description = 'This stance holds that current immigration levels are broadly appropriate and that the priority should be making the existing legal process work better—reducing backlogs, improving processing times, and ensuring lawful pathways are functional—rather than expanding or contracting overall numbers. Proponents see the current framework as reflecting a reasonable balance between openness and orderly management of flows and prefer incremental refinement over structural change.',
  example_perspectives = ARRAY[
    'An immigration attorney who has seen clients wait years for routine applications to be processed may see system efficiency improvements as more urgent than changes to the overall level.',
    'A voter broadly satisfied with immigration levels but frustrated by a dysfunctional bureaucracy may see process reform as the most impactful near-term change.',
    'A policymaker who sees both expansion and restriction as politically divisive may view functional reform of the existing system as an achievable common ground.'
  ]
WHERE topic_id = 'c6957429-bc9e-48e7-b36f-a102b968a972' AND value = 3;

UPDATE inform.compass_stances SET
  description = 'This stance holds that immigration levels should be reduced and the selection criteria should prioritize demonstrated skills and economic contribution over family relationships or humanitarian categories. Proponents argue that skills-based selection maximizes the economic benefit of immigration to the existing population and that the current family-based system results in levels and compositions that are not optimized for the labor market. Merit-based reduction is seen as improving both the scale and quality of immigration outcomes.',
  example_perspectives = ARRAY[
    'A labor market analyst focused on wage growth for native workers may see reduced overall immigration with higher skill thresholds as protecting earnings in competitive sectors.',
    'A voter who supports immigration in principle but believes the current system prioritizes the wrong criteria may see skills-based selection as a more rational framework.',
    'An economist who has studied the wage effects of different immigration types may favor skill-prioritized selection as producing better outcomes for the existing workforce.'
  ]
WHERE topic_id = 'c6957429-bc9e-48e7-b36f-a102b968a972' AND value = 4;

UPDATE inform.compass_stances SET
  description = 'This stance holds that immigration at current or recent levels has placed unsustainable pressure on public services, housing, wages, and social cohesion, and that stopping legal immigration while removing people without legal status is necessary to restore order and protect existing residents. Proponents argue that national interest requires prioritizing current citizens and legal residents over continued inflows. Immigration is seen as having reached a scale that requires fundamental reduction.',
  example_perspectives = ARRAY[
    'A worker in a lower-wage sector who attributes stagnant wages to labor market competition with recent arrivals may see stopping immigration as economic protection.',
    'A resident in a high-immigration area who has seen housing costs rise rapidly may see population inflows as a primary driver of affordability problems.',
    'A voter who believes social cohesion requires a period of reduced immigration to allow integration of current arrivals before new ones are added may support a halt as a temporary stabilization measure.'
  ]
WHERE topic_id = 'c6957429-bc9e-48e7-b36f-a102b968a972' AND value = 5;

-- Topic: Medicare / Medicaid (cab61e8a-64fe-4bbd-bc08-fe9914d0091b)
UPDATE inform.compass_stances SET
  description = 'This stance holds that Medicare—which currently covers people 65 and older—should be expanded to cover all Americans, creating a single public insurer that eliminates the complexity of a multi-payer system and ensures no one falls through coverage gaps due to age or income. Proponents argue that Medicare for All would reduce administrative overhead, give the government bargaining power over prices, and produce a net reduction in total healthcare spending while covering everyone.',
  example_perspectives = ARRAY[
    'A person who aged out of a parent''s insurance plan and found individual market coverage unaffordable may see universal Medicare coverage as filling the gap that left them uninsured.',
    'A physician who spends significant administrative time managing multiple payers may see a single-payer system as reducing the overhead that takes time away from patient care.',
    'A healthcare economist who has studied administrative costs across multi-payer and single-payer systems may see Medicare expansion as producing significant efficiency gains.'
  ]
WHERE topic_id = 'cab61e8a-64fe-4bbd-bc08-fe9914d0091b' AND value = 1;

UPDATE inform.compass_stances SET
  description = 'This stance holds that lowering the Medicare eligibility age to 55 and substantially expanding Medicaid to cover more low-income adults represents a significant and achievable expansion of coverage without the political and logistical challenges of a complete system overhaul. Proponents argue that these changes would dramatically reduce the number of uninsured Americans while building on existing, tested infrastructure. Expansion within the existing framework is seen as more realistic than full single-payer.',
  example_perspectives = ARRAY[
    'An early retiree between 55 and 65 who cannot afford individual market insurance and is waiting for Medicare eligibility may see lowering the age as an immediate personal benefit.',
    'A state Medicaid administrator who sees people falling into the coverage gap may support expansion as solving a documented problem within an existing operational framework.',
    'A healthcare advocate who wants to build on Medicare''s track record while expanding access to those who currently lack it may see this incremental expansion as the right next step.'
  ]
WHERE topic_id = 'cab61e8a-64fe-4bbd-bc08-fe9914d0091b' AND value = 2;

UPDATE inform.compass_stances SET
  description = 'This stance holds that Medicare and Medicaid serve important populations but should be refined through cost controls, quality improvements, and efficiency measures rather than dramatically expanded or contracted. Proponents see targeted improvements—closing coverage gaps, negotiating drug prices, reducing fraud—as achievable paths to better performance without requiring a wholesale restructuring that disrupts what is working. Responsible management of existing programs is the priority.',
  example_perspectives = ARRAY[
    'A Medicare beneficiary who is broadly satisfied with their coverage but concerned about the program''s long-term fiscal sustainability may support efficiency improvements over expansion.',
    'A healthcare provider who participates in both programs and sees specific reimbursement and administrative issues that reforms could address may favor targeted improvements.',
    'A policymaker who sees major program restructuring as politically infeasible but believes meaningful improvements are achievable may favor this incremental approach.'
  ]
WHERE topic_id = 'cab61e8a-64fe-4bbd-bc08-fe9914d0091b' AND value = 3;

UPDATE inform.compass_stances SET
  description = 'This stance holds that Medicare and Medicaid should be partially restructured to incorporate more private sector participation, with reduced overall coverage levels that focus public resources on the most vulnerable while allowing the market to serve others. Proponents argue that competition from private plans improves quality and efficiency and that current program scope is fiscally unsustainable. Shifting some coverage functions to private plans with government vouchers or premium supports is seen as a path to long-term viability.',
  example_perspectives = ARRAY[
    'A fiscal steward focused on long-term federal solvency may see current program growth trajectories as unsustainable and partial privatization as a structural response.',
    'A health insurance professional who believes private plans offer more innovation and better service than government administration may support incorporating private options.',
    'A voter who is concerned about government healthcare spending crowding out other priorities may favor reducing program scope to concentrate public resources on those who need them most.'
  ]
WHERE topic_id = 'cab61e8a-64fe-4bbd-bc08-fe9914d0091b' AND value = 4;

UPDATE inform.compass_stances SET
  description = 'This stance holds that Medicare and Medicaid should be phased out and replaced with private insurance coverage, on the grounds that government administration of healthcare is inefficient, costly, and less responsive to beneficiary needs than competitive private plans. Proponents argue that these programs have grown far beyond their original scope, crowd out private options, and represent a growing fiscal obligation that is not sustainable. Private insurance with limited government assistance for truly indigent populations is seen as the correct end state.',
  example_perspectives = ARRAY[
    'A libertarian-minded voter who believes government should not administer healthcare for any population except perhaps the genuinely destitute may see phaseout as consistent with their core principles.',
    'A private insurance professional who believes competitive markets consistently outperform government in service quality and efficiency may see these programs as unnecessary displacement of superior private alternatives.',
    'A fiscal hawk who sees entitlement programs as the primary driver of long-term government insolvency may view elimination as the only structural solution to the budget problem.'
  ]
WHERE topic_id = 'cab61e8a-64fe-4bbd-bc08-fe9914d0091b' AND value = 5;

-- Topic: Transgender Athletes (d1618b9c-0b9e-45af-b986-bb33d270b8e4)
UPDATE inform.compass_stances SET
  description = 'This stance holds that transgender athletes should compete in the category that matches their gender identity as a matter of basic inclusion and equal dignity, without additional requirements beyond standard participation documentation. Proponents argue that transgender people deserve the same access to sports and its social benefits as anyone else, and that the claimed competitive disadvantages are overstated or sport-specific in ways that do not justify broad exclusion.',
  example_perspectives = ARRAY[
    'A transgender athlete who has experienced exclusion from sports participation and its social and physical benefits may see inclusion without barriers as essential to equal participation.',
    'A parent of a transgender child who has watched their child''s mental health benefit from team sports may see inclusion as far more important than hypothetical competitive concerns.',
    'A sports inclusion advocate who sees transgender exclusion as part of a broader pattern of social marginalization may view full inclusion as a matter of fundamental equity.'
  ]
WHERE topic_id = 'd1618b9c-0b9e-45af-b986-bb33d270b8e4' AND value = 1;

UPDATE inform.compass_stances SET
  description = 'This stance holds that transgender athletes should be able to compete in their gender identity category after completing basic documentation of their transition, such as a hormone therapy period. It holds that inclusion is the default value and that documentation requirements are a proportionate, minimal safeguard rather than a barrier. Proponents see this as balancing inclusion with some acknowledgment that sports bodies need clear processes.',
  example_perspectives = ARRAY[
    'A school athletic director who needs workable and inclusive policies that treat all students fairly may see a documentation-based framework as a practical approach.',
    'A transgender athlete who has completed hormone therapy and believes the transition process is relevant to competitive categorization may support a documented transition requirement.',
    'A sports administrator looking for a policy that is inclusive by default while having some process for categorical determination may see this as the most defensible approach.'
  ]
WHERE topic_id = 'd1618b9c-0b9e-45af-b986-bb33d270b8e4' AND value = 2;

UPDATE inform.compass_stances SET
  description = 'This stance holds that the appropriate response to competitive categorization for transgender athletes varies significantly by sport, level of competition, and individual circumstances, and that neither universal inclusion nor universal exclusion is the right rule. Separate divisions for transgender athletes or case-by-case determinations based on sport-specific research allow governing bodies to balance inclusion and competitive integrity in their particular context. One-size-fits-all rules are seen as too blunt for a complex empirical question.',
  example_perspectives = ARRAY[
    'A sports physiologist who studies the sport-specific effects of testosterone on competitive performance may argue that the right policy depends heavily on the event and the individual.',
    'A governing body official who must set rules for both recreational youth leagues and elite competition may see sport-specific and context-specific policies as necessary given those different stakes.',
    'A person who wants to respect both the needs of transgender athletes and the concerns of others competing in the same category may see case-by-case evaluation as more fair than categorical rules.'
  ]
WHERE topic_id = 'd1618b9c-0b9e-45af-b986-bb33d270b8e4' AND value = 3;

UPDATE inform.compass_stances SET
  description = 'This stance holds that athletic competition categories are organized around biological sex because of its documented effects on average physical performance, and that transgender athletes should compete in the category corresponding to their sex assigned at birth regardless of their gender identity. Proponents argue that this policy preserves the integrity of female sport categories in particular, where average physical differences are most pronounced. Competitive fairness is seen as the governing value for athletic categorization.',
  example_perspectives = ARRAY[
    'A female athlete who has dedicated years to competitive sport and is concerned about equitable competition in her category may see biological sex as the appropriate categorization criterion.',
    'A coach who has observed performance differences between athletes who transitioned at different life stages may favor biological sex as the most consistent and predictable categorization basis.',
    'A sports scientist who studies sex-based performance differences and finds them robust in certain events may see biological sex as the defensible standard for competitive categories.'
  ]
WHERE topic_id = 'd1618b9c-0b9e-45af-b986-bb33d270b8e4' AND value = 4;

UPDATE inform.compass_stances SET
  description = 'This stance holds that transgender people should not participate in any organized competitive sports and that athletic competition should be strictly limited to individuals whose sex assigned at birth matches the category they are competing in. Proponents argue that any inclusion of transgender athletes in organized sports creates fairness problems that cannot be adequately managed through policy accommodations. Complete exclusion is seen as the only approach that preserves the integrity of sports categories.',
  example_perspectives = ARRAY[
    'A person who believes that no level of transition eliminates the physiological effects of male puberty on performance may see a complete ban as the only consistent policy.',
    'A youth sports parent who believes that any participation by transgender athletes in their child''s category is unfair may support a complete exclusion rule as the clearest protection.',
    'A voter who sees sports categorization as binary and physiologically determined may support a complete ban as the only approach consistent with that underlying principle.'
  ]
WHERE topic_id = 'd1618b9c-0b9e-45af-b986-bb33d270b8e4' AND value = 5;

-- Topic: Voter Access (d1792200-1d3b-4955-a0b7-0e6980d7a7b2)
UPDATE inform.compass_stances SET
  description = 'This stance holds that automatic voter registration and online voting are the most effective ways to remove administrative barriers to participation and ensure that every eligible citizen can exercise the franchise. Proponents argue that the current registration system functions as an obstacle that disproportionately affects young, mobile, and lower-income voters. Making registration automatic and expanding voting modalities is seen as completing the promise of universal suffrage.',
  example_perspectives = ARRAY[
    'A college student who has moved between states and missed registration deadlines may see automatic registration as the fix to a structural barrier they have personally experienced.',
    'A democracy advocate who tracks the gap between eligible voters and registered voters as a measure of systemic exclusion may see automatic registration as the most direct intervention.',
    'A young voter who sees in-person registration requirements as an anachronism in a digital age may support both automatic registration and online voting as natural modernizations.'
  ]
WHERE topic_id = 'd1792200-1d3b-4955-a0b7-0e6980d7a7b2' AND value = 1;

UPDATE inform.compass_stances SET
  description = 'This stance holds that expanding early voting periods and making mail-in voting universally available are the most practical ways to increase turnout among people who cannot easily vote on a single Election Day. Proponents argue that requiring all voters to appear in person on a specific day creates barriers for those with inflexible work schedules, caregiving responsibilities, transportation challenges, or health limitations. Expanding access modalities is seen as ensuring that the election schedule does not systematically exclude working people.',
  example_perspectives = ARRAY[
    'A worker without paid time off who cannot take several hours to stand in line on Election Day may see expanded early voting as the practical difference between being able to vote or not.',
    'A caregiver whose schedule is unpredictable may see mail-in voting as the only reliable way to participate in elections.',
    'An election administrator who has seen turnout data showing higher participation in jurisdictions with expanded access options may see early voting and mail-in ballots as proven tools.'
  ]
WHERE topic_id = 'd1792200-1d3b-4955-a0b7-0e6980d7a7b2' AND value = 2;

UPDATE inform.compass_stances SET
  description = 'This stance holds that standardizing voter ID requirements across jurisdictions is a reasonable integrity measure as long as free ID is made available to any eligible citizen who needs it. Proponents argue that a consistent, accessible ID requirement provides basic assurance of voter identity without creating a genuine barrier to those who want to participate. Free ID availability is the key condition that makes the requirement equitable rather than restrictive.',
  example_perspectives = ARRAY[
    'A voter who presents ID for many everyday transactions and sees a standardized voting ID requirement as unremarkable may find this a reasonable safeguard.',
    'An election integrity advocate who wants uniform rules that apply consistently regardless of jurisdiction may favor standardization as a fairness measure.',
    'A centrist voter who sees both ballot integrity and access as legitimate concerns may see this framework—ID required but freely available—as appropriately balancing both.'
  ]
WHERE topic_id = 'd1792200-1d3b-4955-a0b7-0e6980d7a7b2' AND value = 3;

UPDATE inform.compass_stances SET
  description = 'This stance holds that photo ID requirements are a necessary safeguard against voter fraud and that voter rolls should be regularly updated to remove outdated registrations. Proponents argue that requiring photo ID for voting is consistent with requirements for many other secure transactions and that keeping voter rolls current prevents opportunities for fraudulent voting. Identification and roll maintenance are seen as standard elements of election integrity.',
  example_perspectives = ARRAY[
    'A voter who must show ID for banking, travel, and many government services may see photo ID for voting as a consistent and reasonable requirement.',
    'An election official who manages voter rolls and wants them to be accurate may see regular maintenance and removal of inactive registrations as good administrative practice.',
    'A voter concerned about election confidence who believes visible integrity measures increase public trust in results may see photo ID as serving an important legitimacy function.'
  ]
WHERE topic_id = 'd1792200-1d3b-4955-a0b7-0e6980d7a7b2' AND value = 4;

UPDATE inform.compass_stances SET
  description = 'This stance holds that in-person voting with strict photo ID is the only reliable way to ensure election integrity and that mail-in voting—except for military overseas—creates opportunities for fraud that cannot be adequately controlled. Proponents argue that the security of elections requires a clear chain of custody for every ballot and that mail-in ballots undermine that chain. In-person voting on Election Day with secure identification is seen as the only defensible standard.',
  example_perspectives = ARRAY[
    'A voter who is deeply concerned about ballot chain-of-custody and sees mail-in voting as introducing uncontrollable risks may support in-person-only voting as the most secure option.',
    'Someone who believes that election integrity is a prerequisite for democratic legitimacy and sees mail-in ballots as inconsistent with that standard may hold this position.',
    'A voter who has concerns about the security protocols around mail ballot processing and signature verification may favor the definitive security of in-person, ID-verified voting.'
  ]
WHERE topic_id = 'd1792200-1d3b-4955-a0b7-0e6980d7a7b2' AND value = 5;

-- Topic: Social Media / Misinformation (ddd65d64-9dc7-4208-a30f-59f4b9c0653d)
UPDATE inform.compass_stances SET
  description = 'This stance holds that large social media platforms wield enormous power to spread false information at scale and that government must require them to remove demonstrably false content and subject their algorithms to regulatory oversight. Proponents argue that self-regulation has failed and that the harms from unchecked misinformation—to public health, elections, and social cohesion—are sufficiently severe to justify mandatory requirements. Platforms are seen as de facto public infrastructure that should be governed accordingly.',
  example_perspectives = ARRAY[
    'A public health professional who has seen medically false content deter vaccine uptake and increase disease spread may see mandatory content removal as a public health necessity.',
    'A researcher who studies the role of algorithmic amplification in spreading false content may see algorithm regulation as essential to addressing the structural driver of misinformation.',
    'A parent who has watched their children encounter demonstrably false content with real-world consequences may see platform accountability requirements as a reasonable protection.'
  ]
WHERE topic_id = 'ddd65d64-9dc7-4208-a30f-59f4b9c0653d' AND value = 1;

UPDATE inform.compass_stances SET
  description = 'This stance holds that social media platforms should be legally required to use fact-checking partnerships and to be transparent about how their algorithms decide what content to amplify. Proponents argue that mandatory fact-checking and algorithmic transparency give users and researchers the information needed to evaluate what they see, without the government itself determining what is true or false. The goal is accountability and transparency, not direct content censorship.',
  example_perspectives = ARRAY[
    'A journalist whose reporting has been dwarfed in reach by false content amplified by algorithms may see algorithmic transparency as essential to understanding and addressing the problem.',
    'A media literacy educator who believes that helping people evaluate content is more durable than removing it may see transparency and fact-checking as tools that build that capacity.',
    'A policymaker who sees mandatory fact-checking as less legally fraught than direct content removal mandates may favor this as a workable legislative approach.'
  ]
WHERE topic_id = 'ddd65d64-9dc7-4208-a30f-59f4b9c0653d' AND value = 2;

UPDATE inform.compass_stances SET
  description = 'This stance holds that voluntary industry standards developed through collaboration between platforms, researchers, and civil society organizations are a more appropriate and flexible response to online misinformation than government mandates. Proponents argue that platforms have strong reputational and business incentives to address harmful content and that voluntary frameworks can be updated faster than legislation to respond to a rapidly evolving information environment. Government-imposed content rules are seen as potential censorship vectors.',
  example_perspectives = ARRAY[
    'A technology industry professional who believes platforms are already investing significantly in content quality and safety may see voluntary standards as reflecting genuine accountability without government overreach.',
    'A First Amendment scholar who worries that government-mandated content rules would be used to suppress speech the government disfavors may prefer industry-led voluntary approaches.',
    'A civic organization that has worked with platforms to develop community standards may see voluntary collaboration as more effective and adaptive than regulatory requirements.'
  ]
WHERE topic_id = 'ddd65d64-9dc7-4208-a30f-59f4b9c0653d' AND value = 3;

UPDATE inform.compass_stances SET
  description = 'This stance holds that the free flow of information online is essential to public discourse and that government-mandated content standards pose a greater threat to free expression than misinformation itself. Proponents argue that "misinformation" is often contested speech where the government does not have the authority or the competence to be the arbiter of truth. Protecting online speech from government interference is seen as more important than addressing the harms attributed to false content.',
  example_perspectives = ARRAY[
    'A free speech advocate who believes that the cure of government-mandated content removal is worse than the disease of misinformation may see platform independence as the priority.',
    'A user who has seen true or contested content labeled as misinformation and removed may be skeptical of fact-checking systems and government mandates that could be misused.',
    'A political dissident or minority viewpoint holder who worries that misinformation rules will be applied selectively against disfavored speech may see platform independence from government as essential protection.'
  ]
WHERE topic_id = 'ddd65d64-9dc7-4208-a30f-59f4b9c0653d' AND value = 4;

UPDATE inform.compass_stances SET
  description = 'This stance holds that government should have no role whatsoever in what content platforms allow or remove, and that any government involvement in content moderation is inherently a form of censorship that violates the First Amendment. Proponents argue that once government is permitted to influence content decisions, the potential for abuse is unbounded. Platforms are private companies that should make content decisions independently without any government pressure, incentive, or requirement.',
  example_perspectives = ARRAY[
    'A constitutional strict constructionist who reads the First Amendment as prohibiting any government role in speech regulation—including pressure on private platforms—may see any involvement as unconstitutional.',
    'A political outsider who believes government has historically used speech regulation to suppress challenges to its authority may see zero government involvement as the only safe standard.',
    'A platform entrepreneur who believes that government entanglement in content decisions creates impossible compliance obligations and chilling effects on speech may oppose all forms of government content involvement.'
  ]
WHERE topic_id = 'ddd65d64-9dc7-4208-a30f-59f4b9c0653d' AND value = 5;

-- Topic: Healthcare Access (e8dad4a8-eb93-4931-91f5-d8fb5d7dd529)
UPDATE inform.compass_stances SET
  description = 'This stance holds that healthcare is a public good and that a publicly funded, publicly administered system is the most efficient and equitable way to ensure everyone receives care based on medical need rather than ability to pay. Proponents argue that private profit extraction and insurance overhead make the current system more expensive and less accessible than comparable countries with public systems. Universal public healthcare is seen as both more humane and more economically rational.',
  example_perspectives = ARRAY[
    'A person who has delayed or skipped care due to cost and suffered worse health outcomes as a result may see publicly funded universal coverage as the intervention that would have made a concrete difference.',
    'A physician who practices in a community with high rates of uninsured patients and absorbs uncompensated care costs may see a universal system as removing a structural inequity.',
    'A health economist who has compared per-capita costs and outcomes across countries may see publicly administered systems as producing better value than the current mixed approach.'
  ]
WHERE topic_id = 'e8dad4a8-eb93-4931-91f5-d8fb5d7dd529' AND value = 1;

UPDATE inform.compass_stances SET
  description = 'This stance holds that everyone should have access to affordable healthcare coverage through a combination of expanded public programs and regulated private insurance that together eliminate gaps in coverage. It supports both a public option and regulated private plans, allowing people to choose while ensuring no one goes uncovered. Proponents see a well-regulated mixed system as capable of achieving near-universal coverage without the political and logistical challenges of full public administration.',
  example_perspectives = ARRAY[
    'A self-employed person who wants coverage options but cannot afford current individual market prices may see a regulated mixed system with a public option as providing the affordable choice they need.',
    'A voter who values having a choice between public and private coverage may support a mixed system that preserves that option while ensuring everyone can access something.',
    'A health policy analyst who sees the mixed regulated model working well in other countries may view it as an achievable path to near-universal coverage within the existing institutional landscape.'
  ]
WHERE topic_id = 'e8dad4a8-eb93-4931-91f5-d8fb5d7dd529' AND value = 2;

UPDATE inform.compass_stances SET
  description = 'This stance holds that the existing combination of employer-sponsored insurance, public programs for the elderly and low-income, and private individual market coverage serves most people adequately and should be refined rather than restructured. Proponents support expanding Medicaid and Medicare to close specific gaps while maintaining the private market for the majority. Incremental improvement within the existing framework is seen as more achievable and less disruptive than systemic redesign.',
  example_perspectives = ARRAY[
    'An employer who provides health benefits and has built their compensation structure around them may resist system changes that could disrupt that arrangement.',
    'A voter who has employer coverage they like and is primarily concerned about protecting it from disruption may prefer incremental gap-closure to broader overhaul.',
    'A policymaker who sees the politics of full system redesign as prohibitive may favor targeted expansions of existing programs as the achievable path to meaningful improvement.'
  ]
WHERE topic_id = 'e8dad4a8-eb93-4931-91f5-d8fb5d7dd529' AND value = 3;

UPDATE inform.compass_stances SET
  description = 'This stance holds that public healthcare assistance should be reserved for those who cannot access employer coverage and genuinely cannot afford private insurance, with everyone else obtaining coverage through their employer or the private market. Proponents argue that broad public programs crowd out private alternatives and create fiscal obligations that are not sustainable. Targeted assistance for defined populations of genuine need is seen as the appropriate scope for government involvement.',
  example_perspectives = ARRAY[
    'A fiscal steward focused on long-term government solvency may see means-tested assistance as a more defensible commitment than open-ended public coverage programs.',
    'A private insurance professional who believes competitive markets produce better products and lower costs than government administration may support limiting government programs to avoid crowding out private alternatives.',
    'A voter who has employer coverage and is satisfied with it may oppose broader public programs they believe will be funded by their taxes without improving their own coverage.'
  ]
WHERE topic_id = 'e8dad4a8-eb93-4931-91f5-d8fb5d7dd529' AND value = 4;

UPDATE inform.compass_stances SET
  description = 'This stance holds that healthcare is best provided by competitive private markets without government administration, programs, or mandates, and that removing government from healthcare would restore price competition, consumer choice, and provider innovation. Proponents argue that government involvement has driven up costs, reduced innovation, and made healthcare less responsive to individual needs than a competitive private market would. They see deregulated markets as capable of producing accessible, high-quality care.',
  example_perspectives = ARRAY[
    'A provider who feels that government reimbursement rates and regulatory requirements reduce the quality of care they can deliver may support full privatization.',
    'Someone who believes every sector that government has taken over has become more expensive and less efficient may see healthcare privatization as consistent with that observation.',
    'A voter deeply skeptical of government administration who believes market competition consistently produces better outcomes may favor complete withdrawal of government from the healthcare market.'
  ]
WHERE topic_id = 'e8dad4a8-eb93-4931-91f5-d8fb5d7dd529' AND value = 5;

-- Topic: Climate / Energy (f1e44d66-5d27-4b51-b54f-b7ace86f6a3c)
UPDATE inform.compass_stances SET
  description = 'This stance holds that climate change represents an emergency requiring immediate, comprehensive action and that any further increase in carbon emissions is incompatible with preventing catastrophic warming. Declaring an emergency and banning all activities that increase carbon output is seen as proportionate to the scale and urgency of the threat. Proponents argue that incremental steps are insufficient given the speed of physical change already occurring.',
  example_perspectives = ARRAY[
    'A climate scientist who tracks emissions trajectories and remaining carbon budget may see emergency powers and a carbon ban as the only response scaled to the scientific evidence.',
    'A young person who will live with the consequences of decisions made now may view insufficient action today as a burden unjustly imposed on their generation.',
    'A coastal resident who has already experienced flooding, erosion, or storm intensification may see the urgency as a lived reality rather than a projection.'
  ]
WHERE topic_id = 'f1e44d66-5d27-4b51-b54f-b7ace86f6a3c' AND value = 1;

UPDATE inform.compass_stances SET
  description = 'This stance holds that transitioning to renewable energy sources and phasing out fossil fuels by 2030 is both necessary and achievable given current technology costs and deployment rates. Proponents argue that the economic case for renewables is now strong enough that an accelerated transition serves both climate and economic goals. A rapid but managed transition is seen as preferable to either a sudden ban or an unmanaged continuation of fossil fuels.',
  example_perspectives = ARRAY[
    'A renewable energy worker who sees the sector''s rapid job growth and cost declines may view a 2030 transition as ambitious but achievable given current trajectories.',
    'An investor in clean energy infrastructure who sees fossil fuel assets as increasingly stranded may support policies that accelerate the transition their investments depend on.',
    'A community vulnerable to climate impacts that has also seen local renewable project economic benefits may support rapid transition as serving both climate and local economic goals.'
  ]
WHERE topic_id = 'f1e44d66-5d27-4b51-b54f-b7ace86f6a3c' AND value = 2;

UPDATE inform.compass_stances SET
  description = 'This stance holds that investment in clean energy technology, combined with a gradual reduction of fossil fuel reliance over time, represents the most practical path to meaningful emissions reductions without disrupting energy security or economic stability. Proponents see this as taking the problem seriously while managing the transition at a pace that allows industries and communities to adapt. Clean energy investment and gradual fossil fuel reduction are complementary goals that need not conflict.',
  example_perspectives = ARRAY[
    'An energy industry worker who wants to see the sector evolve but needs time for workforce transition may support gradual change over abrupt policy shifts.',
    'A utility executive managing a large fossil fuel fleet who is already investing in renewable capacity may support a managed transition over one mandated to complete by a near-term date.',
    'A voter who accepts the scientific case for action but is concerned about energy prices and reliability may favor a transition paced to avoid disruption to household energy costs.'
  ]
WHERE topic_id = 'f1e44d66-5d27-4b51-b54f-b7ace86f6a3c' AND value = 3;

UPDATE inform.compass_stances SET
  description = 'This stance holds that market forces, rather than government mandates, should drive any transition to cleaner energy sources, as cost reductions in renewables are already producing that transition organically. Proponents argue that government energy mandates impose costs and reduce flexibility without achieving better outcomes than markets would produce through normal investment and innovation. Energy choices should be driven by economics rather than regulation.',
  example_perspectives = ARRAY[
    'An energy investor who has already shifted toward renewables based on economics may argue that the market is already achieving the transition that government mandates claim to be necessary.',
    'A small business owner who worries about energy price increases from mandates may prefer market-driven transitions that respond to real cost conditions.',
    'Someone who believes government energy mandates consistently produce poor outcomes—including higher costs and less reliable supply—may see market-led transition as producing better results.'
  ]
WHERE topic_id = 'f1e44d66-5d27-4b51-b54f-b7ace86f6a3c' AND value = 4;

UPDATE inform.compass_stances SET
  description = 'This stance holds that climate change policies impose significant economic costs while their benefits are uncertain or overstated, and that economic growth and energy abundance should take precedence over emissions targets. Proponents argue that affordable, abundant energy—primarily from fossil fuels—is the foundation of economic prosperity and that restricting it in pursuit of climate goals harms working people and developing nations most. They see economic strength as more important and more achievable than climate targets.',
  example_perspectives = ARRAY[
    'A worker in an energy-producing region whose livelihood depends on fossil fuel extraction may see climate policies as a direct economic threat to their community and industry.',
    'A voter who is skeptical of the projected impacts of climate change and views energy abundance as a core driver of living standards may see climate policies as solving an overstated problem at real cost.',
    'A business owner focused on energy costs as a major operational expense may prioritize affordable energy over emissions considerations when evaluating policy options.'
  ]
WHERE topic_id = 'f1e44d66-5d27-4b51-b54f-b7ace86f6a3c' AND value = 5;

-- Topic: AI Regulation v2 (f2a62698-a64c-4f7f-8fba-5971d35c51cf)
UPDATE inform.compass_stances SET
  description = 'This stance holds that AI development should proceed without government interference and that the benefits of rapid AI innovation—in medicine, productivity, and problem-solving—are best unlocked by removing regulatory friction. Proponents argue that premature regulation before harms are demonstrated locks in current approaches and puts domestic companies at a competitive disadvantage. Markets and competition will produce appropriate safety incentives without mandates.',
  example_perspectives = ARRAY[
    'A founder building an AI-powered startup may see regulatory requirements as barriers that slow innovation without addressing actual, proven harms.',
    'A researcher who sees AI''s potential to accelerate scientific discovery may view regulatory friction as an obstacle to breakthroughs that would benefit humanity.',
    'An investor who believes domestic AI leadership depends on a permissive development environment may support removing regulations to maintain competitive advantage.'
  ]
WHERE topic_id = 'f2a62698-a64c-4f7f-8fba-5971d35c51cf' AND value = 1;

UPDATE inform.compass_stances SET
  description = 'This stance holds that AI companies should primarily govern themselves through industry standards and voluntary commitments, with government playing a convening and guiding role rather than imposing mandatory requirements. Proponents argue that voluntary frameworks can be updated more flexibly than legislation and that competitive reputational pressure creates meaningful incentives for responsible development. Government oversight is seen as a last resort rather than a default.',
  example_perspectives = ARRAY[
    'A technology policy professional who has seen rigid regulations outlast the problems they were designed to solve may favor flexible voluntary standards that can adapt to a fast-moving field.',
    'A company executive who wants to demonstrate responsible AI practices without being constrained by regulations written before the technology is fully understood may prefer voluntary commitments.',
    'A researcher who believes voluntary best practices can achieve outcomes comparable to regulation without the rigidity may favor this approach.'
  ]
WHERE topic_id = 'f2a62698-a64c-4f7f-8fba-5971d35c51cf' AND value = 2;

UPDATE inform.compass_stances SET
  description = 'This stance holds that AI systems should be required to undergo basic safety testing before public release, as a standard product safety principle that already applies to pharmaceuticals, vehicles, and other consequential technologies. Proponents argue that requiring testing before deployment is a minimal and proportionate safeguard that catches problems before they scale. Pre-release testing is seen as consistent with normal product responsibility norms rather than extraordinary intervention.',
  example_perspectives = ARRAY[
    'A consumer safety advocate who sees AI as a product that can cause harm—and therefore subject to the same pre-deployment testing as other products—may see this as applying an established principle.',
    'A healthcare professional considering AI-assisted diagnostic tools may want to know those systems passed safety testing before being used in clinical decisions.',
    'A voter who sees recent AI failures—including hiring discrimination and false outputs in consequential settings—may see basic pre-release testing as the minimum necessary safeguard.'
  ]
WHERE topic_id = 'f2a62698-a64c-4f7f-8fba-5971d35c51cf' AND value = 3;

UPDATE inform.compass_stances SET
  description = 'This stance holds that advanced AI systems should be subject to close government monitoring and must obtain approval before deployment, given the potential for significant and hard-to-reverse societal effects. Proponents argue that the capabilities of frontier AI systems have outpaced the ability of companies and markets to self-govern, and that government oversight is necessary to prevent large-scale harms before they occur. Pre-deployment review is seen as proportionate to the stakes.',
  example_perspectives = ARRAY[
    'A national security official who tracks AI capabilities relevant to critical infrastructure may see government review before deployment as essential to managing systemic risks.',
    'A policymaker who has watched other powerful technologies require regulatory frameworks and views AI as analogous may see close monitoring as the appropriate institutional response.',
    'A citizen concerned about autonomous AI systems making decisions in law enforcement, hiring, or financial markets may want government review before those systems are deployed at scale.'
  ]
WHERE topic_id = 'f2a62698-a64c-4f7f-8fba-5971d35c51cf' AND value = 4;

UPDATE inform.compass_stances SET
  description = 'This stance holds that AI development poses sufficiently serious risks—to employment, autonomy, security, or existential safety—that comprehensive regulation and bans on the highest-risk systems are necessary. Proponents argue that the pace of AI capability growth has outrun society''s ability to understand and govern its implications, and that the precautionary principle requires treating it as a highly regulated industry. Only strict controls can prevent outcomes that would be irreversible if allowed to occur.',
  example_perspectives = ARRAY[
    'An AI safety researcher focused on catastrophic risk scenarios may believe that only strict pre-approval requirements and specific capability bans provide sufficient protection.',
    'A labor economist who tracks AI-driven displacement may see comprehensive regulation as the only way to manage the pace of change in a way that allows workers and institutions to adapt.',
    'A person who believes that some AI applications—in autonomous weapons, mass surveillance, or critical infrastructure—should simply not exist may support bans as the appropriate response to those specific risks.'
  ]
WHERE topic_id = 'f2a62698-a64c-4f7f-8fba-5971d35c51cf' AND value = 5;

-- Topic: Tax Policy v2 (f7e5678d-dadd-4556-a2fc-446e24642ceb)
UPDATE inform.compass_stances SET
  description = 'This stance holds that wealth and corporate income concentration has reached a level where significantly higher taxes on high earners and large companies are necessary both to fund expanded public services and to rebalance economic power. Proponents argue that under-taxing at the top has produced both underinvestment in public goods and growing inequality that undermines social mobility. Significant tax increases on those with the most are seen as economically sound and long overdue.',
  example_perspectives = ARRAY[
    'A social services provider who sees public programs underfunded relative to need may view higher taxes on wealthy individuals and corporations as the most available source of revenue to close those gaps.',
    'A worker whose wages have stagnated while corporate profits grew may see higher corporate taxes as a structural correction to an imbalanced distribution of economic gains.',
    'An economist who studies the relationship between tax rates, inequality, and public investment may see higher marginal rates as consistent with evidence on opportunity and long-term growth.'
  ]
WHERE topic_id = 'f7e5678d-dadd-4556-a2fc-446e24642ceb' AND value = 1;

UPDATE inform.compass_stances SET
  description = 'This stance holds that modest, targeted increases in tax rates on higher incomes and larger corporations can generate meaningful revenue for existing public services without broadly disrupting investment or middle-income households. Proponents argue that the top of the income and corporate profit distributions can absorb moderate rate increases without significant economic harm. This is seen as a calibrated adjustment rather than a fundamental restructuring of the tax system.',
  example_perspectives = ARRAY[
    'A middle-income taxpayer who is satisfied with current rates but sees specific public services deteriorating may support moderate increases on those at the top as a way to fund improvements without affecting their own taxes.',
    'A fiscal analyst who believes modest rate adjustments on high earners are the path of least economic disruption may favor this targeted approach.',
    'A voter who wants public services to function well and sees well-resourced households as able to contribute marginally more may see this as a fair and proportionate adjustment.'
  ]
WHERE topic_id = 'f7e5678d-dadd-4556-a2fc-446e24642ceb' AND value = 2;

UPDATE inform.compass_stances SET
  description = 'This stance holds that the current tax system is broadly appropriate and that the priority should be ensuring existing rates are applied consistently and that loopholes and deductions that allow some to pay far less than the stated rate are eliminated. Proponents argue that closing the gap between what the law says and what many actually pay is more equitable and generates more revenue than raising rates on those who are already paying. Consistent enforcement of existing obligations is the primary goal.',
  example_perspectives = ARRAY[
    'A wage earner who pays their full tax obligation and is aware that some wealthy individuals and corporations pay significantly less through tax engineering may see loophole closure as a basic fairness issue.',
    'A tax compliance professional who sees how aggressive tax planning produces dramatic deviations from stated rates may view consistent enforcement as the most impactful reform.',
    'A voter who believes the system would work well if applied as written may prefer enforcing existing law to changing rates.'
  ]
WHERE topic_id = 'f7e5678d-dadd-4556-a2fc-446e24642ceb' AND value = 3;

UPDATE inform.compass_stances SET
  description = 'This stance holds that reducing tax rates across all income levels stimulates economic activity, investment, and hiring in ways that generate growth and broadly distributed prosperity. Proponents argue that government spending funded by high taxes is less efficient than private investment and consumption, and that cutting taxes allows individuals and businesses to make better decisions about resource allocation. Tax reduction is seen as a tool for economic expansion rather than a benefit only to high earners.',
  example_perspectives = ARRAY[
    'A small business owner who believes retaining more of their revenue would allow them to invest in equipment or additional employees may support across-the-board tax cuts.',
    'An investor who believes lower rates on capital gains encourage productive risk-taking and investment may see rate cuts as pro-growth for the broader economy.',
    'A voter who believes their own financial decisions are better than government spending decisions may see tax reduction as restoring economic freedom and efficiency.'
  ]
WHERE topic_id = 'f7e5678d-dadd-4556-a2fc-446e24642ceb' AND value = 4;

UPDATE inform.compass_stances SET
  description = 'This stance holds that the overall tax burden on individuals and businesses is far too high and that dramatic reductions are necessary to restore economic dynamism, individual freedom, and the proper scope of government. Proponents argue that large government—funded by high taxes—crowds out private sector growth, creates dependency, and reduces the individual liberty that is foundational to a free society. Drastic tax cuts are seen as both economically beneficial and an expression of core values about the proper relationship between citizens and government.',
  example_perspectives = ARRAY[
    'An entrepreneur who has built a business and believes they should keep the vast majority of what they earn may see current tax rates as an unjustified claim on the results of their effort.',
    'A voter who fundamentally believes in limited government and sees current tax levels as financing a government far larger than it should be may support drastic cuts as a matter of principle.',
    'Someone who has studied countries with lower tax burdens and sees evidence of higher growth may see dramatic tax reduction as the most effective economic policy available.'
  ]
WHERE topic_id = 'f7e5678d-dadd-4556-a2fc-446e24642ceb' AND value = 5;
