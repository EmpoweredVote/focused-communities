import { Router } from 'express';
import type { Request, Response } from 'express';
import { supabase } from '../lib/supabase.js';
import { cacheMiddleware, TTL } from '../middleware/cache.js';
import { encodeCursor, decodeCursor, parseLimit } from '../lib/utils.js';

export const communitiesRouter = Router();

communitiesRouter.get('/communities', cacheMiddleware(TTL.COMMUNITIES), async (req: Request, res: Response) => {
  const q = req.query.q as string | undefined;
  const sort = (req.query.sort as string) === 'popular' ? 'popular' : 'newest';
  const limit = parseLimit(req.query.limit as string | undefined, 20);
  const cursor = req.query.cursor as string | undefined;

  let query = supabase
    .schema('connect')
    .from('communities')
    .select('id, slug, name, description, member_count, thread_count, topic_id, slice_label, created_at');

  if (q) {
    query = query.or(`name.ilike.%${q}%,description.ilike.%${q}%`);
  }

  const sortColumn = sort === 'popular' ? 'member_count' : 'created_at';
  query = query.order(sortColumn, { ascending: false });
  query = query.order('id', { ascending: false });

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
    res.status(500).json({ error: { code: 'COMMUNITIES_FETCH_FAILED', message: error.message } });
    return;
  }

  const hasMore = (data?.length ?? 0) > limit;
  const items = (data ?? []).slice(0, limit).map(c => ({
    id: c.id,
    slug: c.slug,
    name: c.name,
    description: c.description,
    memberCount: c.member_count,
    threadCount: c.thread_count,
    topicId: c.topic_id,
    sliceLabel: c.slice_label,
    createdAt: c.created_at,
  }));

  const nextCursor = hasMore && items.length > 0
    ? encodeCursor(
        String(items[items.length - 1][sort === 'popular' ? 'memberCount' : 'createdAt']),
        items[items.length - 1].id
      )
    : null;

  res.json({
    data: items,
    meta: { cursor: nextCursor, hasMore },
  });
});

communitiesRouter.get('/communities/:id', cacheMiddleware(TTL.COMMUNITIES), async (req: Request, res: Response) => {
  const { data, error } = await supabase
    .schema('connect')
    .from('communities')
    .select('id, slug, name, description, member_count, thread_count, topic_id, slice_label, created_at')
    .eq('id', req.params.id)
    .single();

  if (error || !data) {
    res.status(404).json({ error: { code: 'COMMUNITY_NOT_FOUND', message: 'Community not found' } });
    return;
  }

  res.json({
    data: {
      id: data.id,
      slug: data.slug,
      name: data.name,
      description: data.description,
      memberCount: data.member_count,
      threadCount: data.thread_count,
      topicId: data.topic_id,
      sliceLabel: data.slice_label,
      createdAt: data.created_at,
    },
  });
});
