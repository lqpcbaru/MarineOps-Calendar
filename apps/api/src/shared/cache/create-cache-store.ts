import type { CacheStorePort } from './cache-store.port';
import { InMemoryCacheStore } from './in-memory-cache.store';
import { RedisCacheStore } from './redis-cache.store';

/**
 * Single decision point for which cache backend a module gets. Every
 * cache-consuming module should call this instead of hardcoding
 * `new InMemoryCacheStore()` — that was the bug that made REDIS_ENABLED a
 * no-op everywhere (see git history on redis-cache.store.ts).
 */
export function createCacheStore<T = unknown>(): CacheStorePort<T> {
  if (process.env['REDIS_ENABLED'] === 'true') {
    const url = process.env['REDIS_URL'] || 'redis://localhost:6379';
    return new RedisCacheStore<T>(url);
  }
  return new InMemoryCacheStore<T>();
}
