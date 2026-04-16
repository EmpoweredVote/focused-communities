# Requirements: Focused Communities

**Defined:** 2026-04-15
**Core Value:** Give every compass topic a home where citizens can understand all five perspectives and debate productively — without tribal noise.

## v1 Requirements

### Directory

- [ ] **DIR-01**: User can view a browsable list of all Focused Communities (one per compass topic)
- [ ] **DIR-02**: User can search/filter communities by name or topic keyword
- [ ] **DIR-03**: Each community listing shows its topic description
- [ ] **DIR-04**: Each community listing shows its member count (Connected Accounts who have posted)
- [ ] **DIR-05**: Directory displays multiple slices of the same topic when a community has been sharded (schema supports slicing from day one; v1 may only have one slice per topic)

### Community Hub

- [ ] **HUB-01**: User can view a community hub page for each compass topic
- [ ] **HUB-02**: Hub page displays a brief topic description at the top
- [ ] **HUB-03**: Hub page displays community activity stats (thread count, recent activity)
- [ ] **HUB-04**: Hub page displays five stance cards — the preset written positions for that compass spoke, presented neutrally with no party labels
- [ ] **HUB-05**: Stance cards are read-only and available to all users (no auth required)

### Forum — Threads

- [ ] **THRD-01**: User can view a paginated thread list for a community (cursor-based, newest first)
- [ ] **THRD-02**: Thread list is readable by all users without authentication
- [x] **THRD-03**: Connected Account can create a new thread in a community
- [x] **THRD-04**: Thread shows author pseudonym (connected_profiles.display_name) on creation and all edits
- [ ] **THRD-05**: Thread list shows preview (title + excerpt), author pseudonym, reply count, and time

### Forum — Replies

- [ ] **REPL-01**: User can view all replies in a thread (flat, chronological)
- [x] **REPL-02**: Connected Account can reply to an existing thread
- [ ] **REPL-03**: Reply shows author pseudonym and timestamp

### Forum — Editing

- [x] **EDIT-01**: Connected Account can edit their own thread or reply
- [x] **EDIT-02**: Edited posts display a visible "edited" indicator
- [x] **EDIT-03**: Full edit history is preserved and publicly viewable for every post (Memory over Moderation)
- [x] **EDIT-04**: Posts cannot be deleted by users — only soft-hidden by moderators via moderation_status

### Authentication

- [x] **AUTH-01**: Unauthenticated user attempting to post is redirected to sign-in
- [x] **AUTH-02**: Auth gate enforced at both API (RLS + middleware) and UI (redirect) layers
- [x] **AUTH-03**: Account age gate is NOT in v1 — deferred to anti-spam phase

### Profile

- [ ] **PROF-01**: User's profile page shows their post history across all communities
- [ ] **PROF-02**: Posts in profile history link back to their originating community thread
- [ ] **PROF-03**: Profile displays Connected Account pseudonym, never legal name

### Entry Points

- [ ] **ENTR-01**: Tapping a spoke on the Empowered Compass navigates to that topic's community hub
- [ ] **ENTR-02**: Current Civic Spaces site includes a nav link to the Focused Communities directory
- [ ] **ENTR-03**: User's profile page links to communities they've participated in
- [ ] **ENTR-04**: Each community hub has a stable, shareable URL

### Infrastructure

- [x] **INFRA-01**: Backend exposes GET /api/health → { status: 'ok', timestamp: Date.now() }
- [x] **INFRA-02**: All backend routes use /api/ prefix
- [x] **INFRA-03**: Redis cache with in-memory fallback on all read routes
- [x] **INFRA-04**: RLS enforced at database layer; API middleware is second layer
- [x] **INFRA-05**: connect.* schema uses moderation_status enum (not deleted_at) for soft-hide
- [x] **INFRA-06**: All schema changes via Supabase CLI migrations only

## v2 Requirements

### Gems Voting

- **GEMS-01**: Connected Account can upvote a thread using Empowered Gems (limited supply)
- **GEMS-02**: Gem votes affect display sort order (gems-first option alongside chronological)
- **GEMS-03**: Gem economy integrated with platform-wide gem ledger (closed economy, never sold)

### Anti-Spam

- **SPAM-01**: 24-hour minimum account age before first post
- **SPAM-02**: Redis sliding-window rate limit on post creation per user

### Moderation Tools

- **MOD-01**: Moderator role can soft-hide a post (set moderation_status = 'hidden')
- **MOD-02**: Hidden post shows "[removed by moderator]" placeholder — content and history remain in DB
- **MOD-03**: Moderator action log is preserved for transparency

### Slicing (Auto-Shard)

- **SLICE-01**: When a community reaches 6,000 active members, a new slice is automatically created
- **SLICE-02**: New members are assigned to the newest slice; existing members remain in their slice
- **SLICE-03**: Directory shows all slices of a topic with slice number indicator

### Badges Integration

- **BADGE-01**: Ratified Badges appear in the hub as verified shared facts
- **BADGE-02**: Badge ratification workflow available inside the community

### Symposiums

- **SYMP-01**: Scheduled structured debates hosted inside a community
- **SYMP-02**: Symposium archive viewable by all users

### Argument Maps

- **ARGMAP-01**: Visual argument map showing major positions and their supporting/opposing claims

### Maturity Tiers

- **MAT-01**: Community displays Emerging / Developing / Established maturity indicator based on activity
- **MAT-02**: Maturity tier changes are logged and visible in community history

## Out of Scope

| Feature | Reason |
|---------|--------|
| Party labels on stances or posts | Hard anti-partisan design principle — never |
| Hard delete of posts | Hard Memory over Moderation principle — never |
| Anonymous posting | Connect Pillar requires persistent identity for accountability |
| Algorithmic sort / recommendation | Engagement-bait pattern — harmful to civic discourse |
| Downvotes | Research-validated harm to discourse quality; excluded by design |
| Karma / reputation scores visible in forum | Creates perverse incentives; Veracity Rating is separate and system-managed |
| Direct messages between users | Out of scope for deliberation platform; creates private channels that bypass accountability |
| Real name display in forum | Connect context always uses pseudonym; Empower is separate |
| OAuth login (Google, GitHub) | Not in platform auth model; Supabase email auth only |
| Native mobile app | Web-first for pilot; Framer handles responsive |
| Push notifications | Deferred; not needed for pilot scale |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| INFRA-01 | Phase 1 — Foundation + Schema | Complete |
| INFRA-02 | Phase 1 — Foundation + Schema | Complete |
| INFRA-03 | Phase 1 — Foundation + Schema | Complete |
| INFRA-04 | Phase 1 — Foundation + Schema | Complete |
| INFRA-05 | Phase 1 — Foundation + Schema | Complete |
| INFRA-06 | Phase 1 — Foundation + Schema | Complete |
| AUTH-01 | Phase 2 — Auth Infrastructure | Complete |
| AUTH-02 | Phase 2 — Auth Infrastructure | Complete |
| AUTH-03 | Phase 2 — Auth Infrastructure | Complete |
| DIR-01 | Phase 3 — Read API + Cache | Complete |
| DIR-02 | Phase 3 — Read API + Cache | Complete |
| DIR-03 | Phase 3 — Read API + Cache | Complete |
| DIR-04 | Phase 3 — Read API + Cache | Complete |
| DIR-05 | Phase 3 — Read API + Cache | Complete |
| HUB-01 | Phase 3 — Read API + Cache | Complete |
| HUB-02 | Phase 3 — Read API + Cache | Complete |
| HUB-03 | Phase 3 — Read API + Cache | Complete |
| HUB-04 | Phase 3 — Read API + Cache | Complete |
| HUB-05 | Phase 3 — Read API + Cache | Complete |
| THRD-01 | Phase 3 — Read API + Cache | Complete |
| THRD-02 | Phase 3 — Read API + Cache | Complete |
| THRD-05 | Phase 3 — Read API + Cache | Complete |
| REPL-01 | Phase 3 — Read API + Cache | Complete |
| REPL-03 | Phase 3 — Read API + Cache | Complete |
| THRD-03 | Phase 4 — Write API + Rate Limiting | Complete |
| THRD-04 | Phase 4 — Write API + Rate Limiting | Complete |
| REPL-02 | Phase 4 — Write API + Rate Limiting | Complete |
| EDIT-01 | Phase 4 — Write API + Rate Limiting | Complete |
| EDIT-02 | Phase 4 — Write API + Rate Limiting | Complete |
| EDIT-03 | Phase 4 — Write API + Rate Limiting | Complete |
| EDIT-04 | Phase 4 — Write API + Rate Limiting | Complete |
| PROF-01 | Phase 6 — Entry Points + Deployment | Pending |
| PROF-02 | Phase 6 — Entry Points + Deployment | Pending |
| PROF-03 | Phase 6 — Entry Points + Deployment | Pending |
| ENTR-01 | Phase 6 — Entry Points + Deployment | Pending |
| ENTR-02 | Phase 6 — Entry Points + Deployment | Pending |
| ENTR-03 | Phase 6 — Entry Points + Deployment | Pending |
| ENTR-04 | Phase 6 — Entry Points + Deployment | Pending |

**Coverage:**
- v1 requirements: 38 total
- Mapped to phases: 38
- Unmapped: 0 ✓

Note: Phase 5 (Frontend UI) delivers all user-facing behaviors for DIR, HUB, THRD, REPL, EDIT, and AUTH requirements. Those requirements are assigned to the phases where their API and schema contracts are established (Phases 1-4). Phase 5 completes their observable delivery in the UI layer.

---
*Requirements defined: 2026-04-15*
*Last updated: 2026-04-15 after Phase 1 completion*
