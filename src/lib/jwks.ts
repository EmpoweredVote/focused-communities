import { createRemoteJWKSet } from 'jose';

/**
 * Module-level JWKS singleton for ES256 JWT verification.
 * Created once per process and shared across all requests.
 * URL is configurable via JWKS_URL env var to enable test overrides.
 */
export const JWKS = createRemoteJWKSet(
  new URL(
    process.env.JWKS_URL ??
      'https://kxsdzaojfaibhuzmclfq.supabase.co/auth/v1/.well-known/jwks.json'
  ),
  {
    cacheMaxAge: 10 * 60 * 1000, // 10 minutes
    cooldownDuration: 30 * 1000, // 30 seconds
  }
);

// WorkOS AuthKit — second accepted issuer during the Supabase → WorkOS
// migration (ev-accounts decision 0002). WORKOS_CLIENT_ID absent = old
// behavior, Supabase-only. WORKOS_ISSUER / WORKOS_JWKS_URL overrides exist
// for custom auth domains and test stubs.
const WORKOS_CLIENT_ID = process.env.WORKOS_CLIENT_ID;

export const WORKOS_ISSUER =
  process.env.WORKOS_ISSUER ??
  (WORKOS_CLIENT_ID ? `https://api.workos.com/user_management/${WORKOS_CLIENT_ID}` : null);

const WORKOS_JWKS_URL =
  process.env.WORKOS_JWKS_URL ??
  (WORKOS_CLIENT_ID ? `https://api.workos.com/sso/jwks/${WORKOS_CLIENT_ID}` : null);

export const WORKOS_JWKS = WORKOS_JWKS_URL
  ? createRemoteJWKSet(new URL(WORKOS_JWKS_URL), {
      cacheMaxAge: 10 * 60 * 1000, // 10 minutes
      cooldownDuration: 30 * 1000, // 30 seconds
    })
  : null;
