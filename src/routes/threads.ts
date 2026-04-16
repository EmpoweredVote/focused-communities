import { Router } from 'express';
import type { Request, Response } from 'express';
import { supabase } from '../lib/supabase.js';
import { cacheMiddleware, TTL } from '../middleware/cache.js';
import { encodeCursor, decodeCursor, parseLimit, generateExcerpt } from '../lib/utils.js';
import { requireAuth } from '../middleware/auth.js';
import { requireConnected } from '../middleware/tierGuards.js';
import { postRateLimiter } from '../lib/rateLimit.js';
import { cacheDel } from '../lib/redis.js';

export const threadsRouter = Router();

threadsRouter.get('/communities/:id/threads', cacheMiddleware(TTL.THREAD_LIST), async (req: Request, res: Response) => {
  const communityId = req.params.id;
  // 'active' is the default sort; only 'newest' overrides it.
  // Unknown values silently fall back to 'active' — standard REST behavior for optional sort params.
  const sort = (req.query.sort as string) === 'newest' ? 'newest' : 'active';
  const limit = parseLimit(req.query.limit as string | undefined, 20);
  const cursor = req.query.cursor as string | undefined;

  const sortColumn = sort === 'newest' ? 'created_at' : 'last_activity_at';

  let query = supabase
    .schema('connect')
    .from('threads')
    .select('id, title, body, author_display_name, reply_count, created_at, last_activity_at')
    .eq('community_id', communityId)
    .eq('moderation_status', 'visible')
    .order(sortColumn, { ascending: false })
    .order('id', { ascending: false });

  if (cursor) {
    const decoded = decodeCursor(cursor);
    if (decoded) {
      query = query.or(
        `${sortColumn}.lt.${decoded.t},and(${sortColumn}.eq.${decoded.t},id.lt.${decoded.id})`
      );
    }
  }

  query = query.limit(limit + 1);

  const { data, error } = await query;

  if (error) {
    res.status(500).json({
      error: { code: 'THREADS_FETCH_FAILED', message: error.message },
    });
    return;
  }

  const hasMore = (data?.length ?? 0) > limit;
  const items = (data ?? []).slice(0, limit).map(t => ({
    id: t.id,
    title: t.title,
    excerpt: generateExcerpt(t.body),
    authorPseudonym: t.author_display_name,
    replyCount: t.reply_count,
    createdAt: t.created_at,
    lastActivityAt: t.last_activity_at,
  }));

  const nextCursor = hasMore && items.length > 0
    ? encodeCursor(
        items[items.length - 1][sort === 'newest' ? 'createdAt' : 'lastActivityAt'],
        items[items.length - 1].id
      )
    : null;

  res.json({
    data: items,
    meta: { cursor: nextCursor, hasMore },
  });
});

// POST /api/communities/:id/threads — create a new thread
// Requires: connected or empowered account with active standing
// Rate limited: shared 5-post/hour bucket per user
// PATCH /api/threads/:id — edit thread title and/or body (ownership-checked, no rate limit)
threadsRouter.patch('/threads/:id', requireAuth, requireConnected, async (req: Request, res: Response) => {
  const { title, body } = req.body as { title?: unknown; body?: unknown };

  // At least one field must be provided
  if (title === undefined && body === undefined) {
    res.status(422).json({ errors: { _: 'At least one of title or body is required' } });
    return;
  }

  const errors: Record<string, string> = {};
  let trimmedTitle = '';
  let trimmedBody = '';

  if (title !== undefined) {
    trimmedTitle = (typeof title === 'string' ? title : '').trim();
    if (trimmedTitle.length < 5 || trimmedTitle.length > 150) {
      errors.title = 'Title must be 5-150 characters';
    }
  }

  if (body !== undefined) {
    trimmedBody = (typeof body === 'string' ? body : '').trim();
    if (trimmedBody.length < 10 || trimmedBody.length > 5000) {
      errors.body = 'Body must be 10-5,000 characters';
    }
  }

  if (Object.keys(errors).length > 0) {
    res.status(422).json({ errors });
    return;
  }

  // Ownership check — service role bypasses RLS, so we check manually
  // Return 404 (not 403) for non-author — hides existence of content
  const { data: existing, error: fetchError } = await supabase
    .schema('connect')
    .from('threads')
    .select('id, author_id, moderation_status, title, body')
    .eq('id', req.params.id)
    .single();

  if (fetchError || !existing || existing.author_id !== req.user!.id || existing.moderation_status !== 'visible') {
    res.status(404).json({ error: { code: 'THREAD_NOT_FOUND', message: 'Thread not found' } });
    return;
  }

  // Build partial update — only include fields that were provided
  const updates: Record<string, string> = {};
  if (title !== undefined) updates.title = trimmedTitle;
  if (body !== undefined) updates.body = trimmedBody;
  updates.updated_at = new Date().toISOString();

  // DB trigger trg_log_thread_edit fires AFTER UPDATE when title or body actually changed
  const { data, error } = await supabase
    .schema('connect')
    .from('threads')
    .update(updates)
    .eq('id', req.params.id)
    .select('id, title, body, author_display_name, reply_count, created_at, last_activity_at, updated_at')
    .single();

  if (error || !data) {
    res.status(500).json({ error: { code: 'THREAD_UPDATE_FAILED', message: error?.message } });
    return;
  }

  // Invalidate thread detail cache
  await cacheDel(`fc:/api/threads/${req.params.id}:${JSON.stringify({})}`);

  res.status(200).json({
    data: {
      id: data.id,
      title: data.title,
      body: data.body,
      authorPseudonym: data.author_display_name,
      replyCount: data.reply_count,
      createdAt: data.created_at,
      lastActivityAt: data.last_activity_at,
      updatedAt: data.updated_at,
      isEdited: data.updated_at !== data.created_at,
    },
  });
});

// DELETE /api/threads/:id — not allowed (Memory over Moderation principle)
threadsRouter.delete('/threads/:id', (_req, res) => {
  res.setHeader('Allow', 'GET, PATCH');
  res.status(405).json({ error: { code: 'DELETE_NOT_ALLOWED', message: 'Threads cannot be deleted' } });
});

// POST /api/communities/:id/threads — create a new thread
// Requires: connected or empowered account with active standing
// Rate limited: shared 5-post/hour bucket per user
threadsRouter.post(
  '/communities/:id/threads',
  requireAuth,
  requireConnected,
  async (req: Request, res: Response) => {
    const { title, body } = req.body as { title?: unknown; body?: unknown };
    const errors: Record<string, string> = {};

    const trimmedTitle = (typeof title === 'string' ? title : '').trim();
    if (trimmedTitle.length < 5 || trimmedTitle.length > 150) {
      errors.title = 'Title must be 5-150 characters';
    }

    const trimmedBody = (typeof body === 'string' ? body : '').trim();
    if (trimmedBody.length < 10 || trimmedBody.length > 5000) {
      errors.body = 'Body must be 10-5,000 characters';
    }

    if (Object.keys(errors).length > 0) {
      res.status(422).json({ errors });
      return;
    }

    // Rate limiting — shared bucket with reply posting
    const { success, reset } = await postRateLimiter.limit(req.user!.id);
    if (!success) {
      // reset is in milliseconds; Retry-After is in seconds
      res.set('Retry-After', String(Math.ceil((reset - Date.now()) / 1000)));
      res.status(429).json({ reason: 'rate_limited' });
      return;
    }

    // Insert thread — trg_threads_snapshot_display_name fires BEFORE INSERT
    // and populates author_display_name automatically from connected_profiles
    const { data, error } = await supabase
      .schema('connect')
      .from('threads')
      .insert({
        community_id: req.params.id,
        author_id: req.user!.id,
        title: trimmedTitle,
        body: trimmedBody,
      })
      .select('id, title, body, author_display_name, reply_count, created_at, last_activity_at, updated_at')
      .single();

    if (error || !data) {
      res.status(500).json({
        error: { code: 'THREAD_CREATE_FAILED', message: error?.message },
      });
      return;
    }

    // Invalidate thread list cache for this community (default query params)
    await cacheDel(`fc:/api/communities/${req.params.id}/threads:${JSON.stringify({})}`);

    res.status(201).json({
      data: {
        id: data.id,
        title: data.title,
        body: data.body,
        authorPseudonym: data.author_display_name,
        replyCount: data.reply_count,
        createdAt: data.created_at,
        lastActivityAt: data.last_activity_at,
        updatedAt: data.updated_at,
        isEdited: false,
      },
    });
  }
);
