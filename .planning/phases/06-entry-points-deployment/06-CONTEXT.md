# Phase 6: Entry Points + Deployment - Context

**Gathered:** 2026-04-17
**Status:** Ready for planning

<domain>
## Phase Boundary

FC is reachable from all external entry points (Empowered Compass spokes and Civic Spaces nav), user post history is accessible via API, and the system passes the production deployment checklist. A critical Phase 6 output is three spec documents: the Accounts handoff spec (profile UI), the Compass integration spec (topic-to-slug mapping), and the EV Post History Standard (cross-product API contract that Civic Spaces and future products implement to feed into unified Accounts post history). FC is the reference implementation of the standard. External UI work (Compass wiring, Civic Spaces nav, Accounts profile page) is spec-handoff only — FC does not build those UIs.

</domain>

<decisions>
## Implementation Decisions

### Profile post history API
- Endpoint: `GET /api/users/:id/posts` — ID-based, auth-gated to self for now; future-proofs for Empower public profiles without URL changes
- Auth: self-only for Connect accounts (user can only retrieve their own history); the :id must match the authenticated user's ID
- Response shape: full context per row — `post_id`, `thread_id`, `thread_title`, `community_id`, `community_name`, `post_excerpt` (first ~200 chars), `created_at`, `is_edited`, `author_pseudonym`. Accounts renders without extra API calls.
- Pagination: cursor-based, consistent with other list endpoints in FC

### Profile page ownership
- FC does NOT build a profile page UI — Accounts team owns that
- FC Phase 6 deliverable: API endpoint + full Accounts handoff spec document
- Accounts spec covers: API contract (endpoint, fields, pagination), display requirements (pseudonym never legal name, community name + thread link per row, is_edited indicator), access model (self-only Connect, publicly trackable Empower in future), vision for cross-product aggregation (FC + Civic Spaces + future products all feed into one unified history view)

### Profile page access and navigation
- Post history is private by default — Connect account users see only their own history
- FC header shows a "Your activity" link in the authenticated user menu, pointing to `accounts.empowered.vote/profile`
- Link is added now; Accounts builds the profile page when ready (link stubs until then)
- No "coming soon" states in FC UI — the link exists and Accounts handles the destination

### Compass entry points
- URL format: slug-based — `fc.empowered.vote/communities/[topic-slug]` (human-readable, shareable, matches existing Phase 5 routing)
- FC deliverable: topic-to-slug mapping document (all seeded communities, their slugs, and corresponding Compass topic IDs)
- Compass wiring: handled by Compass team using FC's spec — not FC's codebase work

### Civic Spaces nav link and post history spec
- Phase 6 nav: single "Focused Communities" nav item in Civic Spaces pointing to `fc.empowered.vote` (the directory)
- FC deliverable (nav): URL + recommended link text spec; Civic Spaces team adds nav item to their own site
- FC hubs are topic-based, not location-based — contextual per-topic linking from Civic Spaces pages deferred
- FC deliverable (post history): **EV Post History Standard** — a spec document for Civic Spaces showing how FC built `GET /api/users/:id/posts` and defining the cross-product API contract that every EV product should implement so Accounts can aggregate post history across all products. Civic Spaces was not built with this functionality; the spec gives them everything needed to add it.
- EV Post History Standard covers: the API contract (endpoint path, auth requirements, response shape, pagination), pseudonym rules (never legal name, snapshotted at post time), required fields per post (source product identifier, community/context name, thread/topic link, excerpt, timestamps, is_edited), and the FC reference implementation as the model to follow

### Custom domain
- Already complete: `fc.empowered.vote` (primary) and `focusedcommunities.empowered.vote` (alias) both resolve to the Render deployment
- No domain setup work needed in Phase 6

### Deployment checklist
- No staging environment — verification runs on production; tests are non-destructive (own account for rate limit tests)
- Monitoring: UptimeRobot on `/api/health` only — Render dashboard handles error visibility
- Bundle scan: `grep` on `dist/` output for `service_role` and Supabase key patterns — no external tooling required
- Cache-Control: `private, no-store` on all auth-touching routes (already decided in prior phases; checklist verifies)

### Claude's Discretion
- Pagination defaults (page size, cursor format) for the post history endpoint
- Exact "Your activity" link label and positioning within the header user menu
- UptimeRobot check interval and alert configuration

</decisions>

<specifics>
## Specific Ideas

- "Default to privacy on Connect accounts. When people Empower their accounts, their posts can be tracked transparently." — privacy-by-default is an explicit design value, not just a v1 shortcut
- "I don't want stop gaps that become foundational problems" — FC provides the API and spec; Accounts owns the profile UI. This is the clean separation, not scaffolding.
- "Can we do 1 (directory link) for now and return to 2 (contextual per-topic links) down the road?" — confirmed safe; single nav item and contextual links are independent additions

</specifics>

<deferred>
## Deferred Ideas

- **Unified cross-product post history UI** — Accounts displaying aggregated history from FC + Civic Spaces + future products with flat/grouped toggle. Future Accounts initiative; Phase 6 lays the groundwork via the EV Post History Standard and Accounts spec.
- **Flat + grouped toggle view** — profile page shows both chronological and grouped-by-community views. Deferred to Accounts when they build the profile page.
- **Shareable profile links** — giving Connect users the ability to share their post history with friends. Future feature; v1 is self-only.
- **Publicly trackable Empower profiles** — Empower accounts' post history becomes browsable. Future; the `/:id` endpoint shape already supports this — just relax the auth gate.
- **Contextual per-topic links from Civic Spaces** — Civic Spaces topic pages linking directly to their corresponding FC community hub. Phase 7 polish; topic-to-slug mapping (Phase 6 deliverable) enables this.

</deferred>

---

*Phase: 06-entry-points-deployment*
*Context gathered: 2026-04-17*
