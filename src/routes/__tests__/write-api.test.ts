import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';
import request from 'supertest';
import { generateKeyPair, exportJWK, SignJWT } from 'jose';
import { createApp } from '../../app.js';

// Mock rate limiter BEFORE app import resolves — vi.mock is hoisted by vitest
const mockLimit = vi.fn();
vi.mock('../../lib/rateLimit.js', () => ({
  postRateLimiter: { limit: (...args: unknown[]) => mockLimit(...args) },
}));

const app = createApp();

let privateKey: CryptoKey;
let publicJwk: Awaited<ReturnType<typeof exportJWK>>;
let mockJwks: object;
let validToken: string;

beforeAll(async () => {
  const { privateKey: priv, publicKey } = await generateKeyPair('ES256');
  privateKey = priv;
  publicJwk = await exportJWK(publicKey);
  publicJwk.kid = 'test-key-1';
  mockJwks = { keys: [publicJwk] };
  validToken = await signToken();
});

async function signToken(sub = 'user-uuid-1'): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: 'ES256', kid: 'test-key-1' })
    .setIssuer('https://kxsdzaojfaibhuzmclfq.supabase.co/auth/v1')
    .setAudience('authenticated')
    .setSubject(sub)
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(privateKey);
}

afterEach(() => {
  vi.unstubAllGlobals();
  mockLimit.mockReset();
});

// supabase-js uses res.text() not res.json()
function makeResponse(body: unknown, status = 200): Response {
  const bodyText = JSON.stringify(body);
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    text: async () => bodyText,
    json: async () => body,
    headers: { get: (_name: string) => null },
  } as unknown as Response;
}

const ACTIVE_USER = {
  id: 'user-uuid-1',
  tier: 'connected',
  account_standing: 'active',
  completed_onboarding: true,
  display_name: 'Alice',
};

const SUSPENDED_USER = {
  ...ACTIVE_USER,
  account_standing: 'suspended',
};

/**
 * URL-routing fetch mock:
 * - supabase.co URLs → return JWKS (for jose key verification)
 * - account/me URLs → return accountResponse
 * - all other URLs → consume next from dbResponses queue (Supabase DB calls)
 */
function mockRoutedFetch(
  accountResponse: { status: number; body: unknown },
  ...dbResponses: Array<{ body: unknown; status?: number }>
) {
  const dbQueue = [...dbResponses];
  vi.stubGlobal('fetch', async (url: string | URL | Request, _opts?: RequestInit) => {
    const urlStr = typeof url === 'string' ? url : url instanceof URL ? url.href : (url as Request).url;
    if (urlStr.includes('supabase.co') && !urlStr.includes('/rest/')) {
      // JWKS fetch (jose lazy-loads from supabase.co/auth/v1/.well-known/jwks.json)
      return new Response(JSON.stringify(mockJwks), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (urlStr.includes('account/me')) {
      return new Response(JSON.stringify(accountResponse.body), {
        status: accountResponse.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    // Supabase postgrest-js DB call — consume from queue
    const next = dbQueue.shift();
    if (!next) throw new Error(`Unexpected DB fetch call to: ${urlStr}`);
    return makeResponse(next.body, next.status ?? 200);
  });
}

/** Simple sequential mock for unauthenticated read endpoints */
function mockFetch(...responses: Array<{ body: unknown; status?: number }>) {
  const mocked = vi.fn();
  for (const r of responses) {
    mocked.mockResolvedValueOnce(makeResponse(r.body, r.status ?? 200));
  }
  vi.stubGlobal('fetch', mocked);
}

const RATE_LIMIT_OK = { success: true, remaining: 4, reset: Date.now() + 3_600_000 };
const RATE_LIMIT_BLOCKED = { success: false, remaining: 0, reset: Date.now() + 3_600_000 };

// ─── TEST GROUP 1: POST /api/communities/:id/threads ──────────────────────────

describe('POST /api/communities/:id/threads', () => {
  it('1a: returns 201 with correct camelCase shape for valid request', async () => {
    mockLimit.mockResolvedValueOnce(RATE_LIMIT_OK);
    mockRoutedFetch(
      { status: 200, body: ACTIVE_USER },
      { body: { id: 'thread-c1', title: 'Valid Title Here', body: 'This is a valid body', author_display_name: 'Alice', reply_count: 0, created_at: '2026-01-01T00:00:00Z', last_activity_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' } }
    );
    const res = await request(app)
      .post('/api/communities/comm-c1/threads')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ title: 'Valid Title Here', body: 'This is a valid body' });
    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      id: 'thread-c1',
      title: 'Valid Title Here',
      authorPseudonym: 'Alice',
      replyCount: 0,
      isEdited: false,
    });
    // No snake_case fields
    expect(res.body.data).not.toHaveProperty('author_display_name');
    expect(res.body.data).not.toHaveProperty('reply_count');
  });

  it('1b: returns 422 with field error when title too short', async () => {
    mockRoutedFetch({ status: 200, body: ACTIVE_USER });
    const res = await request(app)
      .post('/api/communities/comm-c2/threads')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ title: 'Hi', body: 'This is a valid body with enough content' });
    expect(res.status).toBe(422);
    expect(res.body.errors).toHaveProperty('title');
  });

  it('1c: returns 422 when body too short', async () => {
    mockRoutedFetch({ status: 200, body: ACTIVE_USER });
    const res = await request(app)
      .post('/api/communities/comm-c3/threads')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ title: 'Valid Title Here', body: 'Short' });
    expect(res.status).toBe(422);
    expect(res.body.errors).toHaveProperty('body');
  });

  it('1d: returns 401 when no auth token', async () => {
    const res = await request(app)
      .post('/api/communities/comm-c4/threads')
      .send({ title: 'Valid Title Here', body: 'Valid body content here' });
    expect(res.status).toBe(401);
  });

  it('1e: returns 403 when account suspended', async () => {
    mockRoutedFetch({ status: 200, body: SUSPENDED_USER });
    const res = await request(app)
      .post('/api/communities/comm-c5/threads')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ title: 'Valid Title Here', body: 'Valid body content here' });
    expect(res.status).toBe(403);
    expect(res.body.reason).toBe('suspended');
  });

  it('1f: returns 429 with Retry-After when rate limited', async () => {
    mockLimit.mockResolvedValueOnce(RATE_LIMIT_BLOCKED);
    mockRoutedFetch({ status: 200, body: ACTIVE_USER });
    const res = await request(app)
      .post('/api/communities/comm-c6/threads')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ title: 'Valid Title Here', body: 'Valid body content here' });
    expect(res.status).toBe(429);
    expect(res.body.reason).toBe('rate_limited');
    expect(Number(res.headers['retry-after'])).toBeGreaterThan(0);
  });
});

// ─── TEST GROUP 2: POST /api/threads/:id/posts ───────────────────────────────

describe('POST /api/threads/:id/posts', () => {
  it('2a: returns 201 with correct shape for valid reply', async () => {
    mockLimit.mockResolvedValueOnce(RATE_LIMIT_OK);
    mockRoutedFetch(
      { status: 200, body: ACTIVE_USER },
      { body: { id: 'thread-p1', moderation_status: 'visible', reply_count: 2 } },      // thread check
      { body: { id: 'post-p1', body: 'A reply with sufficient length', author_display_name: 'Alice', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' } },  // insert
      { body: {} }  // reply_count update (fire-and-forget)
    );
    const res = await request(app)
      .post('/api/threads/thread-p1/posts')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ body: 'A reply with sufficient length' });
    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      id: 'post-p1',
      authorPseudonym: 'Alice',
      isEdited: false,
    });
  });

  it('2b: returns 422 when body too short', async () => {
    mockRoutedFetch(
      { status: 200, body: ACTIVE_USER },
      { body: { id: 'thread-p2', moderation_status: 'visible', reply_count: 0 } }
    );
    const res = await request(app)
      .post('/api/threads/thread-p2/posts')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ body: 'Short' });
    expect(res.status).toBe(422);
    expect(res.body.errors).toHaveProperty('body');
  });

  it('2c: returns 404 when thread not found', async () => {
    mockRoutedFetch(
      { status: 200, body: ACTIVE_USER },
      { body: { code: 'PGRST116', message: 'no rows', details: '', hint: null }, status: 406 }
    );
    const res = await request(app)
      .post('/api/threads/nonexistent-thread/posts')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ body: 'A valid body with enough content' });
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('THREAD_NOT_FOUND');
  });

  it('2d: returns 401 when unauthenticated', async () => {
    const res = await request(app)
      .post('/api/threads/thread-p4/posts')
      .send({ body: 'A valid body with enough content' });
    expect(res.status).toBe(401);
  });

  it('2e: returns 429 when rate limited', async () => {
    mockLimit.mockResolvedValueOnce(RATE_LIMIT_BLOCKED);
    mockRoutedFetch(
      { status: 200, body: ACTIVE_USER },
      { body: { id: 'thread-p5', moderation_status: 'visible', reply_count: 0 } }
    );
    const res = await request(app)
      .post('/api/threads/thread-p5/posts')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ body: 'A valid body with enough content' });
    expect(res.status).toBe(429);
  });
});

// ─── TEST GROUP 3: PATCH /api/threads/:id ────────────────────────────────────

describe('PATCH /api/threads/:id', () => {
  it('3a: returns 200 with updated title and isEdited true', async () => {
    mockRoutedFetch(
      { status: 200, body: ACTIVE_USER },
      { body: { id: 'thread-e1', author_id: 'user-uuid-1', moderation_status: 'visible', title: 'Old Title', body: 'Original body' } },  // ownership fetch
      { body: { id: 'thread-e1', title: 'New Title Here', body: 'Original body', author_display_name: 'Alice', reply_count: 0, created_at: '2026-01-01T00:00:00Z', last_activity_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-02T00:00:00Z' } }  // update
    );
    const res = await request(app)
      .patch('/api/threads/thread-e1')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ title: 'New Title Here' });
    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe('New Title Here');
    expect(res.body.data.isEdited).toBe(true); // updated_at !== created_at
  });

  it('3b: returns 422 when no fields provided', async () => {
    mockRoutedFetch({ status: 200, body: ACTIVE_USER });
    const res = await request(app)
      .patch('/api/threads/thread-e2')
      .set('Authorization', `Bearer ${validToken}`)
      .send({});
    expect(res.status).toBe(422);
    expect(res.body.errors._).toMatch(/at least one/i);
  });

  it('3c: returns 404 when thread not found', async () => {
    mockRoutedFetch(
      { status: 200, body: ACTIVE_USER },
      { body: { code: 'PGRST116', message: 'no rows', details: '', hint: null }, status: 406 }
    );
    const res = await request(app)
      .patch('/api/threads/nonexistent-thread')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ title: 'New Valid Title' });
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('THREAD_NOT_FOUND');
  });

  it('3d: returns 404 when non-author attempts edit', async () => {
    const otherToken = await signToken('user-uuid-2');
    mockRoutedFetch(
      { status: 200, body: { ...ACTIVE_USER, id: 'user-uuid-2' } },
      { body: { id: 'thread-e4', author_id: 'user-uuid-1', moderation_status: 'visible', title: 'Title', body: 'Body' } }
    );
    const res = await request(app)
      .patch('/api/threads/thread-e4')
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ title: 'New Valid Title' });
    expect(res.status).toBe(404);
  });

  it('3e: returns 401 when unauthenticated', async () => {
    const res = await request(app)
      .patch('/api/threads/thread-e5')
      .send({ title: 'New Valid Title' });
    expect(res.status).toBe(401);
  });
});

// ─── TEST GROUP 4: PATCH /api/posts/:id ──────────────────────────────────────

describe('PATCH /api/posts/:id', () => {
  it('4a: returns 200 with updated body and isEdited true', async () => {
    mockRoutedFetch(
      { status: 200, body: ACTIVE_USER },
      { body: { id: 'post-e1', author_id: 'user-uuid-1', thread_id: 'thread-for-post', moderation_status: 'visible', body: 'Old body' } },
      { body: { id: 'post-e1', body: 'Updated body with enough characters', author_display_name: 'Alice', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-02T00:00:00Z' } }
    );
    const res = await request(app)
      .patch('/api/posts/post-e1')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ body: 'Updated body with enough characters' });
    expect(res.status).toBe(200);
    expect(res.body.data.body).toBe('Updated body with enough characters');
    expect(res.body.data.isEdited).toBe(true);
  });

  it('4b: returns 422 when body too short', async () => {
    mockRoutedFetch({ status: 200, body: ACTIVE_USER });
    const res = await request(app)
      .patch('/api/posts/post-e2')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ body: 'Short' });
    expect(res.status).toBe(422);
    expect(res.body.errors).toHaveProperty('body');
  });

  it('4c: returns 404 when post not found or non-author', async () => {
    mockRoutedFetch(
      { status: 200, body: ACTIVE_USER },
      { body: { code: 'PGRST116', message: 'no rows', details: '', hint: null }, status: 406 }
    );
    const res = await request(app)
      .patch('/api/posts/nonexistent-post')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ body: 'Updated body with enough characters' });
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('POST_NOT_FOUND');
  });

  it('4d: returns 401 when unauthenticated', async () => {
    const res = await request(app)
      .patch('/api/posts/post-e4')
      .send({ body: 'Updated body with enough characters' });
    expect(res.status).toBe(401);
  });
});

// ─── TEST GROUP 5: DELETE /api/threads/:id ───────────────────────────────────

describe('DELETE /api/threads/:id', () => {
  it('5a: returns 405 Method Not Allowed', async () => {
    const res = await request(app).delete('/api/threads/any-thread');
    expect(res.status).toBe(405);
    expect(res.body.error.code).toBe('DELETE_NOT_ALLOWED');
  });
});

// ─── TEST GROUP 6: DELETE /api/posts/:id ─────────────────────────────────────

describe('DELETE /api/posts/:id', () => {
  it('6a: returns 405 Method Not Allowed', async () => {
    const res = await request(app).delete('/api/posts/any-post');
    expect(res.status).toBe(405);
    expect(res.body.error.code).toBe('DELETE_NOT_ALLOWED');
  });
});

// ─── TEST GROUP 7: GET /api/threads/:id/edits ────────────────────────────────

describe('GET /api/threads/:id/edits', () => {
  it('7a: returns 200 with empty array when no edits', async () => {
    mockFetch(
      { body: { id: 'thread-hist-1', moderation_status: 'visible' } },
      { body: [] }
    );
    const res = await request(app).get('/api/threads/thread-hist-1/edits');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  it('7b: returns 200 with camelCase edit objects', async () => {
    mockFetch(
      { body: { id: 'thread-hist-2', moderation_status: 'visible' } },
      { body: [{ id: 'edit-1', old_title: 'Original Title', old_body: 'Old body text', edited_at: '2026-01-02T00:00:00Z' }] }
    );
    const res = await request(app).get('/api/threads/thread-hist-2/edits');
    expect(res.status).toBe(200);
    expect(res.body.data[0]).toMatchObject({ id: 'edit-1', oldTitle: 'Original Title', oldBody: 'Old body text', editedAt: '2026-01-02T00:00:00Z' });
    expect(res.body.data[0]).not.toHaveProperty('old_title');
  });

  it('7c: returns 404 when thread not found', async () => {
    mockFetch({ body: { code: 'PGRST116', message: 'no rows', details: '', hint: null }, status: 406 });
    const res = await request(app).get('/api/threads/nonexistent/edits');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('THREAD_NOT_FOUND');
  });
});

// ─── TEST GROUP 8: GET /api/posts/:id/edits ──────────────────────────────────

describe('GET /api/posts/:id/edits', () => {
  it('8a: returns 200 with empty array', async () => {
    mockFetch(
      { body: { id: 'post-hist-1', moderation_status: 'visible' } },
      { body: [] }
    );
    const res = await request(app).get('/api/posts/post-hist-1/edits');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  it('8b: returns 404 when post not found', async () => {
    mockFetch({ body: { code: 'PGRST116', message: 'no rows', details: '', hint: null }, status: 406 });
    const res = await request(app).get('/api/posts/nonexistent/edits');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('POST_NOT_FOUND');
  });
});

// ─── TEST GROUP 9: GET /api/threads/:id (isEdited) ───────────────────────────

describe('GET /api/threads/:id (isEdited indicator)', () => {
  it('9a: isEdited is false when updatedAt equals createdAt', async () => {
    mockFetch({ body: { id: 'thread-ise-1', title: 'T', body: 'B', author_display_name: 'A', reply_count: 0, created_at: '2026-01-01T00:00:00Z', last_activity_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z', moderation_status: 'visible' } });
    const res = await request(app).get('/api/threads/thread-ise-1');
    expect(res.status).toBe(200);
    expect(res.body.data.isEdited).toBe(false);
    expect(res.body.data).toHaveProperty('updatedAt');
  });

  it('9b: isEdited is true when updatedAt differs from createdAt', async () => {
    mockFetch({ body: { id: 'thread-ise-2', title: 'T', body: 'B', author_display_name: 'A', reply_count: 0, created_at: '2026-01-01T00:00:00Z', last_activity_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-02T00:00:00Z', moderation_status: 'visible' } });
    const res = await request(app).get('/api/threads/thread-ise-2');
    expect(res.status).toBe(200);
    expect(res.body.data.isEdited).toBe(true);
  });
});

// ─── TEST GROUP 10: GET /api/threads/:id/posts (isEdited) ────────────────────

describe('GET /api/threads/:id/posts (isEdited on posts)', () => {
  it('10a: isEdited field present on each post item', async () => {
    mockFetch(
      { body: { id: 'thread-pie-1', moderation_status: 'visible' } },
      { body: [{ id: 'post-ie-1', author_display_name: 'A', body: 'text', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' }] }
    );
    const res = await request(app).get('/api/threads/thread-pie-1/posts');
    expect(res.status).toBe(200);
    expect(res.body.data[0]).toHaveProperty('isEdited');
    expect(res.body.data[0].isEdited).toBe(false);
  });
});
