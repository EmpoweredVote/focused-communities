---
phase: 06-entry-points-deployment
verified: 2026-04-17T00:00:00Z
status: human_needed
score: 3/5 must-haves verified automatically; 2/5 require human confirmation (external teams, external service)
human_verification:
  - test: Compass team implements spoke-tap navigation using COMPASS-INTEGRATION-SPEC.md
    expected: Tapping a Compass spoke opens https://fc.empowered.vote/communities/{slug}
    why_human: External Compass team integration; FC owns only the spec document; live integration requires Compass team action
    spec_path: .planning/phases/06-entry-points-deployment/COMPASS-INTEGRATION-SPEC.md
    note: Spec complete; mapping table has placeholder -- run SELECT id, slug, name, topic_id FROM connect.communities ORDER BY name against production before distributing
  - test: Civic Spaces team adds nav link to the Focused Communities directory
    expected: Nav link labeled Focused Communities at https://fc.empowered.vote in Civic Spaces nav bar
    why_human: External Civic Spaces team integration; FC owns only the spec document
    spec_path: .planning/phases/06-entry-points-deployment/CIVIC-SPACES-NAV-SPEC.md
  - test: UptimeRobot monitor for /api/health is active
    expected: UptimeRobot polling https://fc.empowered.vote/api/health at 5-minute intervals alerting bfranklin@empowered.vote
    why_human: UptimeRobot free tier has no programmatic verification API; user confirmed setup at 06-03 checkpoint
---

# Phase 6: Entry Points and Deployment Verification Report

**Phase Goal:** The site is reachable from all external entry points, user post history is accessible from their profile, and the system passes the full production deployment checklist
**Verified:** 2026-04-17
**Status:** human_needed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Tapping a Compass spoke opens that topic community hub at its stable shareable URL | ? HUMAN NEEDED | COMPASS-INTEGRATION-SPEC.md exists and is complete; actual integration requires Compass team action; mapping table requires DB query before distribution |
| 2 | Current Civic Spaces site displays a working nav link to FC directory | ? HUMAN NEEDED | CIVIC-SPACES-NAV-SPEC.md exists and is complete; actual nav link requires Civic Spaces team action |
| 3 | User profile page shows post history with thread links; pseudonym displayed throughout | VERIFIED | GET /api/users/:id/posts in src/routes/users.ts; registered in src/app.ts; all 10 required fields returned; requireAuth applied; 403 self-only gate confirmed; author_display_name snapshotted maps to authorPseudonym |
| 4 | All API responses touching auth have Cache-Control: private, no-store | VERIFIED | src/middleware/auth.ts line 88 inside requireAuth success path before next() -- covers every auth-gated route |
| 5 | UptimeRobot monitors /api/health; service role key absent from client bundles | PARTIALLY VERIFIED | Bundle CLEAN -- 0 matches for service_role/SUPABASE_SERVICE/SUPABASE_KEY in frontend/dist/assets/. UptimeRobot requires human confirmation. |

**Score:** 3/5 truths verified automatically. Criteria 1 and 2 are human-needed by design (external team dependencies). Criterion 5 is split: bundle scan verified, UptimeRobot is human-needed.

---

## Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| src/routes/users.ts | GET /api/users/:id/posts endpoint | VERIFIED | 79 lines; requireAuth used; 403 self-only gate at line 14; all 10 required fields returned; no cacheMiddleware |
| src/app.ts | usersRouter registered at /api | VERIFIED | Line 9 imports usersRouter; line 22: app.use(/api, usersRouter) |
| src/middleware/auth.ts | Cache-Control: private, no-store in requireAuth | VERIFIED | Line 88: res.setHeader before req.user = user; next() |
| frontend/src/components/Header.tsx | Shared header with Your activity link | VERIFIED | 45 lines; named export; renders on connected and connected_no_compass; links to accounts.empowered.vote/profile in teal |
| frontend/src/pages/DirectoryPage.tsx | Header on all return paths | VERIFIED | Imported line 5; rendered line 25 |
| frontend/src/pages/CommunityHubPage.tsx | Header on all return paths | VERIFIED | Imported line 11; rendered lines 32, 48, 59 |
| frontend/src/pages/ThreadPage.tsx | Header on all return paths | VERIFIED | Imported line 15; rendered lines 57, 78, 97 |
| frontend/dist/assets/ | Built bundle with no secret leakage | VERIFIED | dist/assets/ exists; 0 grep matches for service_role/SUPABASE_SERVICE/SUPABASE_KEY |
| COMPASS-INTEGRATION-SPEC.md | Complete Compass team handoff spec | VERIFIED | 117 lines; hub URL pattern, mapping table with production SQL, integration instructions, fallback behavior |
| CIVIC-SPACES-NAV-SPEC.md | Complete Civic Spaces team handoff spec | VERIFIED | 75 lines; URL, link text, short label, placement, auth coordination, deferred contextual link path |
| EV-POST-HISTORY-STANDARD.md | Cross-product API standard document | VERIFIED | 336 lines; API contract, pseudonym rules, Accounts aggregation pattern, FC reference implementation, Civic Spaces adoption guide |
| ACCOUNTS-HANDOFF-SPEC.md | Accounts team handoff spec | VERIFIED | 265 lines; endpoint contract, response schema, display requirements, pagination, error handling |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| requireAuth middleware | Cache-Control header | res.setHeader() | VERIFIED | auth.ts line 88 inside success path before next() |
| GET /api/users/:id/posts | requireAuth | route chain second arg | VERIFIED | users.ts line 12: usersRouter.get with requireAuth as second arg |
| GET /api/users/:id/posts | 403 gate | req.params.id !== req.user.id | VERIFIED | users.ts lines 14-19: 403 FORBIDDEN on mismatch |
| GET /api/users/:id/posts | authorPseudonym | author_display_name snapshotted | VERIFIED | users.ts line 70: authorPseudonym from p.author_display_name |
| GET /api/users/:id/posts | communitySlug | communities!inner join | VERIFIED | users.ts lines 31-33 and line 66 |
| src/app.ts | usersRouter | import + app.use | VERIFIED | app.ts lines 9 and 22 |
| Header.tsx | Your activity link | href to accounts profile | VERIFIED | Header.tsx line 28 |
| All three pages | Header component | import + JSX on all paths | VERIFIED | Loading, error, and main paths in DirectoryPage, CommunityHubPage, ThreadPage |
| frontend/dist bundle | no secrets | Vite env var scoping | VERIFIED | 0 matches for all secret key patterns in dist/assets/ |
| COMPASS-INTEGRATION-SPEC.md | Compass team | spec document handoff | HUMAN NEEDED | Spec ready; Compass team must implement and populate mapping table from production DB |
| CIVIC-SPACES-NAV-SPEC.md | Civic Spaces team | spec document handoff | HUMAN NEEDED | Spec ready; Civic Spaces team must implement nav link |

---

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| COMPASS-INTEGRATION-SPEC.md | 58 | FILL FROM PRODUCTION DB placeholder in mapping table | Info | Intentional -- SQL to populate it is included in spec. Must be filled before distributing to Compass team. |

No code stubs, TODO/FIXME comments, empty handlers, or placeholder renders found in any source files modified in this phase.

---

## Human Verification Required

### 1. Compass Spoke-Tap Integration

**Test:** After Compass team implements using COMPASS-INTEGRATION-SPEC.md, tap a Compass spoke on the Empowered Compass UI.
**Expected:** Browser navigates to https://fc.empowered.vote/communities/{slug} for the corresponding community hub.
**Why human:** External Compass team must implement; FC provides only the spec and stable hub URLs.
**Pre-distribution action required:** Run the SQL in the spec against production Supabase and populate the mapping table before sending to Compass team.
**Spec:** .planning/phases/06-entry-points-deployment/COMPASS-INTEGRATION-SPEC.md

### 2. Civic Spaces Nav Link

**Test:** After Civic Spaces team implements using CIVIC-SPACES-NAV-SPEC.md, visit the Civic Spaces site and check the navigation bar.
**Expected:** A link labeled Focused Communities (or FC on narrow viewports) appears and navigates to https://fc.empowered.vote.
**Why human:** External Civic Spaces team must implement; FC provides only the spec.
**Spec:** .planning/phases/06-entry-points-deployment/CIVIC-SPACES-NAV-SPEC.md

### 3. UptimeRobot Monitor

**Test:** Log into UptimeRobot and verify an active monitor exists.
**Expected:** Monitor configured for https://fc.empowered.vote/api/health at 5-minute intervals alerting bfranklin@empowered.vote. Status shows Up.
**Why human:** UptimeRobot free tier has no programmatic API to verify monitor existence; user confirmed setup during 06-03 checkpoint.

---

## Gaps Summary

No gaps. All code-verifiable criteria pass:

- GET /api/users/:id/posts is fully implemented with all 10 required fields, requireAuth, 403 self-only gate, and no cacheMiddleware
- requireAuth sets Cache-Control: private, no-store in a single central location covering all auth-gated routes
- All four spec and handoff documents exist and are substantive (75 to 336 lines each)
- Frontend bundle is clean -- 0 matches for service_role/SUPABASE_SERVICE/SUPABASE_KEY in dist/assets/
- Header component is wired to all three pages on all render paths (loading, error, main)

The two external integration items (Criteria 1 and 2) are human-needed by design -- they require Compass and Civic Spaces teams to act on the handoff specs FC has prepared. One pre-distribution action is needed: populate the Compass mapping table from the production DB before sending COMPASS-INTEGRATION-SPEC.md to the Compass team. The UptimeRobot item is infrastructure confirmed by user at checkpoint.

---

_Verified: 2026-04-17_
_Verifier: Claude (gsd-verifier)_
