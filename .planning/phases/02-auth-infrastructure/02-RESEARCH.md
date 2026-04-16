# Phase 02: Auth Infrastructure - Research

**Researched:** 2026-04-15
**Domain:** JWT verification (JWKS/ES256), Express middleware, React auth state, typed fetch wrapper
**Confidence:** HIGH (primary research via official docs and verified sources)

---

## Summary

Phase 2 builds the authentication layer between the accounts Auth Hub (which issues JWTs) and the Focused Communities Express backend and React frontend. The critical architectural insight — confirmed during research — is that the accounts JWT is issued by our own Supabase project's Auth server (`kxsdzaojfaibhuzmclfq.supabase.co`). This means `auth.uid()` in existing RLS policies will work correctly: PostgREST extracts the `sub` claim from the JWT and that IS the Supabase user UUID. No RLS rewrite is needed.

The auth stack uses `jose` v6.2.2 for JWKS-based JWT verification on the backend (ES256, asymmetric). The `createRemoteJWKSet` singleton must be created once at module load, not per request — the in-memory cache is per-instance. The accounts API (`/api/account/me`) must be called on every write to enforce server-side session revocation; JWT cryptographic validity alone is insufficient for writes. The service role Supabase client (already in `src/lib/supabase.ts`) is used for backend database writes after middleware validates tier and standing.

The frontend has no Supabase auth client. Auth is a localStorage token (`ev_token`) extracted from the URL hash after Auth Hub redirect, managed by a React Context + `useAuth` hook. The typed fetch wrapper reads `ev_token` automatically, handles 401 by opening Auth Hub in a new tab (not redirecting), and returns typed responses.

**Primary recommendation:** Build auth as three independent units — (1) backend `requireAuth`/`optionalAuth` middleware with `jose`, (2) frontend `AuthContext`/`useAuth` with hash extraction on mount, (3) typed `apiFetch<T>` wrapper with inline 401 handling. Test each unit independently with `mock-jwks` + vitest.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| jose | 6.2.2 | JWKS-based JWT verification (ES256) | Official panva library; supports `createRemoteJWKSet` with built-in in-memory caching; works in Node.js and browser |
| express | 5.2.1 (already installed) | HTTP server; middleware chain | Already in project |
| @supabase/supabase-js | 2.103.2 (already installed) | Service role client for DB writes | Already in project; used only on backend with service role key |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| mock-jwks | 3.3.5 | Mock JWKS endpoint for testing | All auth middleware tests — creates local PKI, signs test JWTs |
| msw | 2.x | HTTP mocking; used internally by mock-jwks | Required peer of mock-jwks |
| vitest | latest | Test runner | Already implied by project; test auth middleware |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| jose createRemoteJWKSet | jsonwebtoken + manual JWKS fetch | jsonwebtoken has no built-in JWKS support; would need manual key fetching and caching |
| module-level JWKS singleton | Per-request JWKS fetch | Per-request would hit the JWKS endpoint on every request — never do this |
| service role client for writes | User JWT passed to Supabase | Passing user JWT to Supabase client would require trust of external JWT at PostgREST layer — service role + middleware checks is cleaner for this auth architecture |

**Installation:**
```bash
# Backend
npm install jose

# Dev/test
npm install -D mock-jwks msw vitest
```

---

## Architecture Patterns

### Recommended Project Structure
```
src/
├── middleware/
│   ├── auth.ts          # requireAuth, optionalAuth — JWKS verification + accounts API call
│   └── tierGuards.ts    # requireConnected — checks req.user.tier and account_standing
├── lib/
│   ├── supabase.ts      # Service role client (already exists)
│   ├── redis.ts         # Cache layer (already exists)
│   └── jwks.ts          # Module-level JWKS singleton
├── types/
│   └── express.d.ts     # Module augmentation: Request.user?: AccountUser
├── routes/
│   ├── health.ts        # Already exists
│   └── account.ts       # GET /api/account/me proxy (Phase 2 read route)
└── app.ts               # Wire middleware
```

Frontend (if applicable in this phase):
```
frontend-src/
├── context/
│   └── AuthContext.tsx   # AuthProvider, useAuth hook
├── lib/
│   └── apiFetch.ts       # Typed fetch wrapper
└── components/
    └── AuthGate.tsx       # Disabled form state + inline messages
```

### Pattern 1: Module-Level JWKS Singleton

**What:** Call `createRemoteJWKSet` once at module load time. Never call it per-request.
**Why:** Each `createRemoteJWKSet` call creates a new instance with its own in-memory cache. Calling per-request means fetching the JWKS endpoint on every request. Module-level singleton shares the cache across all requests.
**Cache behavior:** 10-minute `cacheMaxAge`, 30-second `cooldownDuration`. After a cache miss (unknown `kid`), re-fetches automatically. No manual TTL management needed for this use case.

```typescript
// Source: jose v6 source code + github.com/panva/jose discussion #394
// src/lib/jwks.ts
import { createRemoteJWKSet } from 'jose';

export const JWKS = createRemoteJWKSet(
  new URL('https://kxsdzaojfaibhuzmclfq.supabase.co/auth/v1/.well-known/jwks.json'),
  {
    cacheMaxAge: 10 * 60 * 1000,    // 10 minutes (default)
    cooldownDuration: 30 * 1000,     // 30 seconds (default)
  }
);
```

### Pattern 2: requireAuth Middleware

**What:** Verifies JWT, then calls accounts API to check tier and account standing. Attaches `req.user` on success.
**When to use:** On any write-protected route. Must do BOTH cryptographic verification AND accounts API call for writes.

```typescript
// Source: onboarding doc + jose v6 API
// src/middleware/auth.ts
import { jwtVerify } from 'jose';
import { JWKS } from '../lib/jwks.js';
import type { Request, Response, NextFunction } from 'express';

export interface AccountUser {
  id: string;                        // sub claim (Supabase UUID)
  tier: 'inform' | 'connected' | 'empowered';
  account_standing: 'active' | 'suspended';
  completed_onboarding: boolean;
  display_name: string;
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing token' });
    return;
  }

  const token = authHeader.slice(7);

  try {
    // Step 1: Cryptographic verification (JWKS ES256)
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: 'https://kxsdzaojfaibhuzmclfq.supabase.co/auth/v1',
      audience: 'authenticated',
    });

    // Step 2: Accounts API call (server-side revocation check)
    const accountRes = await fetch('https://accounts.empowered.vote/api/account/me', {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (accountRes.status === 401) {
      res.status(401).json({ error: 'Session expired or revoked' });
      return;
    }

    const user = await accountRes.json() as AccountUser;
    user.id = payload.sub as string;

    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

export async function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    next();
    return;
  }
  // Attempt auth but don't block on failure
  try {
    await requireAuth(req, res, next);
  } catch {
    next();
  }
}
```

### Pattern 3: Express Request Type Augmentation

**What:** Extend the Express `Request` interface globally so all route handlers have typed access to `req.user`.
**How:** Declare merging via a `.d.ts` file. This is the "officially endorsed" approach per Express TypeScript guidance.

```typescript
// src/types/express.d.ts
// Source: https://blog.logrocket.com/extend-express-request-object-typescript/
import type { AccountUser } from '../middleware/auth.js';

export {};

declare global {
  namespace Express {
    interface Request {
      user?: AccountUser;
    }
  }
}
```

### Pattern 4: tierGuards Middleware

**What:** Post-auth middleware that checks tier and account_standing. Only runs after `requireAuth` (which sets `req.user`).
**When to use:** On all write routes. `requireAuth` + `requireConnected` applied together.

```typescript
// src/middleware/tierGuards.ts
import type { Request, Response, NextFunction } from 'express';

export function requireConnected(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const user = req.user;

  if (!user || (user.tier !== 'connected' && user.tier !== 'empowered')) {
    res.status(403).json({ error: 'Connected account required', reason: 'tier' });
    return;
  }

  if (user.account_standing !== 'active') {
    res.status(403).json({ error: 'Account suspended', reason: 'suspended' });
    return;
  }

  next();
}
```

### Pattern 5: Frontend Auth Context

**What:** React Context that reads `localStorage.ev_token` on mount, calls the accounts API to determine access state, and re-exposes the state + actions (signIn, signOut).
**Key behavior:** Hash fragment extraction runs in a `useEffect` on mount. No auth-related library — plain React state.

```typescript
// Source: onboarding doc + React Context patterns
// frontend/src/context/AuthContext.tsx
import { createContext, useContext, useEffect, useState } from 'react';

type AccessState =
  | { state: 'loading' }
  | { state: 'inform' }
  | { state: 'connected_no_compass'; user: AccountUser }
  | { state: 'connected'; user: AccountUser };

interface AuthContextValue {
  auth: AccessState;
  signIn: (redirectBack?: string) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = useState<AccessState>({ state: 'loading' });

  useEffect(() => {
    // Extract token from URL hash (post-Auth Hub redirect)
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const hashToken = hash.get('access_token');
    if (hashToken) {
      localStorage.setItem('ev_token', hashToken);
      window.history.replaceState({}, '', window.location.pathname);
    }

    // Detect access state
    detectUserState().then(setAuth);
  }, []);

  function signIn(redirectBack?: string) {
    const redirect = encodeURIComponent(redirectBack ?? window.location.href);
    window.location.href = `https://accounts.empowered.vote/login?redirect=${redirect}`;
  }

  function signOut() {
    localStorage.removeItem('ev_token');
    setAuth({ state: 'inform' });
  }

  return (
    <AuthContext.Provider value={{ auth, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

async function detectUserState(): Promise<AccessState> {
  // Source: onboarding doc verbatim
  const token = localStorage.getItem('ev_token');
  if (!token) return { state: 'inform' };

  const res = await fetch('https://accounts.empowered.vote/api/account/me', {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.status === 401) {
    localStorage.removeItem('ev_token');
    return { state: 'inform' };
  }

  const user = await res.json() as AccountUser;

  if (user.tier === 'inform') return { state: 'inform' };

  if (!user.completed_onboarding) {
    return { state: 'connected_no_compass', user };
  }

  return { state: 'connected', user };
}
```

### Pattern 6: Typed Fetch Wrapper

**What:** Wrapper around `fetch` that auto-attaches `ev_token`, handles 401 by showing inline alert and opening Auth Hub in a new tab, returns typed responses.
**Design:** Returns a discriminated union `{ ok: true; data: T } | { ok: false; error: string; status: number }`. Caller handles both cases inline.

```typescript
// frontend/src/lib/apiFetch.ts
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; status: number; reason?: string };

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<ApiResult<T>> {
  const token = localStorage.getItem('ev_token');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  } catch {
    return { ok: false, error: 'Network error', status: 0 };
  }

  if (res.status === 401) {
    // Open Auth Hub in new tab — preserves current tab and unsaved content
    window.open(
      `https://accounts.empowered.vote/login?redirect=${encodeURIComponent(window.location.href)}`,
      '_blank'
    );
    return { ok: false, error: 'Session expired — sign in to continue', status: 401 };
  }

  if (res.status === 403) {
    const body = await res.json().catch(() => ({}));
    return {
      ok: false,
      error: body.error ?? 'Forbidden',
      status: 403,
      reason: body.reason,
    };
  }

  if (!res.ok) {
    return { ok: false, error: `Request failed (${res.status})`, status: res.status };
  }

  const data = await res.json() as T;
  return { ok: true, data };
}
```

### Pattern 7: Testing Auth Middleware with mock-jwks

**What:** Use `mock-jwks` to create a local PKI and intercept the JWKS endpoint. Sign test JWTs with the local private key. JWKS singleton must be rebuilt pointing to the mock URL.
**Key constraint:** The JWKS singleton in `src/lib/jwks.ts` must accept a configurable URL (or be injectable) for tests to intercept it.

```typescript
// src/middleware/auth.test.ts
import { createJWKSMock } from 'mock-jwks';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';

// Override JWKS URL in test environment via environment variable
const JWKS_URL = process.env.JWKS_URL ?? 'https://kxsdzaojfaibhuzmclfq.supabase.co/auth/v1/.well-known/jwks.json';
const jwksMock = createJWKSMock(new URL(JWKS_URL).origin);

describe('requireAuth middleware', () => {
  let stop: () => void;

  beforeEach(() => {
    stop = jwksMock.start();
  });

  afterEach(() => {
    stop();
  });

  it('rejects requests with no token', async () => {
    const app = createApp();
    const res = await request(app).get('/api/some-protected-route');
    expect(res.status).toBe(401);
  });

  it('accepts valid JWT', async () => {
    const token = jwksMock.token({
      sub: 'test-user-uuid',
      aud: 'authenticated',
      iss: JWKS_URL.replace('/.well-known/jwks.json', ''),
    });
    const app = createApp();
    const res = await request(app)
      .get('/api/some-protected-route')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).not.toBe(401);
  });
});
```

**Note:** `mock-jwks` 3.3.5 uses MSW internally. The accounts API call in `requireAuth` also needs to be mocked in tests (use `msw` handlers to return a fake `/api/account/me` response).

### Anti-Patterns to Avoid

- **Calling `createRemoteJWKSet` inside middleware or route handlers:** Creates a new instance with empty cache on every call. Always module-level singleton.
- **Trusting JWT cryptographic validity alone for writes:** The accounts API enforces server-side session revocation via Redis. A cryptographically valid token may belong to a logged-out session. Always call `/api/account/me` for write operations.
- **Redirecting on 401 in the fetch wrapper:** The decision requires opening Auth Hub in a **new tab** so unsaved draft content is preserved. Do not `window.location.href = ...` on 401.
- **Using `window.location.replace` to clean the hash:** Use `window.history.replaceState({}, '', window.location.pathname)` to remove the hash without adding to browser history.
- **Exposing `legal_name` or `tolerance_rating` from the accounts API response:** Privacy rules are non-negotiable. Only `display_name` may be shown in Connect contexts.
- **Passing the user JWT directly to the Supabase client for database writes:** The current architecture uses the service role client for all backend DB writes. The JWT is verified in middleware; the DB write uses service role. Do not attempt to construct a Supabase client with the user's JWT on the backend.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JWKS fetching and caching | Custom JWKS fetcher with TTL logic | `jose` `createRemoteJWKSet` | Built-in `cacheMaxAge` (10 min), `cooldownDuration` (30s), automatic re-fetch on unknown `kid`. Handles key rotation. |
| JWT signature verification | Manual base64 decode + signature check | `jose` `jwtVerify` | Handles algorithm negotiation, `kid` matching, expiry, issuer, audience validation atomically. One bug = auth bypass. |
| Mock JWKS for tests | Local HTTP server returning fake JWKS | `mock-jwks` 3.3.5 | Generates real PKI, signs real JWTs, intercepts network calls. A hand-rolled mock is likely to omit `kid` header or wrong algorithm. |
| Request type augmentation | Per-route `as AuthRequest` casts | Express global declaration merging in `.d.ts` | Eliminates type casts in every route handler. One declaration propagates everywhere. |

**Key insight:** JWT verification is a security primitive. Every shortcut (wrong algorithm, skipping audience check, skipping expiry) is a potential auth bypass. Use `jose` end-to-end and test with real signatures via `mock-jwks`.

---

## Common Pitfalls

### Pitfall 1: JWKS Singleton Not Shared Across Requests
**What goes wrong:** JWKS endpoint gets hit on every request; rate limited or slow.
**Why it happens:** `createRemoteJWKSet` is called inside the middleware function body instead of at module top level.
**How to avoid:** Export the `JWKS` constant from `src/lib/jwks.ts` and import it in middleware. The instance persists for the lifetime of the process.
**Warning signs:** Network logs show JWKS endpoint calls proportional to request count rather than once per 10 minutes.

### Pitfall 2: JWT Valid But Session Revoked
**What goes wrong:** A logged-out user can still post/reply during the JWT's remaining validity window (up to 1 hour).
**Why it happens:** The backend only does cryptographic verification (`jwtVerify`) but skips the `/api/account/me` call. The token is still valid until expiry even after sign-out.
**How to avoid:** For all write operations, always call `/api/account/me`. The accounts platform enforces revocation via Redis — the HTTP call is the revocation check.
**Warning signs:** A user who signs out can post again within the token expiry window.

### Pitfall 3: Hash Fragment Not Cleaned After Token Extraction
**What goes wrong:** The token appears in browser history and server logs if the user navigates.
**Why it happens:** `window.location.hash = ''` adds an entry to browser history. Not cleaning the hash at all leaves the token in the URL bar.
**How to avoid:** Use `window.history.replaceState({}, '', window.location.pathname)` immediately after extracting the token.
**Warning signs:** Browser history entries contain `#access_token=...`.

### Pitfall 4: Auth State Not Initialized on Page Load
**What goes wrong:** Components briefly render as if unauthenticated even when `ev_token` exists in localStorage.
**Why it happens:** `useAuth` hook returns initial state before the `useEffect` that reads localStorage and calls the accounts API completes.
**How to avoid:** Include a `loading` state in the auth state machine. Components should render a skeleton/spinner while `state === 'loading'`.
**Warning signs:** Post forms flash briefly in disabled state for authenticated users on page load.

### Pitfall 5: 403 "Suspended" Not Distinguished from Generic 403
**What goes wrong:** Suspended user sees a generic "forbidden" message instead of the specific "Your account is currently suspended and cannot post" message.
**Why it happens:** The backend returns a 403 without the `reason: 'suspended'` field, or the frontend ignores the `reason` field.
**How to avoid:** Backend `tierGuards.ts` must include `reason: 'suspended'` in the 403 body. Frontend `apiFetch` must surface `reason` from the response body. UI components must branch on `reason === 'suspended'`.
**Warning signs:** All 403 errors show the same generic message.

### Pitfall 6: Supabase Third-Party Auth Not Available for Custom JWKS
**What goes wrong:** Attempting to configure Supabase to trust the accounts JWT via the Third-Party Auth settings in the dashboard.
**Why it happens:** Supabase Third-Party Auth only supports Clerk, Firebase Auth, Auth0, AWS Cognito, and WorkOS — not arbitrary JWKS URLs. The `config.toml` confirms no generic JWKS option exists.
**How to avoid:** Do NOT attempt to configure Third-Party Auth for this project. The architecture is correct as designed: JWT verification in Express middleware, database writes via service role client. RLS works because `auth.uid()` maps to the `sub` claim of the Supabase-issued JWT (our project's own auth server issued the token).
**Warning signs:** Looking at `config.toml` `[auth.third_party.*]` sections and finding no custom JWKS option — this is expected and correct.

### Pitfall 7: Supabase RLS and the Backend Write Pattern
**What goes wrong:** Confusion about whether RLS policies need to be updated for Phase 2.
**Why it happens:** The CONTEXT.md notes that the JWT is issued by `kxsdzaojfaibhuzmclfq.supabase.co/auth/v1` — which IS our Supabase project. This means `auth.uid()` in existing RLS policies WILL correctly return the user's UUID. No RLS changes needed.
**How to avoid:** Existing RLS policies from Phase 1 remain correct. Backend writes use the service role client (bypasses RLS) after middleware validates tier + standing. Future consideration: if RLS-level enforcement is desired (defense in depth), a Supabase Edge Function token exchange could issue RLS-compatible tokens — but this is not required in Phase 2.
**Warning signs:** Any plan to add new RLS policies for "connected tier check" — this belongs in middleware, not RLS.

---

## Code Examples

### JWKS Verification (Backend)
```typescript
// Source: onboarding doc + jose v6 API
import { jwtVerify, createRemoteJWKSet } from 'jose';

const JWKS = createRemoteJWKSet(
  new URL('https://kxsdzaojfaibhuzmclfq.supabase.co/auth/v1/.well-known/jwks.json')
);

const { payload } = await jwtVerify(token, JWKS, {
  issuer: 'https://kxsdzaojfaibhuzmclfq.supabase.co/auth/v1',
  audience: 'authenticated',
});
const userId = payload.sub; // accounts UUID = Supabase user UUID
```

### Access State Detection (Frontend)
```typescript
// Source: onboarding doc verbatim
async function detectUserState() {
  const token = localStorage.getItem('ev_token');
  if (!token) return { state: 'inform' };

  const res = await fetch('https://accounts.empowered.vote/api/account/me', {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.status === 401) {
    localStorage.removeItem('ev_token');
    return { state: 'inform' };
  }

  const user = await res.json();

  if (user.tier === 'inform') return { state: 'inform' };
  if (!user.completed_onboarding) return { state: 'connected_no_compass', user };
  return { state: 'connected', user };
}
```

### Hash Token Extraction (Frontend mount)
```typescript
// Source: onboarding doc
const hash = new URLSearchParams(window.location.hash.slice(1));
const token = hash.get('access_token');
if (token) {
  localStorage.setItem('ev_token', token);
  window.history.replaceState({}, '', window.location.pathname);
}
```

### Disabled Form State (Inform tier UI)
```typescript
// Source: CONTEXT.md decisions — display disabled form with inline message
function ReplyForm({ auth }: { auth: AccessState }) {
  if (auth.state === 'inform') {
    return (
      <div>
        <textarea disabled placeholder="Connect your account to reply" />
        <p>
          <a href={signInUrl}>Connect your account to reply</a>
        </p>
      </div>
    );
  }

  if (auth.state === 'connected' || auth.state === 'connected_no_compass') {
    // Calibration is NOT a write gate — connected_no_compass can post
    return <ActiveReplyForm />;
  }

  return null;
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| HS256 shared secret JWT | ES256 asymmetric JWT via JWKS | 2026-03-27 (accounts migration) | No shared secret to protect; verify via public key only |
| `supabase.auth.getUser()` for verification | `jose` `jwtVerify` + JWKS | Phase 2 decision (this project) | No Supabase Auth session; external Auth Hub owns the session |
| Frontend Supabase auth client | No frontend Supabase client; `ev_token` in localStorage | Phase 2 decision (this project) | Auth Hub is the login page; FC never handles credentials |
| Redirect on 401 | Open Auth Hub in new tab on 401 | CONTEXT.md decision | Preserves draft content in current tab |

**Deprecated/outdated (for this project):**
- `supabase.auth.getUser()` on the backend: not applicable — the Supabase client has no user session. JWT verification is done via `jose` + JWKS only.
- Frontend `@supabase/supabase-js` auth methods (`signInWithOAuth`, `signOut`, etc.): not used. The frontend has no Supabase auth client.
- Supabase Third-Party Auth configuration: does NOT apply to this project — Supabase Third-Party Auth only supports specific providers (Clerk, Firebase, Auth0, Cognito, WorkOS), not arbitrary JWKS URLs.

---

## Open Questions

1. **Supabase Third-Party Auth — deferred from CONTEXT.md**
   - What we know: Supabase Third-Party Auth does NOT support a generic JWKS URL. Only Clerk, Firebase Auth, Auth0, AWS Cognito, and WorkOS are supported (confirmed via official docs and `config.toml`).
   - What this means: The existing RLS policies (`auth.uid()`) work because the JWT is issued by our OWN Supabase project's Auth server. The `sub` claim IS the Supabase user UUID. No Third-Party Auth configuration is needed or possible.
   - Recommendation: Close this deferred item. No action needed. Document in PLAN that RLS policies are correct as-is.

2. **Accounts API call latency on every write**
   - What we know: Every write request requires calling `/api/account/me` for revocation check. This adds ~50-150ms latency per write.
   - What's unclear: Whether the accounts team recommends any caching strategy (e.g., cache the account state for 30 seconds per `sub` in Redis).
   - Recommendation: In Phase 2, call `/api/account/me` without caching. If latency is unacceptable in later phases, add Redis caching of account state with a short TTL (30s). Do not add caching complexity in Phase 2.

3. **`mock-jwks` compatibility with `jose` v6**
   - What we know: `mock-jwks` 3.3.5 is the latest version (npm confirmed). It uses MSW internally. It was built targeting jose (the same library).
   - What's unclear: Whether `mock-jwks` 3.3.5 is fully compatible with `jose` 6.2.2 (which is a major version). The GitHub README shows vitest examples but doesn't list jose version compatibility.
   - Recommendation: During implementation, install `mock-jwks` and run a smoke test. If there are compatibility issues, fall back to generating an ES256 keypair directly with `jose`'s `generateKeyPair` and using `createLocalJWKSet` in tests.

4. **Frontend location in project**
   - What we know: The current repo is backend-only (`src/` is Express). The frontend (Framer-based) lives elsewhere per tech stack decisions.
   - What's unclear: Whether the typed fetch wrapper and auth context are built in this repo (as a shared lib) or in the Framer project.
   - Recommendation: The planner should confirm this scope boundary. If the frontend is in a separate repo, Phase 2 backend tasks are sufficient. If there's a frontend package in this monorepo, add frontend tasks. The auth context and apiFetch patterns are documented here regardless.

---

## Sources

### Primary (HIGH confidence)
- Onboarding doc (provided in phase context) — canonical reference for JWT format, JWKS URL, accounts API shape, access state logic, hash extraction pattern
- `https://github.com/panva/jose/blob/main/src/jwks/remote.ts` — confirmed `cacheMaxAge` default 600000ms, `cooldownDuration` default 30000ms, per-instance cache (not module-level singleton)
- `https://github.com/panva/jose/discussions/394` — module-level singleton pattern confirmed by maintainer
- `https://supabase.com/docs/guides/auth/jwt-fields` — confirmed `sub` claim = user UUID, `auth.uid()` derives from JWT `sub`
- `https://supabase.com/docs/guides/auth/third-party/overview` — confirmed only Clerk/Firebase/Auth0/Cognito/WorkOS are supported; no generic JWKS URL
- `supabase/config.toml` (in this repo) — confirmed no `[auth.third_party.custom_jwks]` exists; Third-Party Auth cannot be configured for arbitrary JWKS
- `https://blog.logrocket.com/extend-express-request-object-typescript/` — Express global declaration merging pattern for `Request.user`
- `https://www.npmjs.com/package/mock-jwks` — version 3.3.5; uses MSW internally; vitest compatible
- `https://npm.view jose version` — confirmed latest is 6.2.2

### Secondary (MEDIUM confidence)
- `https://queen.raae.codes/2025-05-01-supabase-exchange/` — token exchange pattern for custom JWT issuers (confirmed Supabase Third-Party Auth limitation)
- `https://github.com/orgs/supabase/discussions/34744` — community confirmation that Supabase only supports named providers for Third-Party Auth
- WebSearch "Express middleware optionalAuth requireAuth TypeScript pattern" — multiple sources agree on declaration merging approach

### Tertiary (LOW confidence)
- WebSearch on React useAuth hook pattern — common pattern but not verified against a canonical source; the pattern in Code Examples is synthesized from multiple credible sources

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — jose version confirmed via npm; mock-jwks confirmed; all existing dependencies verified in package.json
- Architecture: HIGH — all patterns derived from official docs and the project's own onboarding doc (canonical)
- Supabase RLS interaction: HIGH — confirmed that accounts JWT is issued by this Supabase project; `auth.uid()` works; no Third-Party Auth needed
- JWKS caching: HIGH — confirmed defaults from jose source code and maintainer discussion
- Frontend patterns: MEDIUM — React Context/hook pattern is widely established but not from a single canonical source
- Testing approach: MEDIUM — mock-jwks vitest compatibility with jose v6 not explicitly confirmed; may need smoke test

**Research date:** 2026-04-15
**Valid until:** 2026-05-15 (30 days — jose and Supabase are active but fundamentals are stable)
