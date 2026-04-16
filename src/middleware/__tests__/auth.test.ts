import { describe, it, expect, beforeAll, vi, afterEach } from 'vitest';
import express from 'express';
import supertest from 'supertest';
import { generateKeyPair, exportJWK, SignJWT, type KeyLike } from 'jose';
import { requireAuth, optionalAuth } from '../auth.js';

// Test keypair setup
let privateKey: KeyLike;
let publicJwk: Awaited<ReturnType<typeof exportJWK>>;
let mockJwks: object;

beforeAll(async () => {
  const { privateKey: priv, publicKey } = await generateKeyPair('ES256');
  privateKey = priv;
  publicJwk = await exportJWK(publicKey);
  // Add kid for JWKS matching
  publicJwk.kid = 'test-key-1';
  mockJwks = { keys: [publicJwk] };
});

// Helper to sign a test JWT
async function signToken(payload: Record<string, unknown> = {}): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'ES256', kid: 'test-key-1' })
    .setIssuer('https://kxsdzaojfaibhuzmclfq.supabase.co/auth/v1')
    .setAudience('authenticated')
    .setSubject('test-user-uuid-123')
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(privateKey);
}

// Mock fetch globally — intercepts JWKS and accounts API calls
function mockFetchWith(accountsResponse: { status: number; body: unknown }) {
  vi.stubGlobal('fetch', async (url: string | URL | Request, _opts?: RequestInit) => {
    const urlStr = String(url instanceof URL ? url.href : url instanceof Request ? url.url : url);
    if (urlStr.includes('.well-known/jwks.json') || urlStr.includes('supabase.co')) {
      // JWKS request — return test public key
      return new Response(JSON.stringify(mockJwks), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (urlStr.includes('account/me')) {
      // Accounts API request
      return new Response(JSON.stringify(accountsResponse.body), {
        status: accountsResponse.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    throw new Error(`Unmocked fetch: ${urlStr}`);
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

// Build a minimal Express app with the given middleware
function makeApp(middleware: typeof requireAuth | typeof optionalAuth) {
  const app = express();
  app.use(express.json());
  app.get('/test', middleware, (req: express.Request, res: express.Response) => {
    res.json({ user: req.user ?? null });
  });
  return app;
}

const mockConnectedUser = {
  id: 'test-user-uuid-123',
  tier: 'connected',
  account_standing: 'active',
  completed_onboarding: true,
  display_name: 'TestUser',
};

describe('requireAuth', () => {
  it('returns 401 with Missing token when no Authorization header', async () => {
    const app = makeApp(requireAuth);
    const res = await supertest(app).get('/test');
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Missing token');
  });

  it('returns 401 with Missing token when Authorization header has no Bearer prefix', async () => {
    const app = makeApp(requireAuth);
    const res = await supertest(app).get('/test').set('Authorization', 'Basic abc123');
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Missing token');
  });

  it('returns 401 with Invalid token for a random string token', async () => {
    mockFetchWith({ status: 200, body: mockConnectedUser });
    const app = makeApp(requireAuth);
    const res = await supertest(app).get('/test').set('Authorization', 'Bearer not-a-real-jwt');
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid token');
  });

  it('returns 401 with Session expired or revoked when accounts API returns 401', async () => {
    mockFetchWith({ status: 401, body: { error: 'Unauthorized' } });
    const token = await signToken();
    const app = makeApp(requireAuth);
    const res = await supertest(app).get('/test').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Session expired or revoked');
  });

  it('populates req.user and calls next for valid JWT + active connected user', async () => {
    mockFetchWith({ status: 200, body: mockConnectedUser });
    const token = await signToken();
    const app = makeApp(requireAuth);
    const res = await supertest(app).get('/test').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.user).toBeTruthy();
    expect(res.body.user.tier).toBe('connected');
    expect(res.body.user.account_standing).toBe('active');
  });

  it('populates req.user for inform tier (requireAuth does not check tier)', async () => {
    const informUser = { ...mockConnectedUser, tier: 'inform' };
    mockFetchWith({ status: 200, body: informUser });
    const token = await signToken();
    const app = makeApp(requireAuth);
    const res = await supertest(app).get('/test').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.user.tier).toBe('inform');
  });
});

describe('optionalAuth', () => {
  it('calls next with req.user undefined when no Authorization header', async () => {
    const app = makeApp(optionalAuth);
    const res = await supertest(app).get('/test');
    expect(res.status).toBe(200);
    expect(res.body.user).toBeNull();
  });

  it('populates req.user when valid JWT + active account', async () => {
    mockFetchWith({ status: 200, body: mockConnectedUser });
    const token = await signToken();
    const app = makeApp(optionalAuth);
    const res = await supertest(app).get('/test').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.user).toBeTruthy();
  });

  it('calls next with req.user undefined when JWT is invalid (swallows error)', async () => {
    mockFetchWith({ status: 200, body: mockConnectedUser });
    const app = makeApp(optionalAuth);
    const res = await supertest(app)
      .get('/test')
      .set('Authorization', 'Bearer invalid-jwt-token');
    expect(res.status).toBe(200);
    expect(res.body.user).toBeNull();
  });
});
