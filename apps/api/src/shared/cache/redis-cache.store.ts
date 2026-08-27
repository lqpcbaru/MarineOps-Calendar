import type { CacheEntry } from './cache-entry';
import type { CacheStorePort } from './cache-store.port';

/**
 * NOT YET IMPLEMENTED — this does not talk to Redis. `_redisUrl` is
 * accepted but unused; storage is a plain in-memory Map, identical in
 * behaviour to InMemoryCacheStore. No redis/ioredis client dependency
 * exists in package.json. Every cache-consuming module currently
 * hardcodes InMemoryCacheStore directly (none reference this class), so
 * REDIS_ENABLED/REDIS_URL have no effect anywhere in the app today.
 * Do not wire this in as if it provides real shared/distributed caching
 * — in a horizontally-scaled deployment each replica would still cache
 * independently. Needs a real client (e.g. ioredis) before use.
 */
export class RedisCacheStore<T = unknown> implements CacheStorePort<T> {
  private readonly prefix = 'marineops:cache:';
  private fallback = new Map<string, CacheEntry<T>>();

  constructor(private readonly _redisUrl: string) {}

  async get(key: string): Promise<CacheEntry<T> | null> {
    return this.fallback.get(key) ?? null;
  }

  async set(key: string, entry: CacheEntry<T>): Promise<void> {
    this.fallback.set(key, entry);
  }

  async delete(key: string): Promise<boolean> {
    return this.fallback.delete(key);
  }

  async clear(): Promise<void> {
    this.fallback.clear();
  }

  async exists(key: string): Promise<boolean> {
    return this.fallback.has(key);
  }

  async keys(): Promise<string[]> {
    return [...this.fallback.keys()];
  }
}
