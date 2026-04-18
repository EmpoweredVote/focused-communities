# Project Milestones: Focused Communities

## v1.0 Launch (Shipped: 2026-04-17)

**Delivered:** Full civic deliberation platform — 26 community hubs (one per live Compass topic), five-stance breakdown, open forum with threaded replies, inline editing with public version history, and live integrations with Compass, Civic Spaces, and Accounts.

**Phases completed:** 1–6 including inserted Phase 4.5 (23 plans total)

**Key accomplishments:**

- Complete Supabase schema with RLS, moderation_status soft-hide, atomic edit-history triggers, and security-invoker views — all via CLI migrations, zero manual console changes
- JWKS-based JWT auth (ES256) with dual-check verification (Supabase + Accounts API); frontend AuthContext, AuthGate, and apiFetch primitives with draft-preserving new-tab 401 handling
- Full cursor-paginated read API (communities, stances, threads, posts) with Upstash Redis + in-memory fallback caching at tuned TTLs
- Write API with atomic DB-trigger versioning, sliding-window rate limiting (5 posts/hour), 405 DELETE rejection, and publicly queryable edit history (Memory over Moderation)
- 160 stance rows (32 topics × 5 stances) authored with description + examplePerspectives; position number stripped at hook boundary so it never reaches UI
- Standalone React/Vite frontend — directory with keyword filter, community hub with randomized stance cards, thread list with 30s polling, optimistic reply submission, inline post editing, localStorage draft preservation
- Compass integration (LibraryDrawer link + v1.2 26-community mapping spec), Civic Spaces nav link, Accounts post history (GET /api/users/:id/posts + PostHistory.tsx), and slug history infrastructure for permanent external link stability

**Stats:**

- 150 files created/modified
- 6,695 lines of TypeScript/TSX/SQL
- 7 phases, 23 plans
- 2 days (2026-04-15 → 2026-04-17)

**Git range:** `838c1f2 feat(01-01)` → `baeb2cb feat: stable slug history`

**What's next:** v1.1 — TBD (anti-spam, Gems voting, moderation tools, or Badges integration)

---
