# Focused Communities

## What This Is

Focused Communities is a dedicated civic deliberation hub for each topic on the Empowered Compass. Authenticated citizens (Connected Accounts) can read five preset stance positions on a topic, then engage in productive forum debate with other community members. It is a rebranding of "Issues in Focus" from the Empowered.Vote platform, built as a standalone site that shares design language with the existing Current Civic Spaces app (itself a rebrand of Equal Slices).

v1.0 shipped 2026-04-17 with 26 community hubs, full forum functionality, inline edit history, and live integrations with Compass, Civic Spaces, and Accounts.

## Core Value

Give every compass topic a home where citizens can understand all five perspectives and debate productively — without tribal noise.

## Requirements

### Validated

- ✓ Community directory — browsable list of all Focused Communities — v1.0
- ✓ Community hub page — per-topic landing page with name, description, and entry into stances + forum — v1.0
- ✓ Five-stance breakdown — the five preset positions for each compass spoke, displayed as neutral stance cards with pre-written text — v1.0
- ✓ Forum — open thread list where Connected Accounts can post; anyone can read — v1.0
- ✓ Thread view — individual discussion thread with replies — v1.0
- ✓ Post creation — Connected Account can start a new thread in a community — v1.0
- ✓ Reply — Connected Account can reply to an existing thread — v1.0
- ✓ Entry points — hub reachable from Compass spoke (LibraryDrawer), Civic Spaces nav, and user Profile page — v1.0
- ✓ Authentication gate — posting requires Connected Account; reading is open to all — v1.0

### Active

*(None — define via /gsd:new-milestone for v1.1)*

### Out of Scope

- Badge ratification workflows — Phase 2+; requires Badges infrastructure
- Symposiums — Phase 2+; structured scheduled debates are a separate system
- Argument maps — deferred; requires dedicated mapping tooling
- Maturity tiers (Emerging/Developing/Established) — deferred; needs community activity data
- Community distribution stats (% holding each stance) — deferred; privacy implications need consideration
- Veracity Rating display — deferred; needs Veracity system integration
- Tolerance Rating — deferred; needs Tolerance system integration
- Politician stance monitoring — deferred; belongs to Inform Pillar integration
- Anonymous posting — by design, posting always requires Connected Account

## Context

- **Platform**: Empowered.Vote — civic technology platform built around three pillars: Inform, Connect, Empower. Focused Communities lives in the Connect Pillar.
- **Pilot city**: Bloomington, Indiana (Monroe County). Compass topic content is manually curated for quality control.
- **Existing site**: Current Civic Spaces (rebrand of Equal Slices) — shares the same CivicSpace design language. This is a new repo, not a new section of that codebase.
- **Design foundation**: CivicSpace design system — primary `#03b9d2` (teal), accent `#fed12e` (gold), white background, `#6b7280` muted text, `#e4e2dc` borders, Inter typeface, 8px/16px/20px border radii, subtle box shadows.
- **Compass data model**: Each topic has 5 preset stance positions with pre-written stance text (positions 1–5). The `inverted` mechanic (user can flip direction of a spoke) applies to compass rendering but not to the stance breakdown display here.
- **Auth model**: Supabase Auth → `public.users` → `connected_profiles`. Connected Account = presence of `connected_profiles` record. Posting requires this. Reading does not.
- **Account display**: Connected users post under their pseudonym (`connected_profiles.display_name`). Never expose legal identity in Connect contexts.
- **Current state**: v1.0 shipped. 26 communities live (one per live Compass topic). 6,695 LOC TypeScript/TSX/SQL. All external integrations (Compass, Civic Spaces, Accounts) confirmed shipped.

## Constraints

- **Tech stack**: Supabase (DB/auth/RLS), Render (Express/TypeScript backend, all routes `/api/` prefix), Upstash Redis with in-memory fallback, Vite/React frontend. TypeScript everywhere.
- **Repo naming**: `empowered-focused-communities` per platform convention.
- **RLS always on**: Row-level security at the database layer; application checks are a second layer only.
- **Migrations only**: All schema changes via Supabase CLI — no manual production changes.
- **Health check**: Every backend exposes `GET /api/health → { status: 'ok', timestamp: Date.now() }`.
- **No party labels**: Anti-partisan design — stance cards present policy positions without party attribution.
- **Privacy by default**: Collect only what is necessary. No selling or exposing user data.
- **Memory over moderation**: Posts cannot be deleted — they can be corrected and contextualized. Edits are visible. This is a hard design principle.
- **Slug stability**: Community slugs are a public contract (Compass backend stores them). Slugs are archived on rename via `slug_history` trigger; old URLs self-resolve and redirect.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| New repo, not a section of Civic Spaces | Independent deployment, cleaner separation of Connect Pillar features | ✓ Good |
| Open thread list (not structured sections) | Familiar, lower friction for v1; structure can be added as community matures | ✓ Good |
| Stances only (no distribution data) | Privacy implications of showing % breakdown need consideration; stance text is the core value | ✓ Good |
| Read open / post requires Connected Account | Maximizes reach for Inform value while protecting Connect integrity | ✓ Good |
| 5 stances per topic, no party labels | Anti-partisan design principle; policy substance before party affiliation | ✓ Good |
| moderation_status enum (not deleted_at) in RLS | Avoids Supabase soft-delete deadlock bug #1941; soft-hide without RLS conflict | ✓ Good |
| Display name snapshotted at post time via DB trigger | Pseudonym preserved after profile name changes; no application-layer coordination needed | ✓ Good |
| JWKS + Accounts API dual-check on every write | Both required; accounts API enables session revocation beyond JWT expiry | ✓ Good |
| position stripped at hook boundary (DisplayStance) | TypeScript enforces no position number reaches StanceCard; Fisher-Yates shuffle on load | ✓ Good |
| Upstash Redis sliding window + in-memory fallback | Brigading protection without hard Redis dependency; dev/test works without Upstash | ✓ Good |
| LibraryDrawer link (not spoke-tap) for Compass integration | Avoids conflict with calibration overlay UX; negotiated in v1.1 spec review | ✓ Good |
| Slug history via pg trigger + array containment fallback | External links survive renames; URL self-corrects in browser via navigate(replace) | ✓ Good |
| 26 communities (all live Compass topics) | Expanded from 5 pilot topics; stance content pre-seeded for all 32 topic UUIDs in Phase 4.5 | ✓ Good |

---
*Last updated: 2026-04-17 after v1.0 milestone*
