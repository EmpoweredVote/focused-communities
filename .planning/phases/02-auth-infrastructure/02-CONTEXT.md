# Phase 2: Auth Infrastructure - Context

**Gathered:** 2026-04-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Establish who Connected Accounts are and enforce read-open / write-gated access at both the API and database layers. This phase builds the backend auth middleware, the frontend token lifecycle, and the typed fetch wrapper for `/api/*`. No write routes are built in this phase — only the guards that will protect them.

</domain>

<decisions>
## Implementation Decisions

### Inform-tier write gate
- Display the post/reply form in a **disabled (not hidden) state** with an inline message: *"Connect your account to reply"* and a sign-in link
- Clicking the sign-in link redirects to the Auth Hub with `?redirect=` set to the current thread URL
- After login, user lands back at the **exact thread they were viewing** (not the community hub)

### Suspended account behavior
- Backend returns a distinct error code (e.g., `"reason": "suspended"`) in the 403 response — not a generic permission error
- Frontend renders an inline message: *"Your account is currently suspended and cannot post."*
- No redirect, no modal — inline notice only; suspension reason is not exposed (accounts system concern)

### No-compass prompt (connected_no_compass state)
- Prompt appears **only in the stance card area** — where the empty state is naturally felt
- Always visible while `completed_onboarding: false` — no dismiss button; it is the empty state, not noise
- CTA links to the accounts compass calibration page (likely `compass.empowered.vote` or `accounts.empowered.vote/compass` — **confirm URL with accounts team before implementation**)
- Connected-but-uncalibrated users can still post/reply — calibration is not a write gate

### Session expiry mid-action
- When a fetch returns 401 (expired token), the typed fetch wrapper surfaces an **inline alert** near the action: *"Your session expired — sign in to continue."*
- Auth Hub opens in a **new tab** (not a redirect), preserving the current tab and any unsaved draft content
- No localStorage draft preservation in Phase 2 — that is a Phase 5 concern

### Claude's Discretion
- Exact token extraction and storage implementation from Auth Hub hash redirect
- Backend JWKS caching strategy (keys change rarely — cache is sensible)
- How the typed fetch wrapper attaches the token (auto-reads `localStorage.ev_token`)
- Error display component design

</decisions>

<specifics>
## Specific Ideas

**From accounts onboarding doc (C:\EV-Accounts\docs\FOCUSED-COMMUNITIES-ONBOARDING.md):**

### ⚠️ Plan 02-01 needs significant revision
The roadmap plan says "JWT -> getUser() -> connected_profiles lookup" — this is incorrect per the onboarding doc:
- **JWT verification is JWKS-based** (ES256 asymmetric, migrated from HS256 on 2026-03-27), not `getUser()`. JWKS endpoint: `https://kxsdzaojfaibhuzmclfq.supabase.co/auth/v1/.well-known/jwks.json`
- **Tier is read from `/api/account/me`** (accounts API), not a local `connected_profiles` lookup
- **No local Supabase auth client to build** — there is no Supabase Auth session. Token is `localStorage.ev_token`, issued by the accounts Auth Hub

### ⚠️ Plan 02-02 needs significant revision
The roadmap plan says "Frontend Supabase auth client (publishable key, sign-in/out only)" — this is incorrect:
- There is **no Supabase auth client** on the frontend. Auth is handled entirely by the accounts Auth Hub
- Token arrives in the URL hash after Auth Hub redirect: `window.location.hash` → extract `access_token` → `localStorage.setItem('ev_token', token)`
- Sign-in = redirect to `https://accounts.empowered.vote/login?redirect={encoded_url}`
- Sign-out = clear `localStorage.ev_token`

### Three access states (from onboarding doc)
```typescript
{ state: 'inform' }               // No token, or 401 from accounts API
{ state: 'connected_no_compass', user }  // tier connected/empowered, completed_onboarding: false
{ state: 'connected', user }      // Full experience
```

### Tier check logic
- Gate writes: `tier === 'connected' || tier === 'empowered'`
- Gate writes: `account_standing === 'active'` (suspended = read-only)
- `completed_onboarding: false` = connected but compass empty — write access still allowed

### Cryptographic note
JWT cryptographic validity alone is NOT sufficient for write operations — backend must call `/api/account/me` to verify active sessions (accounts API enforces server-side revocation via Redis).

</specifics>

<deferred>
## Deferred Ideas

- **XP/gem awards for community actions** — The onboarding doc documents a service-to-service XP/gem award API. Whether FC awards XP for posting is a product decision that belongs in a later phase (Phase 4 or 6).
- **localStorage draft preservation** — Preserving compose box content across session expiry belongs in Phase 5's session management plan (05-04).
- **Supabase Third-Party Auth configuration** — The onboarding doc mentions configuring Third-Party Auth with the accounts JWKS URL on our Supabase project. Research whether this is needed for our RLS policies to accept the accounts JWT.

</deferred>

---

*Phase: 02-auth-infrastructure*
*Context gathered: 2026-04-15*
