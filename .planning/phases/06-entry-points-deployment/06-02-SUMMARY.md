---
phase: 06-entry-points-deployment
plan: 02
subsystem: docs
tags: [api-contract, cross-product, post-history, compass, civic-spaces, spec]

# Dependency graph
requires:
  - phase: 06-entry-points-deployment
    provides: Context and research for Phase 6 spec documents
  - phase: 01-foundation-schema
    provides: connect.communities table with slug and topic_id columns
  - phase: 06-entry-points-deployment/06-01
    provides: GET /api/users/:id/posts endpoint (FC reference implementation)
provides:
  - COMPASS-INTEGRATION-SPEC.md: topic-to-slug mapping, hub URL pattern, integration instructions
  - CIVIC-SPACES-NAV-SPEC.md: directory link spec with URL, text, placement guidance
  - EV-POST-HISTORY-STANDARD.md: cross-product API contract for unified post history
affects: [compass-team, civic-spaces-team, accounts-team, future-ev-products]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Cross-product API standard: GET /api/users/:id/posts with Bearer JWT, cursor pagination, sourceProduct field"
    - "Pseudonym snapshotting: authorPseudonym stored at write time, never updated retroactively"
    - "Opaque cursor encoding: base64 JSON { t, id } — consumers treat as black box"

key-files:
  created:
    - .planning/phases/06-entry-points-deployment/COMPASS-INTEGRATION-SPEC.md
    - .planning/phases/06-entry-points-deployment/CIVIC-SPACES-NAV-SPEC.md
    - .planning/phases/06-entry-points-deployment/EV-POST-HISTORY-STANDARD.md
  modified: []

key-decisions:
  - "Compass mapping table uses [FILL FROM PRODUCTION DB] placeholder + SQL — communities were seeded directly in DB, not in migrations; live query required"
  - "Civic Spaces nav link is single static directory link (fc.empowered.vote); contextual per-topic links deferred"
  - "sourceProduct is a registered string value, not an enum — new products register with platform team"
  - "Pseudonym snapshotting is a hard requirement for the standard; backfill guidance included for Civic Spaces"

patterns-established:
  - "EV Post History Standard v1.0: all EV products implement GET /api/users/:id/posts at identical path"
  - "Accounts aggregation: parallel requests to each product, merge by createdAt, label by sourceProduct"

# Metrics
duration: 3min
completed: 2026-04-17
---

# Phase 6 Plan 02: Handoff Spec Documents Summary

**Three handoff spec documents: Compass slug mapping, Civic Spaces nav link, and EV-wide cross-product post history API contract with FC as reference implementation**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-04-17T17:23:08Z
- **Completed:** 2026-04-17T17:26:42Z
- **Tasks:** 2
- **Files modified:** 3 (all created)

## Accomplishments

- Authored COMPASS-INTEGRATION-SPEC.md with hub URL pattern (`https://fc.empowered.vote/communities/{slug}`), topic-to-slug mapping table (placeholder with production SQL), integration instructions for spoke-tap navigation, and fallback behavior
- Authored CIVIC-SPACES-NAV-SPEC.md with the single v1 nav link (`https://fc.empowered.vote`, text "Focused Communities"), placement guidance, deferred contextual link path, and explicit no-auth-coordination note
- Authored EV-POST-HISTORY-STANDARD.md — full cross-product API contract including required fields table (with `sourceProduct`), pseudonym snapshotting rules, cursor pagination contract, error codes, Accounts aggregation pattern, FC reference implementation with example response, and Civic Spaces adoption guide with schema addition guidance

## Task Commits

Each task was committed atomically:

1. **Task 1: Compass integration spec + Civic Spaces nav spec** - `c94b964` (docs)
2. **Task 2: EV Post History Standard** - `ec6010f` (docs)

**Plan metadata:** _(to be added by metadata commit)_

## Files Created/Modified

- `.planning/phases/06-entry-points-deployment/COMPASS-INTEGRATION-SPEC.md` — Compass team handoff: slug mapping, hub URL pattern, integration instructions
- `.planning/phases/06-entry-points-deployment/CIVIC-SPACES-NAV-SPEC.md` — Civic Spaces team handoff: nav link URL/text/placement, deferred contextual links
- `.planning/phases/06-entry-points-deployment/EV-POST-HISTORY-STANDARD.md` — Platform-wide API contract: endpoint path, auth, required fields, pseudonym rules, pagination, Accounts aggregation, FC reference impl, Civic Spaces adoption guide

## Decisions Made

- **Compass mapping placeholder:** Communities were seeded directly into production DB (no seed migration exists). The mapping table uses `[FILL FROM PRODUCTION DB]` with the production SQL query. Whoever finalizes the spec must run `SELECT id, slug, name, topic_id FROM connect.communities ORDER BY name` against production.
- **Single nav link for Civic Spaces:** Confirmed the v1 deliverable is one static link to the FC directory. Contextual per-topic links are a future enhancement enabled by the Compass mapping — deferred per CONTEXT.md.
- **`sourceProduct` as registered string:** Not an enum — new products register their identifier with the platform team before implementing the standard. Registered values: `"focused-communities"` and `"civic-spaces"`.
- **Pseudonym backfill guidance included:** Civic Spaces may not have a `author_display_name` column. The adoption guide covers adding the column, backfilling with current display name as best-effort, and the implications for historical posts.

## Deviations from Plan

None — plan executed exactly as written. The DB query fallback was used as specified (communities not in migration files; live DB query required for real UUIDs).

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- All three handoff spec documents are ready for distribution to Compass, Civic Spaces, and Accounts teams
- COMPASS-INTEGRATION-SPEC.md requires one step before distribution: run the production DB query and populate the mapping table (the SQL is included in the spec)
- Plan 06-03 (production deployment checklist) is ready to execute

---
*Phase: 06-entry-points-deployment*
*Completed: 2026-04-17*
