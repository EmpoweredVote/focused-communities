import { Router } from 'express';
import type { Request, Response } from 'express';
import { supabase } from '../lib/supabase.js';
import { cacheMiddleware, TTL } from '../middleware/cache.js';
import { parseLimit } from '../lib/utils.js';

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
