import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

/**
 * Shared rate limiter for thread creation and reply posting.
 * 5 posts per hour per user, sliding window.
 *
 * Editing does NOT use this limiter — only create operations.
 *
 * When Upstash env vars are absent (dev/test), exports a stub that always
 * returns { success: true } so routes behave correctly without credentials.
 */
export const postRateLimiter: Ratelimit = (() => {
  if (
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    return new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(5, '1 h'),
      prefix: 'fc:rl',
    });
  }

  // Dev/test stub — always allows, mirrors Ratelimit.limit() return shape
  return {
    limit: async (_identifier: string) => ({
      success: true,
      limit: 5,
      remaining: 4,
      reset: Date.now() + 3600000,
      pending: Promise.resolve(),
    }),
  } as unknown as Ratelimit;
})();
