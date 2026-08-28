import { describe, expect, it, vi } from 'vitest';
import { RedisCacheStore } from './redis-cache.store';
import type { CacheEntry } from './cache-entry';

/** Minimal fake of the subset of ioredis's Redis client this store uses. */
function makeFakeRedis() {
  const store = new Map<string, string>();
  return {
    store,
    get: vi.fn(async (key: string) => store.get(key) ?? null),
    set: vi.fn(async (key: string, value: string) => {
      store.set(key, value);
      return 'OK';
    }),
    del: vi.fn(async (...keys: string[]) => {
      let removed = 0;
      for (const k of keys) if (store.delete(k)) removed++;
      return removed;
    }),
    exists: vi.fn(async (key: string) => (store.has(key) ? 1 : 0)),
    scan: vi.fn(async (_cursor: string, ..._args: unknown[]) => ['0', [...store.keys()]]),
  };
}

function makeEntry(
  overrides: Partial<CacheEntry<{ value: number }>> = {},
): CacheEntry<{ value: number }> {
  return {
    key: 'k1',
    provider: 'test',
    stationId: 'st-1',
    data: { value: 42 },
    createdAt: new Date('2026-08-01T00:00:00Z'),
    expiresAt: new Date('2026-08-01T01:00:00Z'),
    version: 1,
    ...overrides,
  };
}

describe('RedisCacheStore', () => {
  it('round-trips an entry through get/set, reviving Date fields', async () => {
    const redis = makeFakeRedis();
    const store = new RedisCacheStore<{ value: number }>('redis://unused', 3600, redis as never);

    await store.set('k1', makeEntry());
    const result = await store.get('k1');

    expect(result).not.toBeNull();
    expect(result!.data).toEqual({ value: 42 });
    expect(result!.createdAt).toBeInstanceOf(Date);
    expect(result!.createdAt.toISOString()).toBe('2026-08-01T00:00:00.000Z');
  });

  it('set() applies a TTL so entries do not accumulate forever', async () => {
    const redis = makeFakeRedis();
    const store = new RedisCacheStore<{ value: number }>('redis://unused', 3600, redis as never);

    await store.set('k1', makeEntry());

    expect(redis.set).toHaveBeenCalledWith('marineops:cache:k1', expect.any(String), 'EX', 3600);
  });

  it('returns null on a miss', async () => {
    const redis = makeFakeRedis();
    const store = new RedisCacheStore('redis://unused', 3600, redis as never);
    expect(await store.get('missing')).toBeNull();
  });

  it('delete() and exists() reflect store state', async () => {
    const redis = makeFakeRedis();
    const store = new RedisCacheStore<{ value: number }>('redis://unused', 3600, redis as never);

    await store.set('k1', makeEntry());
    expect(await store.exists('k1')).toBe(true);
    expect(await store.delete('k1')).toBe(true);
    expect(await store.exists('k1')).toBe(false);
    expect(await store.delete('k1')).toBe(false);
  });

  it('get() degrades to a cache miss instead of throwing when Redis errors', async () => {
    const redis = makeFakeRedis();
    redis.get.mockRejectedValueOnce(new Error('connection reset'));
    const store = new RedisCacheStore('redis://unused', 3600, redis as never);

    await expect(store.get('k1')).resolves.toBeNull();
  });

  it('set() swallows a Redis failure instead of throwing (caller already fetched the real data)', async () => {
    const redis = makeFakeRedis();
    redis.set.mockRejectedValueOnce(new Error('connection reset'));
    const store = new RedisCacheStore<{ value: number }>('redis://unused', 3600, redis as never);

    await expect(store.set('k1', makeEntry())).resolves.toBeUndefined();
  });

  it('keys() strips the internal prefix', async () => {
    const redis = makeFakeRedis();
    const store = new RedisCacheStore<{ value: number }>('redis://unused', 3600, redis as never);

    await store.set('a', makeEntry());
    await store.set('b', makeEntry());

    expect(await store.keys()).toEqual(expect.arrayContaining(['a', 'b']));
  });
});
