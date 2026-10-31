# Focused Communities: Seasons and the Argument Tree

**Date:** 2026-10-30 (revised 2026-10-31 after builder review)
**Status:** Design, approved for planning
**Extends** v1.0 (shipped 2026-04-17).

---

## 1. Intent

Focused Communities v1.0 gave every Compass topic a page with five stance cards and a
forum. It is static with respect to time: it reads `inform.compass_stances` and shows
whatever is current, with no idea that the Compass has seasons, revisions, or a history
of why it changed.

Meanwhile the Compass side has built that history and is waiting for a reader. This work
makes Focused Communities that reader, and adds the thing that makes a topic page worth
returning to: a Kialo-style argument tree where people explore the *problem* rather than
defend a box.

### The why

Two outcomes drive this. When a decision is close, these break the tie.

**A newcomer can get oriented.** Someone who knows nothing about the war in Ukraine should
be able to arrive at its community and come away understanding the real tensions — not
just which of five positions to pick. The five chairs are the Compass's current best cut at
the answer space. They are a starting map, not the territory.

**The Compass learns where its ladder is wrong.** Today, revisions come from internal
review. Season 3's Abortion note reads:

> the third and fourth options no longer repeat the same exceptions, so they now read as
> distinct positions

That is exactly the kind of flaw a public argument tree surfaces a season earlier, and for
free. Focused Communities is where the evidence for the next revision accumulates.

---

## 2. Goals, non-goals, anti-goals

### Goals

1. Any visitor can view a community as it stood in any season, and read why it changed.
2. A Kialo-style argument tree, continuous across seasons, open to any Connected Account.
3. The tree, the forum, and politician-data coverage together form the suggestion
   mechanism that informs the next revision.
4. Everything inherits the existing light/dark token system and brand palette.
5. A slot for Empowered Badges that can be filled later without re-cutting the page.

### Non-goals

- **Authoring Compass content in the normal course of operation.** Seasons, revisions,
  chairs and public notes are authored on the Compass side. Note the honest caveat: this
  repo *has* written to `inform.compass_stances` before, via the Phase 4.5 seed migrations
  (`supabase/migrations/20260416233145_phase4_5_stance_seed_a.sql` and b/c), which is where
  today's rich descriptions came from. Further content seeding from this repo is possible
  but is a deliberate exception, not the model.
- Automated duplicate detection in the tree. Explicitly deferred: *"we may build a cleaner
  way to flag when someone suggests an idea that has already been presented… for now, I
  just want to see it before I start revising it."*
- A separate "suggest an alteration" form. The tree is the suggestion mechanism.
- A Maven review/export surface. Confirmed as a later milestone (§7).
- Building Empowered Badges. Out of scope; this reserves the space.
- Rendering `inform.compass_topic_journal`. It has 0 rows and is motivation for this work,
  not a surface in it.
- Replacing the forum. It stays, below the tree.

### Anti-goals — this fails even if it ships and works

- **The tree becomes a referendum on the five chairs.** If band 3 turns into five pro/con
  piles defending the current ladder, it has crystallised exactly what it was built to
  question. The tree must be rooted in the problem, free to wander off the chairs, and the
  wandering is the signal, not a defect.
- **Anything implies the chairs are a scale of enthusiasm.** A chair is a discrete position
  with concrete indicators for who fits it. Position five is not "strongly agree." The
  ladder is a spectrum of policy outcomes, not of intensity.
- **Partisan read.** If a user can glance at the page and sort it into red team and blue
  team, the anti-partisan premise is gone.
- **The tree reads as a comment section with indentation.** If it does not feel
  structurally different from the forum directly below it, there was no reason to build it.

**Acceptance of the anti-goals is a design review with Chris before the tree is called
done.** The builder does not self-certify these. *(Author's call.)*

---

## 3. Constraints

Inherited from the platform and v1.0. Not up for renegotiation here.

- **Tech stack:** Supabase (DB/auth/RLS), Express/TypeScript on Render under `/api/`,
  Upstash Redis with in-memory fallback, Vite/React frontend, TypeScript throughout.
- **RLS always on.** Application checks are a second layer only.
- **Migrations only.** All schema changes via Supabase CLI migrations. The Supabase project
  is shared with EV-Accounts — use the MCP `apply_migration`, never `db push`.
- **Memory over moderation.** Content is never deleted. It is corrected and contextualised,
  and edits are visible. Hiding uses the existing `moderation_status` enum
  (`visible` | `hidden`) — never a `deleted_at` column, which deadlocks against RLS
  (Supabase bug #1941).
- **Pseudonyms only.** Connect contexts show `connected_profiles.display_name`, snapshotted
  at write time by a DB trigger. Legal identity never appears.
- **No party labels. No stance numbers.** Position integers are stripped at the hook
  boundary (`DisplayStance = Omit<Stance, 'position'>`) so TypeScript prevents a number
  reaching a component.
- **Slug stability.** Community slugs are a public contract; `slug_history` archives them on
  rename and old URLs self-resolve.
- **Health check:** `GET /api/health → { status: 'ok', timestamp: Date.now() }`.

### Chair ordering — corrected

An earlier draft of this document claimed chairs are shuffled per load. That is wrong, and
so is the note in `.planning/STATE.md` ([05-02]) that it came from. The actual behaviour,
confirmed by the user and matching `frontend/src/hooks/useStances.ts`:

- **Ladder order is preserved.** The five chairs are a spectrum, and
  `inform.compass_stance_revisions`' own table comment explains why order carries meaning:
  *"rung meaning is relational, fixed by contrast with its neighbours."* Shuffling destroys
  the contrast that makes an individual chair legible.
- **The direction is randomised.** On load, the ladder is randomly presented either way up,
  so the same end of the spectrum is not always on top. This is the same flip mechanic the
  Compass uses during calibration, and it is what prevents an ideological read.
- **The user can flip it manually.** The existing Invert toggle in `CommunityHubPage.tsx`
  stays, and now starts from a randomised initial state rather than always unflipped.
- Numbers are never shown, in either direction.

The uncommitted quick plan at `.planning/quick/001-stack-stances-vertically-add-a-reset-fli/`
should be reconciled against this before it lands.

### Resolved tension

Randomised direction and a persistent argument structure do not conflict, because the tree
is rooted in the topic question and is topic-scoped rather than chair-anchored. Per-chair
change markers (§5) must be rendered relative to the chair itself, never to its screen
position, so they survive a flip.

---

## 4. The page

Four bands, top to bottom. This stack is settled.

```
┌─ Band 1 · Topic question ───────────────────── season-scoped ─┐
│  "How should the law handle abortion?"      [Season 2 ▾]      │
├─ Band 2 · The five chairs ──────────────────── season-scoped ─┤
│  Chair text, deep dive, what changed this season and why      │
├─ Band 3 · Argument tree ────────────────────── topic-scoped ──┤
│  Kialo-style. Continuous. The reason to come back.            │
├─ Band 4 · Forum ────────────────────────────── topic-scoped ──┤
│  As shipped in v1.0                                           │
└───────────────────────────────────────────────────────────────┘
```

The season selector governs bands 1 and 2 only. Scroll past the chairs and you are in the
same room no matter which season you entered through.

An **Empowered Badges** slot sits between bands 2 and 3. It renders nothing until Badges
ships. Reserve the space and the route; build no badge logic.

---

## 5. Seasons

### What exists already

Verified against the shared Supabase instance, 2026-10-31:

| Table | Rows | What it gives us |
|---|---|---|
| `inform.seasons` | 3 | `number`, `name`, `status`, `opened_at`, `closed_at`, `public_note` |
| `inform.season_questions` | 164 | pins `(season_id, topic_id) → topic_revision_id` |
| `inform.compass_topic_revisions` | 147 | `question_text`, `change_class`, `public_note`, `rationale`, `rung_map`, `is_current`, `guidance` |
| `inform.compass_stance_revisions` | 735 | five rungs per revision: `value`, `text`, `description`, `supporting_points`, `example_perspectives` |

Current state: **Season 1 closed, Season 2 open, Season 3 draft.** `connect.communities` has
44 rows.

### Band 2's data source — decided

The revision tables are substantially unauthored. Measured coverage:

| Season | stance rows | with `description` | with `example_perspectives` |
|---|---|---|---|
| 1 (closed) | 220 | 180 | 180 |
| 2 (**open**) | 300 | **75** | 70 |
| 3 (draft) | 300 | 30 | 30 |

Roughly 108 of the 300 open-season chair texts also differ from what
`inform.compass_stances` serves today. Switching band 2 to season-pinned revisions right
now would strip descriptions from about three quarters of visible chairs and silently
reword a third of them.

**Decision:** the open season reads `inform.compass_stances`, exactly as v1.0 does.
Season-pinned revisions power **historical seasons only**. A Compass-side authoring program
can fill the revision rows on its own schedule; when open-season coverage is good, band 2
can switch over without a redesign. Band 2 must render acceptably when `description` or
`example_perspectives` is absent, since historical seasons will hit that immediately.

### Behaviour

- Default view is the **open** season (currently Season 2) — not `is_current` on the
  revision, and not the highest number, so a draft season cannot leak.
- `status = 'draft'` seasons are visible only to Mavens and Admins. Everyone else gets the
  open season and does not learn drafts exist.
- Closed seasons are browsable and clearly marked historical.
- The season selector lives in band 1. Changing it refetches bands 1 and 2 only — bands 3
  and 4 do not remount.
- Season choice belongs in the URL (`?season=2`) so a view is linkable. Absent, resolve to
  the open season.
- **Topics missing from a season.** One of the 44 communities has no open-season question
  (`immigration-and-treatment`, Season 1 only), and 16 topics have no Season 1 row. Such a
  page falls back to that topic's most recent available season, marked as archived, and its
  season selector offers only the seasons that topic actually appears in. **The argument
  tree and forum stay live** — a retired topic is still a live conversation. *(Author's
  call.)*

### Patch notes

**Patch notes attach to the season, not the chair.** Per-chair attachment remains possible
later.

Render for the selected season: `seasons.public_note` as the platform-wide note, then this
topic's `compass_topic_revisions.public_note` as the topic-specific one. `rationale` is
internal in tone — it names reviewers, decision dates and seating counts — so it is
available to Mavens and Admins but is not the public note. `change_class`
(`substantive` | `clarifying`) drives a small label distinguishing a rewording from a real
shift.

### Per-chair change markers — scoped down

`rung_map` maps previous positions to current ones, but it is sparser and messier than an
earlier draft assumed. Of 147 revisions: **66 have no `rung_map` at all** (including every
Season 1 revision), 77 are identity, 4 are non-identity, and 2 contain a string sentinel
such as `{1:2, 2:3, 3:"invalidated", 4:4, 5:5}`. Non-identity maps include many-to-one
collapses like `{1:1, 2:1, 3:3, 4:5, 5:5}`.

**Decision:** render a per-chair marker only where the map is present and expresses a
simple 1:1 correspondence — *carried* or *reworded*, derived by comparing texts. Where the
map is absent, collapses two chairs into one, or carries an `invalidated` sentinel,
**suppress the per-chair marker entirely** and rely on the season-level note. A collapse is
genuinely hard to express without position numbers, and a wrong marker is worse than none.
*(Author's call.)*

---

## 6. The argument tree

### What it is

A Kialo-style tree rooted in the topic's question. Each node is a **claim** carrying a
stance toward its parent: **supports** or **opposes**. Depth is unbounded.

The tree is **topic-scoped and continuous**. It does not reset between seasons and does not
reference one. One conversation that outlives any particular ladder.

A claim is not required to map to a chair, and most will not.

### The root claim

The root cannot be the season's `question_text`, because that text changes between
revisions while the tree is explicitly season-free. **Decision:** seed one root per
community in a migration, labelled with a season-independent framing of the problem
(derived from `connect.communities.name` / `description`). The root is not author-editable
and carries no side. *(Author's call.)*

### The five hierarchy devices — all five in scope

1. **Two columns, always.** Supports one side, opposes the other. Structural, not
   decorative: you cannot read one side without the other being present. They stack on
   narrow viewports, but both headers stay visible so the balance is never hidden.
2. **Zoom-in navigation with a breadcrumb spine.** Any claim can become the node you stand
   on; the trail back to the root stays visible. Requires a stable addressable URL per
   claim and a cheap path-to-root.
3. **Whole-tree minimap.** A small coloured map of the entire argument with your position
   marked. Requires a *shape-only* representation — id, parent, side, depth, impact —
   fetchable without any claim text.
4. **Every card advertises what is underneath.** Per-side counts of direct children, so a
   reader sees three unanswered objections without opening the claim. Counts are rolled up
   and maintained on write.
5. **Impact rating.** A per-claim score for how much it moves its parent, shown as a bar,
   and **the default sort within a column**. This is the "vote." It is therefore not a
   popularity signal — it decides which arguments get read first and is the main
   quantitative input to revision decisions.

### Impact rating

- Any Connected or Empowered Account may rate; one rating per account per claim, changeable.
  A rating that cannot be revised stops reflecting what people think once a strong objection
  lands beneath it.
- **Author's call:** Kialo's 1–9 granularity rather than a binary. A binary collapses "true
  but barely matters" into the same bucket as "decisive," and that distinction is the point.
  Present it as a labelled scale, never as bare numbers.
- Displayed impact is an aggregate, stable under low sample counts — a single 9 on a
  one-vote claim must not outrank a well-supported 7. Exact function left to the builder.
- Ratings are aggregate-only in public. Never per-user.
- **Brigading resistance is in scope from day one.** `claim_ratings` carries an audit trail
  and per-account metadata (account age, verification status, calibration state) even if
  aggregation ignores it initially. This is cheap now and impossible to retrofit —
  discovering a brigade later means discarding every rating collected. *(Author's call.)*

### Authoring, editing, moving, merging, hiding

- **Any Connected Account** may add a claim. Reading is open to everyone.
- **Editing a claim body stays permanently available to its author**, consistent with
  "memory over moderation," and appears in visible history. Ratings are *not* versioned
  against body revisions; drift is accepted. Locking edits after the first rating would
  contradict a hard platform principle. *(Author's call.)*
- **Mavens and Admins** may move a claim to a different parent or merge a duplicate into an
  existing claim. Both appear in the claim's visible history.
- **Merge semantics:** children re-parent to the merge target; the merged claim's ratings
  are **discarded, not combined**, because people rated a specific wording and combining
  fabricates consent they did not give; the old URL redirects to the target and shows a
  merge notice, since device 2 requires every claim URL to stay addressable. *(Author's
  call.)*
- **Hiding** sets `moderation_status = 'hidden'` and is a Maven/Admin action. A hidden claim
  renders as a **tombstone that preserves tree structure** — its children stay attached and
  readable. Cascading a hide down the subtree would destroy other people's work, and
  re-parenting orphans to the grandparent would silently rewrite arguments. *(Author's
  call.)*
- Claims are never deleted.

### Why move and merge are required

Flagged during design and accepted. "Memory over moderation" behaves differently in a tree
than in a forum. In a forum a weak post is noise scrolling past. In a tree a claim is
permanent structure: a duplicate added under three parents is load-bearing forever, and a
good claim filed under the wrong parent makes the breadcrumb lie to every reader after it.
Impact sorting buries a *weak* claim but cannot merge a duplicate or move a misfiled one.
Kialo survives this through heavy admin curation that is invisible in its UI. Move and merge
are the minimum viable version of that curation.

### Blocking dependency: Maven and Admin do not exist here

`src/middleware/tierGuards.ts` knows only `tier: 'inform' | 'connected' | 'empowered'`, and
`req.user` carries no role field. This blocks more than curation — it also gates draft-season
visibility, `rationale` display, and hiding.

**Interim mechanism:** a Maven/Admin user-id allowlist supplied by environment variable,
checked by a new `requireMaven` guard alongside `requireConnected`. This unblocks every
Maven surface in this document cheaply and is replaced by a real role claim when EV-Accounts
exposes one. The guard's interface should not change when that happens. *(Author's call.)*

The tree can ship and be useful before curation exists — the user explicitly wants to see it
before revising it — so build the tree first, with curation behind the guard.

---

## 7. The suggestion mechanism

There is no proposal form. Three signals feed the next revision.

1. **The tree.** A claim proposing a better answer accumulates impact. Two chairs whose
   arguments converge on one branch are probably one chair. A high-impact claim fitting
   under no existing chair is a gap in the ladder.
2. **The forum.** Unstructured discussion not yet distilled into claims. Often where a
   problem is first named, before anyone can phrase it as a claim.
3. **Politician-data coverage.** If the research pipeline cannot source positions for
   elected officials on a chair, that chair is probably badly drawn. Relevant tables:
   `inform.politician_answers` (39,824 rows), `inform.topic_research_outcomes` (1,905 — the
   "we researched and found nothing" marker, recorded per person, topic *and season*), and
   `inform.stance_coder_labels` (1,393). Season 3's Abortion rationale already reasons this
   way, citing "104 seatings owed a re-check."

**Scope:** this work produces these signals; it does not build a screen for reading them.
A Maven review/export surface is a later milestone, confirmed by the user. Coverage data is
methodologically subtle and easy to misread as a claim about politicians rather than about
the instrument, so when it does surface it is Maven/Admin-only by default.

---

## 8. Visual design

### Palette

The planning docs are stale. `frontend/src/index.css` is authoritative:

| Token | Light | Dark |
|---|---|---|
| `--color-ev-teal` | `#00657C` | — |
| `--color-ev-teal-light` | `#59B0C4` | — |
| `--color-ev-coral` | `#FF5740` | — |
| `--color-ev-yellow` | `#FED12E` | — |
| `--color-surface-primary` | `#FFFFFF` | `#0F1A1E` |
| `--color-surface-secondary` | `#F0F8FA` | `#05262E` |
| `--color-text-body` | `#1C1C1C` | `#E4F3F6` |
| `--color-border-light` | `#E2EBEF` | `#2B616E` |

`PROJECT.md` still lists `#03b9d2` as primary and should be corrected as part of this work.

### Light and dark

Already most of the way there. `index.css` carries a full semantic token set with an
`html.dark` override and `@custom-variant dark`. A working `useTheme.ts` hook and header
toggle exist **uncommitted in the working tree** — commit them as part of this work rather
than rewriting them. Every new surface uses semantic tokens; no raw hex in components.

### Pro/con colour — author's call

**Teal for supports, coral for opposes — not green and red.** Kialo's green/red is one hop
from red/blue, and on a political product that read would undo the anti-partisan premise.
Teal and coral are already in the palette and carry no partisan prior.

Colour alone must not encode side. Every claim card also carries a text label and a distinct
border treatment, so the split survives colour blindness and greyscale.

---

## 9. Data model sketch

Direction, not prescription. Schema is the builder's to finalise.

New tables in `connect`:

- **`claims`** — `id`, `community_id`, `parent_claim_id` (null at root), `side`
  (`supports` | `opposes`; null at root), `body`, `author_id`, `author_display_name`
  (trigger-snapshotted), `moderation_status`, `depth`, `child_supports_count`,
  `child_opposes_count`, `merged_into_claim_id`, timestamps.
- **`claim_ratings`** — `claim_id`, `user_id`, `value`, plus the audit metadata required in
  §6, timestamps. Unique on `(claim_id, user_id)`.
- **`claim_edits`** — mirroring `post_edits`, and also recording move and merge events with
  the previous parent and the merge target.

Notes for the builder:

- **Do not copy `connect.log_post_edit()` verbatim.** It records `editor_id` as
  `OLD.author_id`, which would attribute every Maven move or merge to the claim's original
  author. Claim history must record the actual actor.
- Breadcrumbs and the minimap both need cheap ancestry. A materialised path column or a
  closure table are both reasonable; a recursive CTE per request is not, given the minimap
  loads on every page view.
- The minimap needs a shape-only endpoint that excludes `body`.
- Child counts are denormalised and trigger-maintained, as `threads.reply_count` already is.
- Rate-limit claim creation and rating with the existing Upstash sliding window plus
  in-memory fallback.
- Response envelopes: list → `{ data, meta: { cursor, hasMore } }`, single → `{ data }`.
- Reading `inform.*` from `connect` goes through a `SECURITY DEFINER` RPC in the `connect`
  schema, as `connect.get_stances_for_community` already does — `anon` has no direct grant
  on `inform`.

---

## 10. Left to the builder

- Final schema, indexing, and ancestry strategy.
- The impact aggregation function, subject to the stability requirement in §6.
- Pagination and collapse strategy for very wide or very deep trees.
- Mobile layout for the two-column split and the minimap.
- Caching per endpoint, following existing `cacheMiddleware` patterns, with
  `Cache-Control: private, no-store` on anything auth-touching.
- Whether the randomised ladder direction is re-rolled per page load or held for a session.

---

## 11. Decisions recorded as the author's

Review these; they were settled by the author, not stated by the user.

| § | Decision |
|---|---|
| 2 | Anti-goal acceptance is a design review with Chris, not builder self-certification |
| 5 | Default to the *open* season, not highest-numbered or `is_current` |
| 5 | Draft seasons restricted to Mavens and Admins |
| 5 | Topics missing from a season fall back to their latest season, marked archived; tree and forum stay live |
| 5 | Per-chair change markers render only for simple 1:1 `rung_map` cases; suppressed otherwise |
| 6 | Root claim seeded per community, season-independent label, not author-editable |
| 6 | Impact granularity 1–9 rather than binary |
| 6 | Brigading audit metadata on `claim_ratings` from day one |
| 6 | Claim bodies stay author-editable forever; ratings not versioned; drift accepted |
| 6 | Merge re-parents children, discards ratings, redirects the old URL |
| 6 | Hide renders a tombstone preserving the subtree; no cascade, no re-parenting |
| 6 | Interim Maven/Admin allowlist via env var behind a `requireMaven` guard |
| 8 | Teal/coral for supports/opposes instead of green/red |

## 12. External dependencies

- EV-Accounts must expose a Maven/Admin role to replace the interim allowlist.
- Compass-side authoring to fill `compass_stance_revisions` descriptions before band 2 can
  read revisions for the open season.
