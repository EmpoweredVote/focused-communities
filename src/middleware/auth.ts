import { jwtVerify } from 'jose';
import type { Request, Response, NextFunction } from 'express';
import { JWKS } from '../lib/jwks.js';

const SUPABASE_ISSUER = 'https://kxsdzaojfaibhuzmclfq.supabase.co/auth/v1';
const SUPABASE_AUDIENCE = 'authenticated';

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
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: SUPABASE_ISSUER,
      audience: SUPABASE_AUDIENCE,
    });

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
    user.id = payload.sub as string;
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
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: SUPABASE_ISSUER,
      audience: SUPABASE_AUDIENCE,
    });

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
    user.id = payload.sub as string;
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
