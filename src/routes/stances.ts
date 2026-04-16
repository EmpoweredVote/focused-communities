import { Router } from 'express';
import type { Request, Response } from 'express';
import { supabase } from '../lib/supabase.js';
import { cacheMiddleware, TTL } from '../middleware/cache.js';

export const stancesRouter = Router();

stancesRouter.get('/communities/:id/stances', cacheMiddleware(TTL.STANCES), async (req: Request, res: Response) => {
  const communityId = req.params.id;

  // Verify community exists first
  const { data: community, error: communityError } = await supabase
    .schema('connect')
    .from('communities')
    .select('id')
    .eq('id', communityId)
    .single();

  if (communityError || !community) {
    res.status(404).json({
      error: { code: 'COMMUNITY_NOT_FOUND', message: 'Community not found' },
    });
    return;
  }

  // Call RPC function for cross-schema join (function lives in connect schema)
  const { data, error } = await supabase
    .schema('connect')
    .rpc('get_stances_for_community', { p_community_id: communityId });

  if (error) {
    res.status(500).json({
      error: { code: 'STANCES_FETCH_FAILED', message: error.message },
    });
    return;
  }

  const stances = (data ?? []).map((s: { position: number; text: string; supporting_points: string[] }) => ({
    position: s.position,
    text: s.text,
    supportingPoints: s.supporting_points ?? [],
  }));

  res.json({ data: stances });
});
