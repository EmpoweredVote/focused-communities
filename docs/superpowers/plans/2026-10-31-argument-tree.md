# Argument Tree Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A Kialo-style argument tree on every Focused Community page — rooted in the problem, continuous across seasons, open to any Connected Account.

**Architecture:** Three new `connect` tables (`claims`, `claim_ratings`, `claim_edits`) with a materialised ancestry path so breadcrumbs and the minimap are single indexed reads. Child counts are trigger-maintained. The API lives in the engine's `focused_communities` module; curation uses the engine's existing `requireRole('maven')`. The frontend renders a two-column pro/con split with zoom-in navigation, a whole-tree minimap, per-card child counts, and an impact bar that sorts each column.

**Tech Stack:** PostgreSQL (Supabase, shared instance), Express/TypeScript in `EmpoweredVote/ev-accounts`, vitest + supertest, Vite/React/TypeScript + Tailwind v4 in `EmpoweredVote/focused-communities`, vitest + React Testing Library.

**Spec:** `docs/superpowers/specs/2026-10-30-seasons-and-argument-tree-design.md`

**Depends on:** `docs/superpowers/plans/2026-10-31-seasons.md` Task 5 only (the frontend test harness). Everything else is independent; the two plans can run in either order provided that task lands first.

## Global Constraints

- **Two repos.** Migrations and API: `EmpoweredVote/ev-accounts`, under `backend/`. UI: this repo, under `frontend/`. The backend in this repo's `src/` is frozen — never modify it.
- **The `focused_communities_app` role has no BYPASSRLS and only the grants `CA_0323` gave it.** The three new tables need explicit grants and permissive RLS policies scoped to that role, in the same migration that creates them.
- **Nothing is ever deleted.** No `DELETE` grant on the new tables. `DELETE` routes answer 405 with `Allow: GET, PATCH`. Hiding uses `moderation_status`.
- **Hidden or missing answers 404, never 403** — revealing existence is the bug. Non-author edits also 404.
- **Timestamps use `ts()` from `lib/sql.ts`.** A JS `Date` truncates to milliseconds and breaks cursors.
- **Pseudonyms only**, snapshotted at write time by trigger. Legal identity never appears.
- **Supports is teal, opposes is coral** — never green/red, never red/blue. Colour alone never encodes side; every card also carries a text label and a distinct border.
- **Never invent data in a component.** Anything unserved goes in `frontend/src/mocks/` headed `// Stands in for: GET /api/<route> — not yet served by the API`.
- **Use `@empoweredvote/ev-ui` components** rather than copying or restyling them.
- Cache keys keep the `fc:` prefix. Auth-touching responses carry `Cache-Control: private, no-store`.
- Response envelopes: list → `{ data, meta }`, single → `{ data }`.

## Review Focus

1. **Merging a claim into one of its own descendants.** Re-parenting the children would create a cycle and the breadcrumb query would never terminate. Must be rejected with 409 before any write. *(Task 7)*
2. **Hiding a claim that has children.** The subtree must stay reachable and readable behind a tombstone — the spec forbids both cascading and re-parenting to the grandparent, and either would silently destroy other people's arguments. *(Task 7)*
3. **The same account rating the same claim twice,** including two requests in flight at once. Must upsert on `(claim_id, user_id)`, not accumulate rows and not 500 on the unique violation. *(Task 5)*
4. **A tree deep or wide enough to matter** — a 40-deep chain, or a claim with 500 children. The breadcrumb must not issue 40 queries and the minimap payload must stay bounded; both load on every page view. *(Tasks 2, 3)*
5. **Two children inserted under one parent simultaneously.** Counts are denormalised, so a read-then-write rollup loses one — the same bug already fixed for `threads.reply_count`. *(Task 1)*

---

## File Structure

**ev-accounts (API):**
- Create `backend/migrations/CA_0341_focused_communities_claims.sql` — tables, RLS, grants, triggers, root seeding.
- Create `backend/src/focused_communities/routes/claims.ts` — reads.
- Create `backend/src/focused_communities/routes/claimWrites.ts` — create, rate, edit.
- Create `backend/src/focused_communities/routes/claimCuration.ts` — move, merge, hide.
- Create `backend/src/focused_communities/claims.test.ts`, `claimWrites.test.ts`, `claimCuration.test.ts`.
- Modify `backend/src/focused_communities/app.ts` — mount three routers.

**focused-communities (UI):**
- Modify `frontend/src/types.ts` — claim types.
- Create `frontend/src/hooks/useClaims.ts`, `useClaimMutations.ts`.
- Create `frontend/src/components/claims/ClaimCard.tsx`, `ClaimColumns.tsx`, `ClaimBreadcrumb.tsx`, `TreeMinimap.tsx`, `ImpactControl.tsx`, `ClaimComposer.tsx`, `ArgumentTree.tsx`.
- Modify `frontend/src/pages/CommunityHubPage.tsx` — mount band 3 and the badges placeholder.

---

### Task 1: Claim tables, grants and triggers

**Files:**
- Create: `backend/migrations/CA_0341_focused_communities_claims.sql`

**Interfaces:**
- Produces:
  - `connect.claims` — `id uuid pk`, `community_id uuid not null`, `parent_claim_id uuid null`, `side text null check (side in ('supports','opposes'))`, `body text not null`, `author_id uuid null`, `author_display_name text`, `moderation_status connect.moderation_status not null default 'visible'`, `path uuid[] not null` (root-first, excluding self), `depth int not null`, `child_supports_count int not null default 0`, `child_opposes_count int not null default 0`, `merged_into_claim_id uuid null`, `created_at`, `updated_at`. Root rows have `parent_claim_id`, `side` and `author_id` all null.
  - `connect.claim_ratings` — `claim_id`, `user_id`, `value int check (value between 1 and 9)`, `rater_account_age_days int`, `rater_verification_status text`, `created_at`, `updated_at`; unique `(claim_id, user_id)`.
  - `connect.claim_edits` — `id`, `claim_id`, `actor_id uuid not null`, `kind text check (kind in ('edit','move','merge','hide'))`, `old_body text`, `old_parent_claim_id uuid`, `merge_target_claim_id uuid`, `edited_at`.
  - Triggers: `snapshot_claim_author_display_name` (BEFORE INSERT), `bump_claim_child_counts` (AFTER INSERT/UPDATE OF parent_claim_id/DELETE-less), `log_claim_edit` (AFTER UPDATE, `WHEN` body or parent changed).
  - One root claim per row in `connect.communities`.

- [ ] **Step 1: Write the migration**

Index `claims (community_id, parent_claim_id)`, `claims USING gin (path)`, and `claim_ratings (claim_id)`. Counts are bumped with `count = count + 1` inside the trigger's `UPDATE`, never read-then-written. RLS: enable on all three, then permissive policies scoped to `focused_communities_app` mirroring `CA_0323`'s approach. Grants: SELECT on all three; INSERT/UPDATE on `claims` and `claim_ratings`; SELECT on `claim_edits` (the trigger writes it as SECURITY DEFINER). **No DELETE grant anywhere.** Seed roots with `INSERT INTO connect.claims (community_id, body, path, depth) SELECT id, name, '{}', 0 FROM connect.communities`.

- [ ] **Step 2: Write `log_claim_edit` to record the real actor**

It must read the acting user, not `OLD.author_id`. `connect.log_post_edit()` uses `OLD.author_id` and copying it would attribute every Maven move to the claim's original author. Pass the actor through a transaction-local setting (`set_config('fc.actor_id', …, true)`) set by the route before the UPDATE, and read it with `current_setting('fc.actor_id', true)`.

- [ ] **Step 3: Apply it**

Use the Supabase MCP `apply_migration`, never `db push`.

- [ ] **Step 4: Verify the concurrency and permission properties**

```sql
-- one root per community
SELECT count(*) FROM connect.claims WHERE depth = 0;  -- expect 44
-- counts survive concurrent inserts
-- (two sessions INSERT a child of the same parent, then:)
SELECT child_supports_count FROM connect.claims WHERE id = '<parent>';  -- expect 2
-- no delete
SET ROLE focused_communities_app; DELETE FROM connect.claims;  -- expect permission denied
```

- [ ] **Step 5: Commit**

```bash
git add backend/migrations/CA_0341_focused_communities_claims.sql
git commit -m "feat(fc): claim tables, scoped grants and triggers (CA_0341)"
```

---

### Task 2: Read a claim with its breadcrumb and children

**Files:**
- Create: `backend/src/focused_communities/routes/claims.ts`
- Create: `backend/src/focused_communities/claims.test.ts`

**Interfaces:**
- Consumes: Task 1's tables; `pool`, `cache`, `ts()`.
- Produces: `claimsRouter`, and
  `Claim = { id: string; side: 'supports' | 'opposes' | null; body: string; authorPseudonym: string | null; impact: number | null; ratingCount: number; childSupports: number; childOpposes: number; isHidden: boolean; mergedInto: string | null; createdAt: string; updatedAt: string }`,
  `ClaimNode = { claim: Claim; breadcrumb: { id: string; body: string; side: Claim['side'] }[]; supports: Claim[]; opposes: Claim[] }`.
  `GET /api/communities/:id/claims/root` and `GET /api/claims/:claimId` both return `{ data: ClaimNode }`.

- [ ] **Step 1: Write the failing tests**

```ts
it('returns the root with its two columns', async () => {});
it('builds the breadcrumb from path in a single query', async () => { /* assert exactly 1 pool.query for ancestry */ });
it('orders each column by impact descending', async () => {});
it('renders a hidden claim as a tombstone with its children intact', async () => { /* isHidden true, body null-ish, supports/opposes still populated */ });
it('404s an unknown claim id', async () => {});
it('paginates a column past the page size', async () => { /* meta.cursor present for 500 children */ });
```

- [ ] **Step 2: Run them and confirm they fail**

Run: `npx vitest run src/focused_communities/claims.test.ts`
Expected: FAIL — cannot resolve `./routes/claims.js`.

- [ ] **Step 3: Implement the reads**

Breadcrumb is `WHERE id = ANY(path)` ordered by `array_position(path, id)` — one query regardless of depth. Children are two queries, one per side, ordered by impact then `id`, with the two-column cursor pattern already used for threads. Impact is the aggregate from Task 5; until then it is `null` and ordering falls back to `created_at`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/focused_communities/claims.test.ts`
Expected: PASS, 6 tests.

- [ ] **Step 5: Commit**

```bash
git add backend/src/focused_communities/routes/claims.ts backend/src/focused_communities/claims.test.ts
git commit -m "feat(fc): read a claim with breadcrumb and columns"
```

---

### Task 3: Tree shape for the minimap

**Files:**
- Modify: `backend/src/focused_communities/routes/claims.ts`
- Modify: `backend/src/focused_communities/claims.test.ts`

**Interfaces:**
- Produces: `GET /api/communities/:id/claims/shape` → `{ data: ShapeNode[], meta: { truncated: boolean } }` where `ShapeNode = { id: string; parentId: string | null; side: 'supports' | 'opposes' | null; depth: number; impact: number | null }`. **No `body` field.**

- [ ] **Step 1: Write the failing tests**

```ts
it('omits claim bodies entirely', async () => { /* no 'body' key anywhere in the payload */ });
it('caps the payload and flags truncation on a large tree', async () => { /* meta.truncated === true */ });
it('includes hidden claims so the shape stays honest', async () => {});
```

- [ ] **Step 2: Run them and confirm they fail**

Run: `npx vitest run src/focused_communities/claims.test.ts`
Expected: FAIL on the new cases.

- [ ] **Step 3: Implement it**

One `SELECT id, parent_claim_id, side, depth` over the community, ordered by `depth, id`, with a hard `LIMIT`. Cache under `fc:claims:shape:{communityId}`; invalidate on every claim write (Task 8).

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/focused_communities/claims.test.ts`
Expected: PASS, 9 tests.

- [ ] **Step 5: Commit**

```bash
git commit -am "feat(fc): tree shape endpoint for the minimap"
```

---

### Task 4: Create a claim

**Files:**
- Create: `backend/src/focused_communities/routes/claimWrites.ts`
- Create: `backend/src/focused_communities/claimWrites.test.ts`

**Interfaces:**
- Consumes: `requireAuth`, `requireConnected` from `./middleware/`, `postRateLimiter` from `./lib/rateLimit.js`.
- Produces: `claimWritesRouter`; `POST /api/claims/:parentId/children` with body `{ side: 'supports' | 'opposes'; body: string }` → `{ data: Claim }`, 201.

- [ ] **Step 1: Write the failing tests**

```ts
it('creates a child and derives path and depth from the parent', async () => {});
it('requires a connected account', async () => { /* 403 reason 'tier' */ });
it('rejects a missing or invalid side', async () => { /* 400 */ });
it('validates before consuming rate limit quota', async () => {});
it('404s when the parent is hidden or absent', async () => {});
it('bumps the parent child count for the right side', async () => {});
```

- [ ] **Step 2: Run them and confirm they fail**

Run: `npx vitest run src/focused_communities/claimWrites.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement it**

`path` is `parent.path || parent.id`; `depth` is `parent.depth + 1`. Validation runs before the rate limiter, matching the existing write routes. Share the `fc:rl` bucket shape; use a separate prefix so claims and posts do not starve each other.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/focused_communities/claimWrites.test.ts`
Expected: PASS, 6 tests.

- [ ] **Step 5: Commit**

```bash
git add backend/src/focused_communities/routes/claimWrites.ts backend/src/focused_communities/claimWrites.test.ts
git commit -m "feat(fc): create a claim"
```

---

### Task 5: Rate a claim

**Files:**
- Modify: `backend/src/focused_communities/routes/claimWrites.ts`
- Modify: `backend/src/focused_communities/claimWrites.test.ts`

**Interfaces:**
- Produces: `PUT /api/claims/:claimId/rating` with body `{ value: number }` (1–9) → `{ data: { impact: number; ratingCount: number } }`; and the aggregate used by Task 2's ordering.

- [ ] **Step 1: Write the failing tests**

```ts
it('upserts rather than inserting a second row for the same rater', async () => {});
it('rejects a value outside 1..9', async () => { /* 400 */ });
it('never exposes an individual rating', async () => {});
it('keeps a single 9 below a well-supported 7', async () => { /* low-n stability */ });
it('returns the updated aggregate', async () => {});
```

- [ ] **Step 2: Run them and confirm they fail**

Run: `npx vitest run src/focused_communities/claimWrites.test.ts`
Expected: FAIL on the new cases.

- [ ] **Step 3: Implement it**

`INSERT … ON CONFLICT (claim_id, user_id) DO UPDATE`. The aggregate is a Bayesian-weighted mean pulling toward the neutral midpoint with low sample counts; the exact prior weight is the implementer's choice, subject to the stability test above. Record `rater_account_age_days` and `rater_verification_status` at write time even though the aggregate ignores them for now — they cannot be reconstructed later.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/focused_communities/claimWrites.test.ts`
Expected: PASS, 11 tests.

- [ ] **Step 5: Commit**

```bash
git commit -am "feat(fc): impact rating with low-n stable aggregation"
```

---

### Task 6: Edit a claim body

**Files:**
- Modify: `backend/src/focused_communities/routes/claimWrites.ts`
- Modify: `backend/src/focused_communities/claimWrites.test.ts`

**Interfaces:**
- Produces: `PATCH /api/claims/:claimId` with body `{ body: string }` → `{ data: Claim }`; `GET /api/claims/:claimId/edits` → `{ data: ClaimEdit[] }`, unauthenticated; `DELETE /api/claims/:claimId` → 405 with `Allow: GET, PATCH`.

- [ ] **Step 1: Write the failing tests**

```ts
it('lets the author edit after the claim has ratings and children', async () => {});
it('404s a non-author editor', async () => { /* not 403 */ });
it('records the edit in history with the actor', async () => {});
it('serves edit history without authentication', async () => {});
it('answers DELETE with 405 and an Allow header', async () => {});
```

- [ ] **Step 2: Run them and confirm they fail**

Run: `npx vitest run src/focused_communities/claimWrites.test.ts`
Expected: FAIL on the new cases.

- [ ] **Step 3: Implement it**

Set `fc.actor_id` via `set_config` in the same transaction as the UPDATE so Task 1's trigger logs the real actor. Edits are not rate limited, matching posts.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/focused_communities/claimWrites.test.ts`
Expected: PASS, 16 tests.

- [ ] **Step 5: Commit**

```bash
git commit -am "feat(fc): edit a claim with visible history"
```

---

### Task 7: Curation — move, merge, hide

**Files:**
- Create: `backend/src/focused_communities/routes/claimCuration.ts`
- Create: `backend/src/focused_communities/claimCuration.test.ts`

**Interfaces:**
- Consumes: `requireRole` from `../../middleware/requireRole.js`, `requireAdmin` from `../../middleware/requireAdmin.js`.
- Produces: `claimCurationRouter`; `POST /api/claims/:claimId/move` `{ newParentId, side }`; `POST /api/claims/:claimId/merge` `{ targetClaimId }`; `POST /api/claims/:claimId/hide`. All three → `{ data: Claim }`, all three Maven-or-Admin.

- [ ] **Step 1: Write the failing tests**

```ts
it('rejects a move or merge from a non-maven', async () => { /* 403 */ });
it('rejects merging a claim into its own descendant', async () => { /* 409, no write */ });
it('rejects moving a claim under its own descendant', async () => { /* 409 */ });
it('re-parents the merged claim\'s children onto the target', async () => {});
it('discards the merged claim\'s ratings', async () => {});
it('redirects the merged claim\'s URL to the target', async () => { /* mergedInto set; GET returns a merge notice */ });
it('rewrites path and depth for the whole moved subtree', async () => {});
it('hides a claim without touching its children', async () => { /* children still readable */ });
it('records move, merge and hide in history with the acting maven', async () => {});
```

- [ ] **Step 2: Run them and confirm they fail**

Run: `npx vitest run src/focused_communities/claimCuration.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement it**

Cycle check first, before any write: reject when the target or new parent has the moving claim in its `path`, or is the claim itself. A move rewrites `path` and `depth` for the subtree with a single `UPDATE … WHERE path @> ARRAY[:claimId]`. A merge re-parents children, sets `merged_into_claim_id`, deletes nothing, and leaves the ratings rows in place but excluded from the target's aggregate. Each route sets `fc.actor_id` before writing.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/focused_communities/claimCuration.test.ts`
Expected: PASS, 9 tests.

- [ ] **Step 5: Commit**

```bash
git add backend/src/focused_communities/routes/claimCuration.ts backend/src/focused_communities/claimCuration.test.ts
git commit -m "feat(fc): maven curation — move, merge and hide"
```

---

### Task 8: Mount the routers and invalidate caches

**Files:**
- Modify: `backend/src/focused_communities/app.ts`
- Modify: `backend/src/focused_communities/app.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
it('serves the claim routes through the mounted app', async () => {});
it('invalidates the shape cache when a claim is created', async () => {});
it('invalidates the shape cache on move, merge and hide', async () => {});
```

- [ ] **Step 2: Run them and confirm they fail**

Run: `npx vitest run src/focused_communities/app.test.ts`
Expected: FAIL with 404.

- [ ] **Step 3: Mount and wire invalidation**

`app.use('/api', claimsRouter, claimWritesRouter, claimCurationRouter)` beside the existing routers. Every write calls `cacheDel('fc:claims:shape:{communityId}')`, warn-and-continue on a Redis error as the existing writes do.

- [ ] **Step 4: Run the module's full suite**

Run: `npx vitest run src/focused_communities`
Expected: PASS, no regressions.

- [ ] **Step 5: Commit**

```bash
git commit -am "feat(fc): mount claim routers with cache invalidation"
```

---

### Task 9: Frontend types and claim hooks

**Files:**
- Modify: `frontend/src/types.ts`
- Create: `frontend/src/hooks/useClaims.ts`, `frontend/src/hooks/useClaimMutations.ts`
- Create: `frontend/src/hooks/useClaims.test.tsx`

**Interfaces:**
- Produces: types `Claim`, `ClaimNode`, `ShapeNode`, `ClaimEdit` mirroring Tasks 2, 3 and 6 exactly; hooks `useClaimNode(claimId?)`, `useRootClaim(communityId?)`, `useTreeShape(communityId?)`, `useCreateClaim()`, `useRateClaim()`, `useEditClaim()`.

- [ ] **Step 1: Write the failing tests**

```tsx
it('fetches the root when no claim id is given', async () => {});
it('refetches the node when the claim id changes', async () => {});
it('optimistically applies a rating and rolls back on error', async () => {});
it('invalidates the shape query after creating a claim', async () => {});
```

- [ ] **Step 2: Run them and confirm they fail**

Run: `cd frontend && npm test src/hooks/useClaims.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement them**

Follow `useCreateReply`'s optimistic-update pattern: the cache shape written must match what the query function returns, or rollback corrupts the cache.

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd frontend && npm test src/hooks/useClaims.test.tsx`
Expected: PASS, 4 tests.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/types.ts frontend/src/hooks/useClaims.ts frontend/src/hooks/useClaimMutations.ts frontend/src/hooks/useClaims.test.tsx
git commit -m "feat(frontend): claim types and hooks"
```

---

### Task 10: Claim card and the two-column split

**Files:**
- Create: `frontend/src/components/claims/ClaimCard.tsx`, `frontend/src/components/claims/ClaimColumns.tsx`
- Create: `frontend/src/components/claims/ClaimCard.test.tsx`, `frontend/src/components/claims/ClaimColumns.test.tsx`

**Interfaces:**
- Produces: `<ClaimCard claim={Claim} onOpen={(id: string) => void} />` and `<ClaimColumns supports={Claim[]} opposes={Claim[]} onOpen={…} />`.

- [ ] **Step 1: Write the failing tests**

```tsx
it('labels each side in text, not only colour', () => {});
it('shows the per-side child counts', () => {});
it('renders a tombstone for a hidden claim', () => {});
it('keeps both column headers visible when stacked narrow', () => {});
it('renders an empty column without collapsing the split', () => {});
```

- [ ] **Step 2: Run them and confirm they fail**

Run: `cd frontend && npm test src/components/claims`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement them**

Teal for supports, coral for opposes, from semantic tokens — no raw hex. Each card carries a text label and a distinct border treatment so the split survives greyscale. Columns stack below the `sm` breakpoint with both headers still rendered.

- [ ] **Step 4: Run tests and build**

Run: `cd frontend && npm test && npm run build`
Expected: PASS, build clean.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/claims/ClaimCard.tsx frontend/src/components/claims/ClaimColumns.tsx frontend/src/components/claims/ClaimCard.test.tsx frontend/src/components/claims/ClaimColumns.test.tsx
git commit -m "feat(frontend): claim card and two-column split"
```

---

### Task 11: Breadcrumb and zoom-in navigation

**Files:**
- Create: `frontend/src/components/claims/ClaimBreadcrumb.tsx`, `frontend/src/components/claims/ClaimBreadcrumb.test.tsx`

**Interfaces:**
- Produces: `<ClaimBreadcrumb trail={ClaimNode['breadcrumb']} onJump={(id: string) => void} />`. The focused claim is addressable as `?claim=<id>` on the community route.

- [ ] **Step 1: Write the failing tests**

```tsx
it('renders the trail root-first', () => {});
it('jumps to an ancestor when one is clicked', async () => {});
it('collapses the middle of a deep trail but keeps root and parent', () => {});
it('puts the focused claim in the URL so it is linkable', async () => {});
```

- [ ] **Step 2: Run them and confirm they fail**

Run: `cd frontend && npm test src/components/claims/ClaimBreadcrumb.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement it**

`?claim=` is managed with `useSearchParams` and `replace: true`, matching the season parameter. Changing it must not remount bands 1, 2 or 4.

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd frontend && npm test src/components/claims/ClaimBreadcrumb.test.tsx`
Expected: PASS, 4 tests.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/claims/ClaimBreadcrumb.tsx frontend/src/components/claims/ClaimBreadcrumb.test.tsx
git commit -m "feat(frontend): breadcrumb spine and zoom-in navigation"
```

---

### Task 12: Whole-tree minimap

**Files:**
- Create: `frontend/src/components/claims/TreeMinimap.tsx`, `frontend/src/components/claims/TreeMinimap.test.tsx`

**Interfaces:**
- Consumes: `useTreeShape` (Task 9).
- Produces: `<TreeMinimap shape={ShapeNode[]} focusedId={string} truncated={boolean} onJump={(id: string) => void} />`.

- [ ] **Step 1: Write the failing tests**

```tsx
it('marks the focused claim', () => {});
it('reflects the pro/con balance at each depth', () => {});
it('says so when the shape was truncated', () => {});
it('renders a single-node tree without error', () => {});
```

- [ ] **Step 2: Run them and confirm they fail**

Run: `cd frontend && npm test src/components/claims/TreeMinimap.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement it**

Inline SVG or stacked divs grouped by depth; no charting library. Decorative to screen readers, with a text summary of counts per side as the accessible alternative.

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd frontend && npm test src/components/claims/TreeMinimap.test.tsx`
Expected: PASS, 4 tests.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/claims/TreeMinimap.tsx frontend/src/components/claims/TreeMinimap.test.tsx
git commit -m "feat(frontend): whole-tree minimap"
```

---

### Task 13: Impact control

**Files:**
- Create: `frontend/src/components/claims/ImpactControl.tsx`, `frontend/src/components/claims/ImpactControl.test.tsx`
- Modify: `frontend/src/components/claims/ClaimCard.tsx`

**Interfaces:**
- Consumes: `useRateClaim` (Task 9).
- Produces: `<ImpactControl claimId={string} impact={number | null} ratingCount={number} myRating={number | null} canRate={boolean} />`.

- [ ] **Step 1: Write the failing tests**

```tsx
it('presents a labelled scale, never a bare number', () => {});
it('shows the aggregate as a bar', () => {});
it('lets a connected user change an existing rating', async () => {});
it('disables rating for a signed-out visitor but still shows the aggregate', () => {});
it('shows no aggregate when nobody has rated', () => {});
```

- [ ] **Step 2: Run them and confirm they fail**

Run: `cd frontend && npm test src/components/claims/ImpactControl.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement it**

Nine steps presented with words at the ends and middle, not digits. The bar uses the side's own colour so it reads as part of the card.

- [ ] **Step 4: Run tests and build**

Run: `cd frontend && npm test && npm run build`
Expected: PASS, build clean.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/claims/ImpactControl.tsx frontend/src/components/claims/ImpactControl.test.tsx frontend/src/components/claims/ClaimCard.tsx
git commit -m "feat(frontend): impact rating control"
```

---

### Task 14: Compose a claim, assemble band 3, reserve the badges slot

**Files:**
- Create: `frontend/src/components/claims/ClaimComposer.tsx`, `frontend/src/components/claims/ArgumentTree.tsx`
- Create: `frontend/src/components/claims/ArgumentTree.test.tsx`
- Modify: `frontend/src/pages/CommunityHubPage.tsx`

**Interfaces:**
- Consumes: every component from Tasks 10–13 and every hook from Task 9.
- Produces: `<ArgumentTree communityId={string} />`, mounted as band 3.

- [ ] **Step 1: Write the failing tests**

```tsx
it('renders the root claim with both columns on first load', async () => {});
it('requires a connected account to add a claim', () => {});
it('adds a claim to the side the composer was opened on', async () => {});
it('keeps bands 1, 2 and 4 mounted while the focused claim changes', async () => {});
it('reserves the badges slot without rendering badge content', () => {});
```

- [ ] **Step 2: Run them and confirm they fail**

Run: `cd frontend && npm test src/components/claims/ArgumentTree.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement them**

`ArgumentTree` owns the `?claim=` state and composes breadcrumb, focused claim, columns and minimap. `ClaimComposer` reuses the existing draft-persistence hook, keyed by parent claim id so drafts do not leak between claims. In `CommunityHubPage.tsx`, mount `ArgumentTree` as band 3 and an empty `<section data-slot="badges" />` between bands 2 and 3.

- [ ] **Step 4: Run the full suite and build**

Run: `cd frontend && npm test && npm run build && npm run lint`
Expected: PASS, build clean, lint clean.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/claims/ClaimComposer.tsx frontend/src/components/claims/ArgumentTree.tsx frontend/src/components/claims/ArgumentTree.test.tsx frontend/src/pages/CommunityHubPage.tsx
git commit -m "feat(frontend): assemble the argument tree as band 3"
```

---

## Self-Review Notes

- **Spec coverage.** §6 claim model → Task 1. Root claim → Task 1. Device 1 two columns → Tasks 2, 10. Device 2 zoom + breadcrumb → Tasks 2, 11. Device 3 minimap → Tasks 3, 12. Device 4 child counts → Tasks 1, 2, 10. Device 5 impact → Tasks 5, 13. Authoring → Task 4. Editing → Task 6. Move/merge/hide → Task 7. Maven via `requireRole` → Task 7. Brigading metadata → Tasks 1, 5. Teal/coral → Task 10. Badges slot → Task 14. §9 role grants → Task 1.
- **Not covered, by design.** §7's revision surface is a later milestone. Duplicate detection is explicitly deferred. Seasons are the other plan.
- **Interface consistency checked** across Tasks 2, 3, 6 and 9: `Claim`, `ClaimNode`, `ShapeNode` and `ClaimEdit` use the same field names in the API and the frontend types.
- **Carried risk.** Task 5's aggregate ignores the brigading metadata it records. That is deliberate — the data cannot be reconstructed later, but weighting it is a product decision nobody has made yet.
