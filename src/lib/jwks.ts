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
