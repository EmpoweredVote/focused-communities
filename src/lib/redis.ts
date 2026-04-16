import { Redis } from '@upstash/redis';

// In-memory fallback store
const memoryStore = new Map<string, { value: unknown; expiresAt: number }>();

// Attempt to initialize Redis from environment variables
let redisClient: Redis | null = null;

try {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redisClient = Redis.fromEnv();
  } else {
    console.warn('[redis] UPSTASH env vars not set — using in-memory fallback cache');
  }
} catch (err) {
  console.warn('[redis] Failed to initialize Redis client — using in-memory fallback cache:', err);
  redisClient = null;
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  // Try Redis first
  if (redisClient) {
    try {
      const value = await redisClient.get<T>(key);
      return value;
    } catch (err) {
      console.warn(`[redis] cacheGet error for key "${key}" — falling back to memory:`, err);
    }
  }

  // In-memory fallback
  const entry = memoryStore.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    memoryStore.delete(key);
    return null;
  }
  return entry.value as T;
}

export async function cacheSet(
  key: string,
  value: unknown,
  ttlSeconds: number
): Promise<void> {
  // Try Redis first
  if (redisClient) {
    try {
      await redisClient.set(key, value, { ex: ttlSeconds });
      return;
    } catch (err) {
      console.warn(`[redis] cacheSet error for key "${key}" — falling back to memory:`, err);
    }
  }

  // In-memory fallback
  memoryStore.set(key, {
    value,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
}

export async function cacheDel(...keys: string[]): Promise<void> {
  // Try Redis first (best-effort — warn on error but always clear memory)
  if (redisClient) {
    try {
      await redisClient.del(...keys);
    } catch (err) {
      console.warn(`[redis] cacheDel error for keys "${keys.join(', ')}" — clearing memory only:`, err);
    }
  }

  // Always clear from in-memory store
  for (const key of keys) {
    memoryStore.delete(key);
  }
}
