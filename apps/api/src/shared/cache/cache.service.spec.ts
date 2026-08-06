import { describe, expect, it } from 'vitest';
import { CacheService } from './cache.service';
import { InMemoryCacheStore } from './in-memory-cache.store';
import { createCachePolicy } from './cache-policy';

describe('CacheService', () => {
  function createService() {
    const store = new InMemoryCacheStore();
    const policy = createCachePolicy({ ttlMs: 100, staleTtlMs: 1000 });
    return new CacheService(store, policy);
  }

  it('returns null on cache miss', async () => {
    const svc = createService();
    const result = await svc.get('key-1');
    expect(result).toBeNull();
  });

  it('stores and retrieves data', async () => {
    const svc = createService();
    await svc.set('key-1', { value: 42 }, 'test', 'st-001');
    const result = await svc.get('key-1');
    expect(result).not.toBeNull();
    expect(result!.data).toEqual({ value: 42 });
  });

  it('returns cache hit when fresh', async () => {
    const svc = createService();
    await svc.set('key-1', 'hello', 'test', 'st-001');
    const result = await svc.get('key-1');
    expect(result).not.toBeNull();
    expect(svc.metrics.getState().hits).toBe(1);
  });

  it('returns null when entry is expired', async () => {
    const store = new InMemoryCacheStore();
    const policy = createCachePolicy({ ttlMs: 1, staleTtlMs: 1 });
    const svc = new CacheService(store, policy);
    await svc.set('key-1', 'data', 'test', 'st-001');
    await new Promise((r) => setTimeout(r, 5));
    const result = await svc.get('key-1');
    expect(result).toBeNull();
    expect(svc.metrics.getState().expiredEntries).toBe(1);
  });

  it('getOrFetch returns fresh from cache', async () => {
    const svc = createService();
    await svc.set('key-1', 'cached', 'test', 'st-001');

    const result = await svc.getOrFetch('key-1', async () => 'fresh', 'test', 'st-001');
    expect(result.data).toBe('cached');
    expect(result.status).toBe('FRESH');
    expect(result.source).toBe('cache');
  });

  it('getOrFetch fetches on cache miss', async () => {
    const svc = createService();

    const result = await svc.getOrFetch('key-1', async () => 'fetched', 'test', 'st-001');
    expect(result.data).toBe('fetched');
    expect(result.status).toBe('FRESH');
    expect(result.source).toBe('provider');
  });

  it('getOrFetch returns stale on provider failure', async () => {
    const store = new InMemoryCacheStore();
    const policy = createCachePolicy({ ttlMs: 1, staleTtlMs: 10000 });
    const svc = new CacheService(store, policy);
    await svc.set('key-1', 'stale-data', 'test', 'st-001');
    await new Promise((r) => setTimeout(r, 5));

    const result = await svc.getOrFetch('key-1', async () => { throw new Error('down'); }, 'test', 'st-001');
    expect(result.data).toBe('stale-data');
    expect(result.status).toBe('STALE');
    expect(result.source).toBe('cache');
  });

  it('getOrFetch throws when no cache and provider fails', async () => {
    const svc = createService();

    await expect(
      svc.getOrFetch('key-1', async () => { throw new Error('down'); }, 'test', 'st-001'),
    ).rejects.toThrow('down');
  });

  it('deletes entry', async () => {
    const svc = createService();
    await svc.set('key-1', 'data', 'test', 'st-001');
    const deleted = await svc.delete('key-1');
    expect(deleted).toBe(true);
    expect(await svc.get('key-1')).toBeNull();
  });

  it('exists returns correct values', async () => {
    const svc = createService();
    expect(await svc.exists('key-1')).toBe(false);
    await svc.set('key-1', 'data', 'test', 'st-001');
    expect(await svc.exists('key-1')).toBe(true);
  });

  it('tracks metrics correctly', async () => {
    const svc = createService();

    await svc.get('key-1');
    await svc.set('key-1', 'data', 'test', 'st-001');
    await svc.get('key-1');
    await svc.get('key-1');

    const state = svc.metrics.getState();
    expect(state.misses).toBe(1);
    expect(state.hits).toBe(2);
    expect(state.refreshCount).toBe(1);
    expect(state.hitRatio).toBeCloseTo(2 / 3);
  });
});
