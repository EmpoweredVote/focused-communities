# Argument tree — decisions made during execution

**Plan:** `docs/superpowers/plans/2026-10-31-argument-tree.md`
**Spec:** `docs/superpowers/specs/2026-10-30-seasons-and-argument-tree-design.md`
**Executed:** 2026-10-31 — 2026-11-01, subagent-driven, with Chris Andrews.

A plan is a set of decisions made before the code exists. Executing one turns up questions the
plan could not have answered — conflicts between tasks, premises that were false by the time the
task ran, and gaps a reviewer found. Each was settled with a ruling and a note on what it costs
if it turns out wrong.

This file is the durable copy. The working ledger that held them lives in a git-ignored
directory and is deleted when the plan finishes; these outlive it, because the reasoning is
usually more useful than the diff.

**Reading it:** the rulings that change what the product does are set out in full first. The
rest are indexed by area with one line each. Numbers are the order they were made in, not their
importance.

---

## The ones that change the product

### R95 — a failed claim request must say so; an empty tree is a lie

The argument-tree API is built but not deployed, so every claim request 404s today. A band that
renders nothing on a failed fetch does something worse than show invented data: it makes a false
claim about the world — *"nobody has argued about this yet"* — on a platform whose entire purpose
is showing people the shape of a disagreement.

Band 3 therefore has three states that must be distinguishable in the DOM and to a screen
reader: loading, **failed** (naming the status), and loaded but genuinely empty. Failure and
emptiness do not share a code path, and a test asserting "renders nothing" would pass with the
bug present.

*Cost if wrong:* none found. The alternative is a silent falsehood on a live civic page.

### R91 — who may rate, and why the auth state name cannot answer it

The server's gate is `tier` in (`connected`, `empowered`) **and** `account_standing === 'active'`,
and it deliberately does **not** check `completed_onboarding` — calibration is not a write gate,
so a reader whose Compass is unfinished may still argue and rate.

The client's `AccessState` models none of that faithfully: `detectUserState()` branches on tier
and onboarding and never reads `account_standing`, so a suspended account arrives looking exactly
like a healthy connected one. Deriving the gate from the state name is wrong in both directions
at once.

*Cost if wrong:* too strict locks out a reader the server admits; too loose shows an enabled
control that 403s on click. Pinned by a test in each direction.

### R35 — a depth ceiling of 50, in three places

There was no maximum depth anywhere in the schema or the API. At depth 500 a single claim read
returns a half-megabyte breadcrumb, served to anonymous readers as `public, s-maxage=30` — so one
pathological claim would be cached and re-served rather than merely computed once.

Enforced in the route (422 before the write), in the breadcrumb query (`LIMIT`), and as a CHECK
constraint — because `postgres` is exempt from every grant and only a constraint binds it.

*Cost if wrong:* raising a cap is a one-constant change with no data migration; lowering one
orphans rows. Erring high is the cheap direction.

### R37 / R38 — impact is a stored generated column over a raw sum and count

The plan assumed `claims.impact` existed. It did not. It had to be stored rather than joined,
because the column ordering needs an index the planner can walk and the minimap returns impact
for up to 2000 nodes per request.

The trigger keeps two facts — `rating_count` and `rating_sum` — and `impact` is
`GENERATED ALWAYS AS (round((5*5 + rating_sum)/(5 + rating_count), 4)) STORED`. The formula then
lives in one place instead of being mirrored between SQL and TypeScript, and the raw sum and
count survive a change of formula: revise the prior weight and every historical impact
recomputes itself with no backfill.

An unrated claim reads exactly **5**, never null. That is what makes the ordering mean anything —
a claim carrying one rating of 1 scores 4.3333 and correctly sorts *below* an untouched one.

*Cost if wrong:* a generated expression must be immutable, so the weight is a literal and
changing it is a migration rather than a config change.

### R85 — nothing below `completeThroughDepth` may be drawn as a count, a balance, or an absence

Truncation of the shape response cuts *inside* a depth level, so the boundary level holds an
arbitrary subset of siblings — not a sample, not the first N by any meaningful order. A
pro/con balance drawn at a level the response does not describe completely is a fabricated
statistic, and the most damaging kind, because it looks authoritative.

An absence counts: *"this claim has no opposing arguments"* is a claim about the world, and below
the cut you do not know it. The screen-reader summary is bound by the same rule — a text
alternative more confident than the picture is worse than none.

🔴 **This ruling stated `null` the wrong way round, and the first live call after deploy caught
it.** It said `null` means "not even depth 0 is complete". It does not. The API documents the
opposite — *"null is the one encoding of 'the question does not apply', and the two fields are
read together or not at all"* — and sends `{ truncated: false, completeThroughDepth: null }`
whenever **nothing was cut**, which is every community today.

Read alone, that inverted the common case: every row was marked incomplete and the minimap
suppressed counts and balance on a whole tree. The component had implemented this ruling
faithfully, so the defect is the ruling's, not the code's.

**The correct rule:** nothing cut *and* no depth named is the only combination meaning "all of it
is here". Anything else falls through to the depth test, so a server disagreeing with itself
makes the map claim less rather than more. Fixed in focused-communities #72, with the live
response pinned as a test.

The lesson worth keeping: a ruling written from the spec and never exercised against a real
response is a hypothesis. Three reviewers and a mutation suite all passed over this one, because
every test encoded the same wrong premise the ruling did.

### R51 / R52 / R53 — what curation refuses

Three refusals the plan did not ask for, each closing something the schema permits:

- **Merge cycles are a separate check from parentage cycles.** `claims_not_own_ancestor`
  constrains parentage only; nothing constrains `merged_into_claim_id`, so chains (A→B→C) and
  cycles (A→B→A) are both possible today. The merge walk is separate and **bounded** — an
  unbounded walk over an existing cycle is a hung connection out of a three-connection pool.
- **Cross-community moves and merges are refused.** The position trigger copies `community_id`
  from the parent, so a cross-community move silently relocates a claim *and its whole subtree*
  into a question it was never written about.
- **A root can be neither moved, merged nor hidden.** All 61 roots are the community's question,
  not anyone's contribution. Hiding one would blank the question the page is about.

### R41 / R42 — what the public edit history may show

`claim_edits.actor_id` is a raw account uuid and NOT NULL, and the history endpoint is
unauthenticated. Returning it would publish a stable identifier for every editor to anonymous
readers.

Worse, a `hide` row carries `old_body` — so serving curation history would hand back the exact
text the tombstone exists to withhold. The endpoint serves `kind = 'edit'` only, and nothing at
all for a hidden claim.

*Cost if wrong:* readers cannot see who changed a claim, or that a Maven moved one. Both are
additive later; a leaked hidden body is not retractable.

### R99 — drafts are keyed by parent **and** side

The plan said "keyed by parent claim id so drafts do not leak between claims". That is one key
short: a reader can open the composer on the supports side, type, change their mind, and open it
on the opposes side of the *same* parent — and find their own supporting argument waiting there
as the opposing one.

### R30 / R32 — the seventeen Season 2 communities, and what "live" turned out to mean

Seventeen Season 2 Compass questions had no Focused Community, because a community had always
been a consequence of the Compass *publishing* a question. Chris chose to create them ahead of
publication, knowing the cost: the argument tree is permanent across seasons by design, so claims
written now are rooted in wording the Compass has not shipped and could still revise.

Making them "live" then turned out not to mean what either of us thought. `is_live` had already
stopped being the voter-facing gate — the promoted view filters on the open season and never
mentions it, and all 60 Season 2 topics were already visible and answerable. What the flag still
gated was the **contributor** side: two campaign-facing pages filter on it client-side, so
candidates were served 43 of the open season's 60 questions. Ten of the seventeen had **zero**
politician answers while every live topic averaged 883. Voters had been answering questions no
candidate was ever shown.

*Descriptions were left NULL on all seventeen*: every existing community carries editorial copy
in Chris's voice, and writing seventeen more would be invented content shipped to production.

---

## Everything else, by area

### Schema and migrations (CA_0341 – CA_0345)

| # | Ruling |
|---|---|
| R7 | The child-count trigger decrements as well as increments. |
| R13 | A new community is seeded its root claim by trigger, not by a backfill. |
| R14 | The count trigger carries an AFTER DELETE branch anyway — `postgres` is exempt from every grant, so it is the one actor a missing branch corrupts silently. |
| R19 | Widen `claim_edits` while it is still empty rather than after it has rows. |
| R20 | `has_table_privilege(role, table, 'SELECT,INSERT,UPDATE')` is **OR**, not AND — one call per privilege, or the gate can never fail. The same line is live in CA_0323. |
| R22 | The parent lock is `FOR UPDATE`, not `FOR SHARE` — two shared locks upgrading is a deadlock, killing the exact guarantee the lock exists to give. *(An implementer corrected me here.)* |
| R31 | `fc_community_slug` is set on all 61 topics, so the column keeps meaning "this topic's community" rather than "live topics only". |
| R39 | The rating-aggregate trigger carries INSERT, UPDATE **and** DELETE branches, with nested `TG_OP` guards — SQL does not promise `AND` short-circuits and `NEW` is unassigned on DELETE. |

### Read API

| # | Ruling |
|---|---|
| R21 | Three-term keyset pagination with impact in the cursor. |
| R23 | A cursor that decodes but cannot be used is a 400, not a 500 echoing the database's message. |
| R24 / R26 | `ShapeNode` carries `isHidden` and `mergedInto`. |
| R25 | `truncated: boolean` is insufficient; `completeThroughDepth` says where the description stops. |
| R28 | A merge target may be absent from the payload — do not fold, do not assume one hop, bound any walk. |
| R62 | Node pages are invalidated approximately and the shape key exactly, with the 30-second staleness **documented as a choice**. Cursor combinations cannot be enumerated and an epoch-in-key buys precision for a Redis round trip on every read. |
| R63 | Export the cache-key builders rather than rebuilding the strings. |
| R64 | Canonicalise the id on the delete side as well as the read side. |

### Write API

| # | Ruling |
|---|---|
| R33 | A hidden **ancestor** blocks a write, not only a hidden parent — an unreachable claim still inflates its parent's counts. |
| R34 | A merged parent refuses a child with 409 and names the target. |
| R36 | The rate limiter is consulted before the parent lookup, or the endpoint is a free existence oracle over claim ids. |
| R43 | `fc.actor_id` needs a real transaction with the client released in `finally` — not a CTE. |
| R44 | A non-author editor gets 404, not 403; that also makes roots uneditable with no special case. |
| R45 / R50 | A no-op edit succeeds and writes no history, and `updated_at` moves only when the trigger agrees something changed. |
| R47 / R48 / R49 | A merged claim refuses an edit (409, scoped so the target does not leak); a hidden claim's history is `200 {data: []}`, not 404; `myRating` is read back rather than stated null. |
| R54 | A move that would breach the depth cap is 422, not the 500 the constraint produces. |
| R55 | Hide does not touch descendants — an existing child stays readable under a tombstone; a **new** one may not be added. |
| R56 / R57 | Merge moves children, never ratings, never the aggregate columns, and deletes nothing. |
| R58 – R61 | A hidden or unreachable destination refuses; an already-merged claim cannot itself be merged again; merging *into* a root is refused; curation takes no connected-profile gate. **A merged claim may be a merge *target*, deliberately** — R28 says the target may be absent from a payload, so a client walks the chain a hop at a time, which is the whole reason the bounded chain walk exists. An earlier draft of this line said otherwise and was wrong; the final review caught it. |
| R67 | The cache delete is awaited before the response — it closes the read-after-write window, which is what a reader would actually notice. *(My own addendum had contradicted itself here.)* |
| R68 | Two deliberate over-invalidations, one of them labelled belt-and-braces rather than pretended to be tested. |

### Frontend

| # | Ruling |
|---|---|
| R69 | The endpoints are not deployed; that is a reason for honest errors and a dev-only demo fixture, never for invented data. |
| R70 | An optimistic rating sets `myRating` and nothing else — the client must not reproduce a prior weight that lives as a literal in a generated column. |
| R71 | Every query key that can carry `myRating` carries the viewer. *(This is the leak I shipped and caught in the seasons work; the fix is now pinned by a test.)* |
| R74 / R75 / R76 | Semantic side tokens, not brand ones; a dark-mode remap because `--color-ev-teal` is **2.66 : 1** on the dark card surface against coral's 5.63; coral is not a text colour on white at 3.14 : 1. |
| R78 | Impact is never printed as a number — a bar with a qualitative alternative. |
| R79 | Coral on the page background is **2.92 : 1** — recorded as a limit, with `--color-ev-coral-hover` as the escape hatch if cards ever sit there. |
| R80 / R81 | A hook owns `?claim=`, using the functional `setSearchParams` form (the object form silently drops `?season=`); a malformed value is rejected visibly. |
| R82 | The breadcrumb may be incomplete and the client cannot tell — it truncates the **deep** end, so the last item is not guaranteed to be the parent. |
| R86 / R87 / R89 | A focused claim below the cut gets an explanation and no marker; merged nodes are not folded; hidden nodes keep their place. |
| R88 / R94 | Side and impact may not share a palette on the minimap, where a dot has no label — but may on a card, where the side is already carried by the word and the rail. |
| R92 | One impact bar per card: the display moves into the control rather than being duplicated beside it. |
| R93 | A slider announces `aria-valuenow` — a bare number — unless `aria-valuetext` is set; a radiogroup is the safer default. |
| R96 / R97 | One writer for `?claim=`; the no-remount test belongs against the page, where it actually bites. |
| R100 | The badges slot stays genuinely empty — a placeholder badge is invented data on a production page. |
| R101 | The minimap's drawing is decorative; its **nodes** are the controls and keep real accessible names. |
| R102 | `canRate={false}` renders no affordance rather than a disabled one, and the view supplies the reason the component cannot know. |

### Process

| # | Ruling |
|---|---|
| R5 | "Maven-or-Admin" cannot be chained middleware — chaining two guards means AND. A local helper, which also keeps `supabaseAdmin` out of a route file. |
| R8 | Task 5 also had to modify Task 2's files; the plan's file list was short. |
| R10 / R23 | `@empoweredvote/ev-ui` is named in `CLAUDE.md` but is not a dependency and is imported nowhere — use the repo's own tokens. |
| R73 | The demo flag blocks writes on claim paths only, so enabling the demo tree does not break posting a reply against the live thread API. |

---

### R103 — the route is the authority; a ruling written from memory is not

R98 named the wrong statuses for two write failures. A hidden parent is **404
`CLAIM_NOT_FOUND`**, not 409 or 422; 409 is `CLAIM_MERGED` and 422 is `MAX_DEPTH_REACHED`. The
implementer built against the route rather than the ruling, which is right.

---

## Still open, deliberately

- **Task 5's aggregate ignores the brigading metadata it records.** `rater_account_age_days` and
  `rater_verification_status` are written at rating time because they cannot be reconstructed
  later; weighting them is a product decision nobody has made.
- **The hidden-ancestor race** (R33) is narrow and owned by hide: `FOR UPDATE` locks the parent,
  not the ancestors, so an ancestor hidden between a statement's snapshot and its commit still
  admits one child.
- **`GET /claims/:claimId/edits` ships with no consumer.** Built, typed and tested; no task in
  this plan renders claim edit history.
- **CA_0323 carries the same OR-not-AND privilege check** that R20 fixed here.
- **`service_role` retains `TRIGGER` on `claim_edits`** — schema-wide, so fixing three tables
  would be false closure.
- **The seventeen new communities have NULL descriptions** awaiting editorial copy.
- **"Immigration & Treatment of Immigrants"** has a community whose topic appears only in the
  closed Season 1, so its page shows a single past season with no explanation.

## What the final review found

Two reviewers, one per repo, each given this file as **claims to test rather than settled fact**.

**API — 0 Critical, 4 Important, 9 Minor.** One was a real hole and is fixed: the rating upsert
guarded visibility and merge state but not parentage, so any connected account could rate a
community's **root** — whose id is one public GET away — and that impact was served on the root
node and drawn as the depth-0 dot on the minimap, reading as a rating of the question itself.
Every other write already refused a root; rating was the one gap, and no test covered it.

The reviewer also corrected this document, which is why it is written down above: an earlier
draft of the R58–R61 line claimed already-merged *destinations* refuse. They do not, deliberately.

**UI — 2 Critical, 9 Important, 10 Minor.** The first Critical is fixed: every id in the demo
fixture read `demo-claim-s1`, which the `?claim=` uuid validator rejects, so in demo mode every
zoom-in click bounced to the root — the one escape hatch for the undeployed API could not be
navigated. Nothing caught it because the hook's tests build their own uuid-shaped ids rather than
using the fixture: two correct halves with no test holding them together.

All fifteen contrast ratios recorded in `index.css` and in this file reproduced exactly under
independent recomputation. The three contrast findings are ratios nobody had written down, not
ones written down wrong.

## 🔴 One thing that is open and should not stay that way

**`apiFetch` discards every error code except on a 403.** On `401` it redirects; on `403` it
parses the body and keeps `error` and `reason`; on **every other failure** it returns
`` `Request failed (${status})` `` without reading the body at all.

So every distinction the API half of this plan took care to make — `CLAIM_NOT_FOUND` versus
`ANCESTOR_NOT_VISIBLE`, `CLAIM_MERGED`, `MAX_DEPTH_REACHED` — cannot reach the interface. Two
tasks spent real effort making those legible to a client and no client can tell them apart. The
composer's copy is deliberately written to be true of either reading rather than guessing.

This is not a claims problem. `apiFetch` is the single fetch seam for the whole app, so widening
it touches every hook and belongs in its own change with its own review.
