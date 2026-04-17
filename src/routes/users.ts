import { Router } from 'express';
import type { Request, Response } from 'express';
import { supabase } from '../lib/supabase.js';
import { encodeCursor, decodeCursor, parseLimit, generateExcerpt } from '../lib/utils.js';
import { requireAuth } from '../middleware/auth.js';

export const usersRouter = Router();

// GET /api/users/:id/posts — cursor-paginated post history for the authenticated user
// Self-only gate: :id must match the authenticated user's ID (returns 403 for mismatch)
// No cacheMiddleware — auth-gated user-specific data must never be cached
usersRouter.get('/users/:id/posts', requireAuth, async (req: Request, res: Response) => {
  // Self-only gate: user can only retrieve their own post history
  if (req.params.id !== req.user!.id) {
    res.status(403).json({
      error: { code: 'FORBIDDEN', message: 'You can only view your own post history' },
    });
    return;
  }

  const limit = parseLimit(req.query.limit as string | undefined, 20);
  const cursor = req.query.cursor as string | undefined;

  let query = supabase
    .schema('connect')
    .from('posts')
    .select(`
      id, body, author_display_name, created_at, updated_at,
      thread:threads!inner(
        id, title, community_id,
        community:communities!inner(id, name, slug)
      )
    `)
    .eq('author_id', req.user!.id)
    .eq('moderation_status', 'visible')
    .order('created_at', { ascending: false })
    .order('id', { ascending: false });

  if (cursor) {
    const decoded = decodeCursor(cursor);
    if (decoded) {
      query = query.or(
        `created_at.lt.${decoded.t},and(created_at.eq.${decoded.t},id.lt.${decoded.id})`
      );
    }
  }

  query = query.limit(limit + 1);

  const { data, error } = await query;

  if (error) {
    res.status(500).json({
      error: { code: 'POST_HISTORY_FETCH_FAILED', message: error.message },
    });
    return;
  }

  const hasMore = (data?.length ?? 0) > limit;
  const items = (data ?? []).slice(0, limit).map(p => ({
    postId: p.id,
    threadId: (p.thread as any).id,
    threadTitle: (p.thread as any).title,
    communityId: (p.thread as any).community_id,
    communityName: (p.thread as any).community.name,
    communitySlug: (p.thread as any).community.slug,
    postExcerpt: generateExcerpt(p.body, 200),
    createdAt: p.created_at,
    isEdited: p.updated_at !== p.created_at,
    authorPseudonym: p.author_display_name,
  }));

  const nextCursor = hasMore && items.length > 0
    ? encodeCursor(items[items.length - 1].createdAt, items[items.length - 1].postId)
    : null;

  res.json({ data: items, meta: { cursor: nextCursor, hasMore } });
});
