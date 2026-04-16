import { describe, it, expect, afterEach, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app.js';

const app = createApp();

afterEach(() => {
  vi.unstubAllGlobals();
});

/**
 * Mock helper for supabase-js fetch calls.
 *
 * supabase-js (via @supabase/postgrest-js) calls res.text() on the fetch response,
 * then JSON.parses the result. No Redis fetch calls occur in tests — UPSTASH env vars
 * are absent so the in-memory fallback is used. Only Supabase fetch calls need mocking.
 *
 * Success body format:
 *   - List query (.from().select()):  JSON array  e.g. [{...}]
 *   - Single query (.single()):       JSON object e.g. {...}
 *   - RPC call (.rpc()):              JSON array or object depending on function
 *
 * Error body format: JSON error object e.g. { code, message, details, hint }
 *
 * NOTE: The cache middleware uses an in-memory Map (module-level) as fallback when
 * UPSTASH env vars are absent. To prevent cache hits between tests, use unique
 * resource IDs in each test rather than reusing the same path.
 */
function makeResponse(body: unknown, status = 200): Response {
  const bodyText = JSON.stringify(body);
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : status === 406 ? 'Not Acceptable' : 'Error',
    text: async () => bodyText,
    json: async () => body,
    headers: {
      get: (_name: string) => null,
    },
  } as unknown as Response;
}

/**
 * Stub global fetch with one or more sequential responses.
 * Each supabase fetch call (from() or rpc()) consumes one response.
 */
function mockFetch(...responses: Array<{ body: unknown; status?: number }>) {
  const mocked = vi.fn();
  for (const r of responses) {
    mocked.mockResolvedValueOnce(makeResponse(r.body, r.status ?? 200));
  }
  vi.stubGlobal('fetch', mocked);
}

// ---------------------------------------------------------------------------
// GET /api/communities
// ---------------------------------------------------------------------------

describe('GET /api/communities', () => {
  it('returns { data, meta } envelope with camelCase fields', async () => {
    // 1 fetch: list communities query (array)
    mockFetch({
      body: [
        {
          id: 'comm-list-1',
          slug: 'climate',
          name: 'Climate',
          description: 'About climate',
          member_count: 100,
          thread_count: 5,
          topic_id: 't1',
          slice_label: null,
          created_at: '2026-01-01T00:00:00Z',
        },
      ],
    });
    const res = await request(app).get('/api/communities');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('meta');
    expect(res.body.meta).toHaveProperty('cursor');
    expect(res.body.meta).toHaveProperty('hasMore');
    expect(res.body.data[0]).toHaveProperty('memberCount', 100);
    expect(res.body.data[0]).toHaveProperty('sliceLabel', null);
    expect(res.body.data[0]).not.toHaveProperty('member_count');
  });
});

// ---------------------------------------------------------------------------
// GET /api/communities/:id
// ---------------------------------------------------------------------------

describe('GET /api/communities/:id', () => {
  it('returns single community wrapped in { data }', async () => {
    // 1 fetch: single community query (object body — PostgREST .single())
    mockFetch({
      body: {
        id: 'comm-single-1',
        slug: 'climate',
        name: 'Climate',
        description: 'About climate',
        member_count: 100,
        thread_count: 5,
        topic_id: 't1',
        slice_label: null,
        created_at: '2026-01-01T00:00:00Z',
      },
    });
    const res = await request(app).get('/api/communities/comm-single-1');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('id', 'comm-single-1');
    expect(res.body.data).toHaveProperty('memberCount', 100);
  });

  it('returns 404 error envelope when not found', async () => {
    // 1 fetch: single community query returns PGRST116 error (406)
    mockFetch({
      body: {
        code: 'PGRST116',
        message: 'JSON object requested, multiple (or no) rows returned',
        details: 'Results contain 0 rows',
        hint: null,
      },
      status: 406,
    });
    const res = await request(app).get('/api/communities/comm-notfound-1');
    expect(res.status).toBe(404);
    expect(res.body.error).toHaveProperty('code', 'COMMUNITY_NOT_FOUND');
  });
});

// ---------------------------------------------------------------------------
// GET /api/communities/:id/stances
// ---------------------------------------------------------------------------

describe('GET /api/communities/:id/stances', () => {
  it('returns 200 with empty array when no stances exist', async () => {
    // 2 fetches: community check (single object), RPC (array)
    mockFetch(
      { body: { id: 'comm-stances-empty' } },
      { body: [] }
    );
    const res = await request(app).get('/api/communities/comm-stances-empty/stances');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  it('returns stance cards with position, text, supportingPoints', async () => {
    // 2 fetches: community check (single object), RPC result (array)
    mockFetch(
      { body: { id: 'comm-stances-data' } },
      { body: [{ position: 1, text: 'Stance one', supporting_points: ['Point A'] }] }
    );
    const res = await request(app).get('/api/communities/comm-stances-data/stances');
    expect(res.status).toBe(200);
    expect(res.body.data[0]).toEqual({
      position: 1,
      text: 'Stance one',
      supportingPoints: ['Point A'],
    });
  });

  it('returns 404 when community not found', async () => {
    // 1 fetch: community check fails (406 PGRST116)
    mockFetch({
      body: {
        code: 'PGRST116',
        message: 'JSON object requested, multiple (or no) rows returned',
        details: 'Results contain 0 rows',
        hint: null,
      },
      status: 406,
    });
    const res = await request(app).get('/api/communities/comm-stances-notfound/stances');
    expect(res.status).toBe(404);
    expect(res.body.error).toHaveProperty('code', 'COMMUNITY_NOT_FOUND');
  });
});

// ---------------------------------------------------------------------------
// GET /api/communities/:id/threads
// ---------------------------------------------------------------------------

describe('GET /api/communities/:id/threads', () => {
  it('returns thread list with excerpt (no body), authorPseudonym, replyCount', async () => {
    // 1 fetch: threads list query (array)
    mockFetch({
      body: [
        {
          id: 'thread-list-1',
          title: 'Test thread',
          body: '**Bold** content here',
          author_display_name: 'Anon1',
          reply_count: 3,
          created_at: '2026-01-01T00:00:00Z',
          last_activity_at: '2026-01-02T00:00:00Z',
        },
      ],
    });
    const res = await request(app).get('/api/communities/comm-threads-data/threads');
    expect(res.status).toBe(200);
    expect(res.body.data[0]).toHaveProperty('excerpt');
    expect(res.body.data[0]).toHaveProperty('authorPseudonym', 'Anon1');
    expect(res.body.data[0]).toHaveProperty('replyCount', 3);
    expect(res.body.data[0]).not.toHaveProperty('body');
    // Excerpt should be stripped of markdown
    expect(res.body.data[0].excerpt).not.toContain('**');
  });

  it('returns { data, meta } envelope for thread list', async () => {
    // 1 fetch: empty array
    mockFetch({ body: [] });
    const res = await request(app).get('/api/communities/comm-threads-empty/threads');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('meta');
    expect(res.body.meta).toHaveProperty('cursor');
    expect(res.body.meta).toHaveProperty('hasMore');
  });
});

// ---------------------------------------------------------------------------
// GET /api/threads/:id
// ---------------------------------------------------------------------------

describe('GET /api/threads/:id', () => {
  it('returns full thread body (raw markdown, not excerpt)', async () => {
    // 1 fetch: single thread query (object body)
    mockFetch({
      body: {
        id: 'thread-detail-1',
        title: 'Test',
        body: '**Full** content',
        author_display_name: 'Anon1',
        reply_count: 2,
        created_at: '2026-01-01T00:00:00Z',
        last_activity_at: '2026-01-02T00:00:00Z',
        moderation_status: 'visible',
      },
    });
    const res = await request(app).get('/api/threads/thread-detail-1');
    expect(res.status).toBe(200);
    expect(res.body.data.body).toBe('**Full** content');
    expect(res.body.data).toHaveProperty('authorPseudonym', 'Anon1');
    expect(res.body.data).toHaveProperty('replyCount', 2);
    // moderation_status must not be exposed
    expect(res.body.data).not.toHaveProperty('moderationStatus');
    expect(res.body.data).not.toHaveProperty('moderation_status');
  });

  it('returns 404 for hidden thread (does not reveal existence)', async () => {
    // 1 fetch: single thread query — hidden thread (unique ID to avoid cache hit)
    mockFetch({
      body: {
        id: 'thread-hidden-1',
        title: 'Hidden',
        body: 'content',
        author_display_name: 'Anon1',
        reply_count: 0,
        created_at: '2026-01-01T00:00:00Z',
        last_activity_at: '2026-01-01T00:00:00Z',
        moderation_status: 'hidden',
      },
    });
    const res = await request(app).get('/api/threads/thread-hidden-1');
    expect(res.status).toBe(404);
    expect(res.body.error).toHaveProperty('code', 'THREAD_NOT_FOUND');
  });

  it('returns 404 when thread not found', async () => {
    // 1 fetch: single thread query returns PGRST116 error
    mockFetch({
      body: {
        code: 'PGRST116',
        message: 'JSON object requested, multiple (or no) rows returned',
        details: 'Results contain 0 rows',
        hint: null,
      },
      status: 406,
    });
    const res = await request(app).get('/api/threads/thread-notfound-1');
    expect(res.status).toBe(404);
    expect(res.body.error).toHaveProperty('code', 'THREAD_NOT_FOUND');
  });
});

// ---------------------------------------------------------------------------
// GET /api/threads/:id/posts
// ---------------------------------------------------------------------------

describe('GET /api/threads/:id/posts', () => {
  it('returns flat list of posts with authorPseudonym and timestamps', async () => {
    // 2 fetches: thread visibility check (single object), posts list query (array)
    mockFetch(
      { body: { id: 'thread-posts-1', moderation_status: 'visible' } },
      {
        body: [
          {
            id: 'post-1',
            author_display_name: 'Anon1',
            body: 'Reply text',
            created_at: '2026-01-01T00:00:00Z',
            updated_at: '2026-01-01T00:00:00Z',
          },
        ],
      }
    );
    const res = await request(app).get('/api/threads/thread-posts-1/posts');
    expect(res.status).toBe(200);
    expect(res.body.data[0]).toHaveProperty('authorPseudonym', 'Anon1');
    expect(res.body.data[0]).toHaveProperty('body', 'Reply text');
    expect(res.body.data[0]).toHaveProperty('createdAt');
    expect(res.body.data[0]).toHaveProperty('updatedAt');
    // No meta envelope for posts
    expect(res.body).not.toHaveProperty('meta');
  });

  it('returns 404 when thread is hidden', async () => {
    // 1 fetch: thread visibility check — hidden thread (unique ID)
    mockFetch({ body: { id: 'thread-posts-hidden-1', moderation_status: 'hidden' } });
    const res = await request(app).get('/api/threads/thread-posts-hidden-1/posts');
    expect(res.status).toBe(404);
    expect(res.body.error).toHaveProperty('code', 'THREAD_NOT_FOUND');
  });

  it('returns 404 when thread does not exist', async () => {
    // 1 fetch: thread check returns PGRST116 error
    mockFetch({
      body: {
        code: 'PGRST116',
        message: 'JSON object requested, multiple (or no) rows returned',
        details: 'Results contain 0 rows',
        hint: null,
      },
      status: 406,
    });
    const res = await request(app).get('/api/threads/thread-posts-notfound-1/posts');
    expect(res.status).toBe(404);
    expect(res.body.error).toHaveProperty('code', 'THREAD_NOT_FOUND');
  });

  it('returns empty array for thread with no visible posts', async () => {
    // 2 fetches: thread check (visible, unique ID), posts list (empty)
    mockFetch(
      { body: { id: 'thread-posts-novisposts', moderation_status: 'visible' } },
      { body: [] }
    );
    const res = await request(app).get('/api/threads/thread-posts-novisposts/posts');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
    expect(res.body).not.toHaveProperty('meta');
  });
});
