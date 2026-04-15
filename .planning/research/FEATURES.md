# Feature Research

**Domain:** Civic deliberation forum — structured discussion platform for authenticated citizens
**Researched:** 2026-04-15
**Confidence:** HIGH (table stakes/anti-features); MEDIUM (differentiators — civic-specific patterns are newer)

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist in any forum. Missing these = product feels broken or incomplete before it even starts.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Thread list with pagination/load-more | Every forum has this; users scan before committing | LOW | Chronological or newest-first is fine for v1; avoid engagement-sorted by default |
| Thread creation (title + body) | Core posting action; without it, no forum exists | LOW | Requires Connected Account auth; gate clearly |
| Threaded replies | Users expect to reply to specific comments, not just top-level | MEDIUM | Flat or 1-level-deep nesting sufficient for v1; deep nesting adds complexity |
| Read-open / post-gated access | Standard civic forum pattern: browse freely, contribute when authenticated | LOW | Must be explicit — unauthenticated users see full content |
| User display name (pseudonym) | Users need to know who said what; identity continuity matters for discourse quality | LOW | display_name only — never legal identity; research confirms stable pseudonyms produce highest comment quality |
| Persistent post history | Once posted, content remains; users can be held accountable | LOW | "Memory over Moderation" principle; no delete capability for users |
| Post timestamp + author attribution | Every post needs when/who for context and accountability | LOW | Trivial to implement; critical for trust |
| Topic/hub organization | Forum organized by subject area, not as one flat stream | LOW | Already planned: one hub per Compass topic |
| Search within forum | Users need to find prior discussion before posting duplicate | MEDIUM | Full-text search on threads + replies; avoids thread proliferation |
| Mobile-responsive layout | Majority of civic engagement happens on phones | MEDIUM | CSS/layout concern, not a separate feature |
| Basic text formatting (Markdown or WYSIWYG) | Users expect bold, links, quotes in posts | LOW | Markdown is lighter; WYSIWYG adds editor complexity |
| @mention notifications | Users expect to be notified when addressed directly | MEDIUM | Requires notification infrastructure; drives return visits legitimately |

### Differentiators (Competitive Advantage)

Features that distinguish a civic deliberation space from a general forum. These align with the project's core value propositions.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Stance cards (5 preset positions per hub) | Reduces friction to entry — users pick a position before debating; surfaces opinion distribution at a glance | MEDIUM | Preset positions avoid partisan framing; must be authored carefully; no "Republican" / "Democrat" labels ever |
| Edit history visible to all | "Memory over Moderation" made real — edits are never hidden; builds accountability norm | LOW | Store versions in DB; surface as "edited — view history" link; this is Focused Communities' core differentiator vs Reddit (which hides edit history) |
| Compass integration entry point | Users arrive from their self-assessed position on a topic, not from algorithmic feed | LOW | Entry point context: user knows their own compass stance when they land |
| No algorithmic sorting | All threads visible in chronological order; no engagement amplification | LOW | Chronological default eliminates the core engagement-bait mechanism; positions the platform against Reddit/Twitter |
| Authenticated-citizen identity (pseudonymous) | Durable pseudonyms proven to produce highest discourse quality; not fully anonymous (disposable), not real-name (chilling effect) | MEDIUM | Connected Account provides durable identity; research at Disqus and academic studies confirm this is optimal for discourse quality |
| Stance-aware thread context | Each thread optionally tagged with the poster's stance card position | LOW | Lets readers see where an argument originates without revealing identity; enables perspective-diversity tracking |
| Hub-scoped discussion (one per Compass topic) | Focused conversation on a single civic topic, not a general multi-topic forum | LOW | Prevents topic drift; aligns with Compass structure |
| No private messaging (v1) | Eliminates off-platform coordination, brigading, and harassment vectors from the start | LOW | Deliberate absence; forces all discourse to be public and auditable |
| Reply-to-thread (not DM) as sole interaction mode | All responses visible to all; no shadow conversations | LOW | Aligns with civic transparency norms |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good, are frequently requested or assumed, but actively harm civic deliberation. These are deliberate exclusions, not oversights.

| Anti-Feature | Why Requested | Why Harmful for Civic Deliberation | Alternative / What We Do Instead |
|--------------|---------------|-------------------------------------|----------------------------------|
| Downvoting / dislike buttons | Users want to signal disagreement quickly | Suppresses minority viewpoints and dissenting voices; research shows downvotes used to punish out-group, not assess quality; creates groupthink in political contexts | Upvote-only or no-vote initially; disagreement expressed through replies |
| Karma / reputation score | Gamification motivates participation | Karma systems create dual incentive (quality + power); dominant views accumulate voting power; dissenting voices get suppressed; EA Forum and LessWrong have documented this pathology extensively | Display stance card affiliation; no numeric score |
| Algorithmic feed / "Hot" sorting | Shows "best" content first | The core mechanism of engagement-bait; amplifies outrage; "rage bait" named Oxford Word of the Year 2025; research confirms engagement and user welfare diverge under algorithmic ranking | Chronological thread list; no ranking |
| Post deletion by user | Users want to retract statements | Destroys accountability and trust; allows context-washing (say something, delete it when challenged); violates Memory over Moderation principle | Edits are versioned and visible; nothing deleted; moderation-only soft-hide for ToS violations |
| Silent editing (no edit history) | Simpler UX | Allows stealth revision of positions after replies; fundamentally undermines accountability in civic discourse | All edits logged with timestamp; edit history public |
| Anonymous posting (no account) | Lowers barrier to entry | Research confirms disposable anonymity produces lowest discourse quality; no accountability for behavior; attracts bad-faith actors | Pseudonymous with Connected Account — durable identity without legal exposure |
| Party / affiliation labels | Seems like useful context | Directly contradicts Anti-partisan principle; reduces people to tribal identity; triggers partisan heuristics instead of argument evaluation | Stance card positions (issue-specific, not partisan) |
| Real-name display | Seems to improve accountability | Research shows real-name requirements REDUCE discourse quality vs. stable pseudonyms; chilling effect; prevents participation by those with professional/personal exposure risk | display_name (stable pseudonym) tied to authenticated account |
| Private messaging / DMs | Users expect it from social platforms | Creates harassment vectors; enables off-forum coordination and brigading; removes transparency from civic discourse | All interaction is public thread-based |
| Push notifications for engagement metrics | Drives return visits | Triggers dopamine loops unrelated to deliberation; users return to check likes/karma, not to read arguments | Notifications only for direct @mentions and thread replies |
| Infinite scroll feed | "Seamless" browsing | Eliminates natural stopping points; associated with compulsive engagement patterns; makes it hard to track where you left off | Paginated thread list with clear position tracking |
| Share-to-social buttons | Virality and growth | Exports civic discourse into engagement-optimized platforms where context is stripped; invites brigading from outside communities | Link-only sharing (URL copy); no platform-native share button |
| Trending / Popular sections | Highlights active discussion | Amplifies already-loud voices; creates self-reinforcing popularity; recency bias against slow-developing important threads | All hubs equally visible in community directory; no trending |

---

## Feature Dependencies

```
[Connected Account auth]
    └──required by──> [Thread creation]
    └──required by──> [Replies]
    └──required by──> [Stance card selection]
    └──required by──> [@mention notifications]

[Thread creation]
    └──required by──> [Thread list]
    └──required by──> [Thread view]

[Thread view]
    └──required by──> [Replies]
    └──required by──> [Edit history visibility]

[Stance cards (5 preset positions)]
    └──enhances──> [Thread context / stance-aware posting]
    └──required by──> [Compass integration entry point]

[Edit history storage]
    └──required by──> [Edit history visibility]
    └──enables──> [Memory over Moderation principle]

[Hub structure (one per Compass topic)]
    └──required by──> [Community directory]
    └──required by──> [Forum scoping]
    └──enables──> [Stance card per hub]

[Community directory]
    └──requires──> [Hub structure]

[Search]
    └──enhances──> [Thread list] (independent, can defer)

[@mention notifications]
    └──requires──> [User identity / display_name]
    └──requires──> [Notification infrastructure]
```

### Dependency Notes

- **Connected Account blocks everything interactive:** Auth is a hard prerequisite for any write action. The "read open / post gated" pattern must be implemented before any posting features.
- **Hub structure before forum:** The community directory and hub pages must exist before threads can be scoped correctly. Hub structure is Phase 1.
- **Stance cards before Compass integration:** Stance cards need to exist before the Compass spoke can link into a pre-selected position. These can launch together.
- **Edit history storage must be designed before launch:** Adding it retroactively means all prior posts have no history — a trust gap. Schema must support versioning from day one.
- **Notifications are independent:** @mentions are valuable but not blocking for v1. Can be deferred to v1.x without damaging core experience.
- **Search is independent:** Can be deferred to v1.x. Thread list + browser Ctrl+F is acceptable initially.

---

## MVP Definition

### Launch With (v1)

Minimum viable product — what's needed for the civic deliberation experience to actually work.

- [x] Community directory — list of all hubs, one per Compass topic
- [x] Hub page — stance cards (5 preset positions) + forum entry point
- [x] Thread list — read-open, chronological, paginated
- [x] Thread creation — requires Connected Account, title + body
- [x] Thread view — full post + all replies, chronological
- [x] Reply to thread — flat or 1-level nesting, requires Connected Account
- [x] Edit with versioned history — all edits logged, history visible to any reader
- [x] Pseudonymous identity — display_name from Connected Account, never legal name
- [x] Entry points — Compass spoke link, Civic Spaces nav, user Profile page
- [x] No delete capability for users — enforce Memory over Moderation

### Add After Validation (v1.x)

Add once core is working and user behavior patterns are observable.

- [ ] @mention notifications — add when user base is large enough that mentions become meaningful
- [ ] Thread search — add when thread volume makes discovery genuinely difficult
- [ ] Stance-aware thread tagging — surface poster's stance card position on each post
- [ ] Report / flag for moderation — add before significant user volume; essential for ToS enforcement at scale

### Future Consideration (v2+)

Do not build until product-market fit is established. These are in future phases.

- [ ] Badges — planned for future phase; do not build in v1
- [ ] Symposiums — structured async debate sessions; complex, deferred
- [ ] Argument maps (Kialo-style) — high value for civic deliberation but high complexity; v2+
- [ ] Veracity Rating integration — depends on external system; deferred
- [ ] Maturity tiers — access levels based on participation history; deferred
- [ ] AI moderation assistant — emerging capability; verify carefully before implementing

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Community directory | HIGH | LOW | P1 |
| Hub page + stance cards | HIGH | LOW | P1 |
| Thread list (read-open) | HIGH | LOW | P1 |
| Thread creation | HIGH | LOW | P1 |
| Thread view + replies | HIGH | LOW | P1 |
| Edit with versioned history | HIGH | LOW | P1 |
| Pseudonymous identity | HIGH | LOW | P1 |
| Chronological sort (no algorithm) | HIGH | LOW | P1 |
| Compass entry point integration | HIGH | LOW | P1 |
| @mention notifications | MEDIUM | MEDIUM | P2 |
| Search | MEDIUM | MEDIUM | P2 |
| Stance-aware post tagging | MEDIUM | LOW | P2 |
| Report / flag for moderation | HIGH | MEDIUM | P2 |
| Argument maps | HIGH | HIGH | P3 |
| Badges | MEDIUM | MEDIUM | P3 |
| Symposiums | HIGH | HIGH | P3 |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

---

## Competitor Feature Analysis

| Feature | Reddit (r/ChangeMyView) | Kialo | Polis | Discourse | Focused Communities v1 |
|---------|------------------------|-------|-------|-----------|------------------------|
| Thread model | Flat + nested comments | Argument tree (pro/con) | No threads — statement voting | Flat threads | Flat threads (Reddit-like) |
| Identity | Pseudonymous, no auth required | Pseudonymous | Fully anonymous | Trust-leveled pseudonymous | Pseudonymous + authenticated (Connected Account) |
| Edit visibility | Hidden (no public edit history) | Change tracking shown | N/A | Visible edit history | Full version history, always visible |
| Voting | Up + down vote | Impact voting on arguments | Agree / Disagree / Pass | Like only | None in v1 (deliberate) |
| Content removal | User-delete allowed; mod-delete | Moderated | N/A | User-delete + mod | No user delete; mod-only soft-hide |
| Sorting | Hot / Top / New / Rising | Argument strength | Opinion clusters | Latest / Top | Chronological only |
| Entry from external | Any link | Direct | Embed | Any link | Compass spoke + nav + profile |
| Anti-partisan design | None | None | None | None | Core design constraint |
| Preset positions | None | Thesis-only | None | None | 5 stance cards per hub |
| Structured topic scope | Subreddit per topic | Per-discussion thesis | Per-conversation | Category | One hub per Compass topic |

**Key insight from comparison:** No reference platform combines (a) authenticated pseudonymity, (b) full edit history transparency, (c) no algorithmic sorting, and (d) anti-partisan preset positions. This combination is Focused Communities' genuine differentiation.

---

## Principle Conflict Flags

The following standard forum features conflict with stated design principles and must be explicitly excluded:

| Feature | Principle Violated | Risk if Included |
|---------|-------------------|------------------|
| Post deletion | Memory over Moderation | Users can context-wash; accountability destroyed |
| Silent editing | Memory over Moderation | Stealth position changes after replies; trust collapse |
| Party/ideology labels | Anti-partisan | Triggers tribal heuristics; undermines argument evaluation |
| Karma/score | Value-driven (misaligns incentives) | Users optimize for score, not for good argument |
| Downvotes | Value-driven | Suppresses dissenting civic viewpoints |
| Algorithmic sort | Value-driven | Platform goals (engagement) diverge from user goals (learning) |
| Legal identity display | Pseudonymous | Chilling effect; reduces participation quality per research |
| DMs/private messaging | Anti-partisan + transparency | Off-forum coordination; harassment; brigading |

---

## Sources

### Primary (MEDIUM-HIGH confidence — multiple sources cross-referenced)

- Disqus research on pseudonymous comment quality — confirmed by academic studies via The Conversation: https://theconversation.com/online-anonymity-study-found-stable-pseudonyms-created-a-more-civil-environment-than-real-user-names-171374
- Kialo Edu official features page: https://www.kialo-edu.com/features
- Discourse official features page: https://www.discourse.org/features
- Wikipedia on Kialo: https://en.wikipedia.org/wiki/Kialo
- Wikipedia on r/ChangeMyView: https://en.wikipedia.org/wiki/R/changemyview

### Secondary (MEDIUM confidence — WebSearch verified with multiple credible sources)

- Oxford University Press "rage bait" Word of the Year 2025: https://news.stanford.edu/stories/2025/12/rage-bait-explained-oxford-word-year
- Research on downvoting and polarization (EA Forum, LessWrong documented): https://forum.effectivealtruism.org/posts/SApmQrKdvgccmH2yF/revisiting-the-karma-system
- Nature study on toxic content and engagement divergence: https://www.promarket.org/2025/07/16/how-toxic-content-drives-user-engagement-on-social-media/
- Academic study: deliberation quality under anonymity vs pseudonymity vs real name: https://journals.sagepub.com/doi/abs/10.1177/0032321719891385
- DELiberationIO Stanford/MIT platform: https://stanforddaily.com/2025/09/24/digital-economy-lab-launches-platform/
- Polis overview: https://compdemocracy.org/polis/

### Tertiary (LOW confidence — WebSearch only, single source)

- SocialEngine's 15 forum features list (general forum landscape, not civic-specific): https://socialengine.com/blog/top-15-features-of-forum-software-for-building-online-community-in-2025/

---

*Feature research for: Civic deliberation forum (Focused Communities)*
*Researched: 2026-04-15*
*Valid until: ~2026-07-15 (stable domain; anti-features landscape is stable; platform comparisons valid ~90 days)*
