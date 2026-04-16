import { Router } from 'express';
import type { Request, Response } from 'express';
import { supabase } from '../lib/supabase.js';
import { cacheMiddleware, TTL } from '../middleware/cache.js';
import { parseLimit } from '../lib/utils.js';
import { requireAuth } from '../middleware/auth.js';
import { requireConnected } from '../middleware/tierGuards.js';
import { postRateLimiter } from '../lib/rateLimit.js';
import { cacheDel } from '../lib/redis.js';

export const postsRouter = Router();

// GET /api/threads/:id — thread detail with full body
postsRouter.get('/threads/:id', cacheMiddleware(TTL.THREAD_DETAIL), async (req: Request, res: Response) => {
  const { data, error } = await supabase
    .schema('connect')
    .from('threads')
    .select('id, title, body, author_display_name, reply_count, created_at, last_activity_at, moderation_status')
    .eq('id', req.params.id)
    .single();

  if (error || !data) {
    res.status(404).json({
      error: { code: 'THREAD_NOT_FOUND', message: 'Thread not found' },
    });
    return;
  }

  // Hidden threads return 404 — do not reveal existence
  if (data.moderation_status !== 'visible') {
    res.status(404).json({
      error: { code: 'THREAD_NOT_FOUND', message: 'Thread not found' },
    });
    return;
  }

  res.json({
    data: {
      id: data.id,
      title: data.title,
      body: data.body,  // full markdown, NOT an excerpt
      authorPseudonym: data.author_display_name,
      replyCount: data.reply_count,
      createdAt: data.created_at,
      lastActivityAt: data.last_activity_at,
      // moderation_status intentionally excluded from response
    },
  });
});

// GET /api/threads/:id/posts — flat chronological reply list
postsRouter.get('/threads/:id/posts', cacheMiddleware(TTL.THREAD_DETAIL), async (req: Request, res: Response) => {
  const threadId = req.params.id;
  const limit = parseLimit(req.query.limit as string | undefined, 50);

  // Verify thread exists and is visible
  const { data: thread, error: threadError } = await supabase
    .schema('connect')
    .from('threads')
    .select('id, moderation_status')
    .eq('id', threadId)
    .single();

  if (threadError || !thread || thread.moderation_status !== 'visible') {
    res.status(404).json({
      error: { code: 'THREAD_NOT_FOUND', message: 'Thread not found' },
    });
    return;
  }

  const { data, error } = await supabase
    .schema('connect')
    .from('posts')
    .select('id, author_display_name, body, created_at, updated_at')
    .eq('thread_id', threadId)
    .eq('moderation_status', 'visible')
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) {
    res.status(500).json({
      error: { code: 'POSTS_FETCH_FAILED', message: error.message },
    });
    return;
  }

  const posts = (data ?? []).map(p => ({
    id: p.id,
    authorPseudonym: p.author_display_name,
    body: p.body,
    createdAt: p.created_at,
    updatedAt: p.updated_at,
  }));

  // No cursor/meta for posts — flat list with limit (v1)
  res.json({ data: posts });
});

// POST /api/threads/:id/posts — reply to a thread
// Requires: connected or empowered account with active standing
// Rate limited: shared 5-post/hour bucket per user (same as thread creation)
postsRouter.post(
  '/threads/:id/posts',
  requireAuth,
  requireConnected,
  async (req: Request, res: Response) => {
    const threadId = req.params.id;

    // Verify thread exists and is visible before doing anything else
    const { data: thread, error: threadError } = await supabase
      .schema('connect')
      .from('threads')
      .select('id, moderation_status, reply_count')
      .eq('id', threadId)
      .single();

    if (threadError || !thread || thread.moderation_status !== 'visible') {
      res.status(404).json({
        error: { code: 'THREAD_NOT_FOUND', message: 'Thread not found' },
      });
      return;
    }

    // Validation
    const { body } = req.body as { body?: unknown };
    const errors: Record<string, string> = {};

    const trimmedBody = (typeof body === 'string' ? body : '').trim();
    if (trimmedBody.length < 10 || trimmedBody.length > 5000) {
      errors.body = 'Body must be 10-5,000 characters';
    }

    if (Object.keys(errors).length > 0) {
      res.status(422).json({ errors });
      return;
    }

    // Rate limiting — shared bucket with thread creation
    const { success, reset } = await postRateLimiter.limit(req.user!.id);
    if (!success) {
      // reset is in milliseconds; Retry-After is in seconds
      res.set('Retry-After', String(Math.ceil((reset - Date.now()) / 1000)));
      res.status(429).json({ reason: 'rate_limited' });
      return;
    }

    // Insert post — trg_posts_snapshot_display_name fires BEFORE INSERT
    // and populates author_display_name automatically from connected_profiles
    const { data, error } = await supabase
      .schema('connect')
      .from('posts')
      .insert({
        thread_id: threadId,
        author_id: req.user!.id,
        body: trimmedBody,
      })
      .select('id, body, author_display_name, created_at, updated_at')
      .single();

    if (error || !data) {
      res.status(500).json({
        error: { code: 'POST_CREATE_FAILED', message: error?.message },
      });
      return;
    }

    // Update thread reply_count and last_activity_at (fire-and-forget — not blocking)
    await supabase
      .schema('connect')
      .from('threads')
      .update({
        reply_count: thread.reply_count + 1,
        last_activity_at: new Date().toISOString(),
      })
      .eq('id', threadId);

    // Invalidate thread detail and posts list cache entries
    await cacheDel(
      `fc:/api/threads/${threadId}:${JSON.stringify({})}`,
      `fc:/api/threads/${threadId}/posts:${JSON.stringify({})}`,
    );

    res.status(201).json({
      data: {
        id: data.id,
        body: data.body,
        authorPseudonym: data.author_display_name,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        isEdited: false,
      },
    });
  }
);
