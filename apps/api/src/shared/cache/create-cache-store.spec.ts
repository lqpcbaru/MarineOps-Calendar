import { afterEach, describe, expect, it } from 'vitest';
import { createCacheStore } from './create-cache-store';
import { InMemoryCacheStore } from './in-memory-cache.store';
import { RedisCacheStore } from './redis-cache.store';
import { resetSharedRedisClientForTests } from './redis-client';

describe('createCacheStore', () => {
  afterEach(() => {
    delete process.env['REDIS_ENABLED'];
    delete process.env['REDIS_URL'];
    resetSharedRedisClientForTests();
  });

  it('returns InMemoryCacheStore when REDIS_ENABLED is unset', () => {
    expect(createCacheStore()).toBeInstanceOf(InMemoryCacheStore);
  });

  it('returns InMemoryCacheStore when REDIS_ENABLED=false', () => {
    process.env['REDIS_ENABLED'] = 'false';
    expect(createCacheStore()).toBeInstanceOf(InMemoryCacheStore);
  });

  it('returns RedisCacheStore when REDIS_ENABLED=true', () => {
    process.env['REDIS_ENABLED'] = 'true';
    process.env['REDIS_URL'] = 'redis://localhost:6379';
    expect(createCacheStore()).toBeInstanceOf(RedisCacheStore);
  });
});
