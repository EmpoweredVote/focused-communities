import { jwtVerify, decodeJwt, type JWTPayload } from 'jose';
import type { Request, Response, NextFunction } from 'express';
import { JWKS, WORKOS_JWKS, WORKOS_ISSUER } from '../lib/jwks.js';

const SUPABASE_ISSUER = 'https://kxsdzaojfaibhuzmclfq.supabase.co/auth/v1';
const SUPABASE_AUDIENCE = 'authenticated';

/**
 * Verify a Bearer token from either issuer and resolve the internal user id
 * (Supabase -> WorkOS migration, ev-accounts decision 0002). A WorkOS token
 * carries the internal id in its external_id claim, set at import/provision
 * time — the WorkOS sub (user_01…) is never the user id. WorkOS tokens have
 * no aud claim; the dashboard JWT template's role=authenticated stands in
 * for it. Without WORKOS_CLIENT_ID the WorkOS branch is disabled and this is
 * exactly the old Supabase-only verification. Throws on anything invalid.
 */
async function verifyAccessToken(
  token: string
): Promise<{ payload: JWTPayload; userId: string }> {
  const iss = decodeJwt(token).iss;
  let payload: JWTPayload;
  let userId: unknown;
  if (iss === SUPABASE_ISSUER) {
    ({ payload } = await jwtVerify(token, JWKS, {
      issuer: SUPABASE_ISSUER,
      audience: SUPABASE_AUDIENCE,
    }));
    userId = payload.sub;
  } else if (WORKOS_JWKS !== null && iss === WORKOS_ISSUER) {
    ({ payload } = await jwtVerify(token, WORKOS_JWKS, { issuer: WORKOS_ISSUER }));
    if (payload.role !== 'authenticated') {
      throw new Error('WorkOS token missing role=authenticated (JWT template not applied)');
    }
    userId = payload.external_id; // unlinked accounts don't resolve
  } else {
    throw new Error('Unknown token issuer');
  }
  if (typeof userId !== 'string' || userId === '') {
    throw new Error('Token does not resolve to a user id');
  }
  return { payload, userId };
}

function getAccountsApiUrl(): string {
  return process.env.ACCOUNTS_API_URL ?? 'https://accounts.empowered.vote';
}

export interface AccountUser {
  id: string;
  tier: 'inform' | 'connected' | 'empowered';
  account_standing: 'active' | 'suspended';
  completed_onboarding: boolean;
  display_name: string;
}

/**
 * Verify a Bearer token and return the AccountUser, or null if invalid.
 * Used internally by requireAuth and optionalAuth.
 */
async function verifyToken(token: string): Promise<AccountUser | null> {
  try {
    const { userId } = await verifyAccessToken(token);

    const accountRes = await fetch(
      `${getAccountsApiUrl()}/api/account/me`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (accountRes.status === 401) {
      return null;
    }

    const user = (await accountRes.json()) as AccountUser;
    user.id = userId;
    return user;
  } catch {
    return null;
  }
}

/**
 * Middleware that requires a valid JWT + active accounts API session.
 * Returns 401 with a specific error message for each failure mode.
 */
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
    const { userId } = await verifyAccessToken(token);

    const accountRes = await fetch(
      `${getAccountsApiUrl()}/api/account/me`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (accountRes.status === 401) {
      res.status(401).json({ error: 'Session expired or revoked' });
      return;
    }

    const user = (await accountRes.json()) as AccountUser;
    user.id = userId;
    res.setHeader('Cache-Control', 'private, no-store');
    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

/**
 * Middleware that attempts JWT + accounts API verification but never sends
 * an error response. If verification fails for any reason, silently continues
 * with req.user undefined.
 */
export async function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    next();
    return;
  }

  const token = authHeader.slice(7);
  const user = await verifyToken(token);

  if (user) {
    req.user = user;
  }

  next();
}
