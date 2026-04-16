import { Router } from 'express';
import type { Request, Response } from 'express';
import { supabase } from '../lib/supabase.js';
import { cacheMiddleware, TTL } from '../middleware/cache.js';
import { encodeCursor, decodeCursor, parseLimit, generateExcerpt } from '../lib/utils.js';

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
