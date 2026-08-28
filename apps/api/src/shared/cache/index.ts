export type { CacheStatus } from './cache-status';
export { isFresh, isStale, isExpired, isMissing } from './cache-status';
export type { CacheEntry } from './cache-entry';
export type { CacheStorePort } from './cache-store.port';
export type { CachePolicyConfig } from './cache-policy';
export {
  createCachePolicy,
  isCacheHit,
  isCacheStale,
  isCacheExpired,
  buildCacheKey,
} from './cache-policy';
export { CacheMetrics } from './cache-metrics';
export type { CacheMetricsState } from './cache-metrics';
export { CacheService } from './cache.service';
export type { CacheResult } from './cache.service';
export { InMemoryCacheStore } from './in-memory-cache.store';
export { RedisCacheStore } from './redis-cache.store';
export { createCacheStore } from './create-cache-store';

export const CACHE_STORE = 'CACHE_STORE';
export const CACHE_POLICY = 'CACHE_POLICY';
