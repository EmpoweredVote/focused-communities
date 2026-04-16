import { cacheGet, cacheSet } from '../lib/redis.js';
import type { Request, Response, NextFunction } from 'express';

export const TTL = {
  COMMUNITIES: 5 * 60,    // 5 minutes
  STANCES: 30 * 60,       // 30 minutes
  THREAD_LIST: 30,        // 30 seconds
  THREAD_DETAIL: 30,      // 30 seconds
} as const;

export function cacheMiddleware(ttlSeconds: number) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const key = `fc:${req.path}:${JSON.stringify(req.query)}`;
    const cached = await cacheGet<unknown>(key);
    if (cached !== null) {
      res.json(cached);
      return;
    }
    const originalJson = res.json.bind(res);
    res.json = ((body: unknown) => {
      if (!res.headersSent && res.statusCode >= 200 && res.statusCode < 300) {
        cacheSet(key, body, ttlSeconds).catch(() => {});
      }
      return originalJson(body);
    }) as Response['json'];
    next();
  };
}
