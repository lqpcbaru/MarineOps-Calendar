import { describe, expect, it } from 'vitest';
import { InMemoryCacheStore } from './in-memory-cache.store';
import type { CacheEntry } from './cache-entry';

describe('InMemoryCacheStore', () => {
  it('stores and retrieves entries', async () => {
    const store = new InMemoryCacheStore<string>();
    await store.set('k', {
      key: 'k',
      provider: 'p',
      stationId: 's',
      data: 'v',
      createdAt: new Date(),
      expiresAt: new Date(),
      version: 1,
    });
    const result = await store.get('k');
    expect(result!.data).toBe('v');
  });

  it('returns null for missing key', async () => {
    const store = new InMemoryCacheStore();
    expect(await store.get('missing')).toBeNull();
  });

  it('deletes entries', async () => {
    const store = new InMemoryCacheStore<string>();
    await store.set('k', {
      key: 'k',
      provider: 'p',
      stationId: 's',
      data: 'v',
      createdAt: new Date(),
      expiresAt: new Date(),
      version: 1,
    });
    expect(await store.delete('k')).toBe(true);
    expect(await store.exists('k')).toBe(false);
  });

  it('clears all entries', async () => {
    const store = new InMemoryCacheStore<string>();
    await store.set('k1', {
      key: 'k1',
      provider: 'p',
      stationId: 's',
      data: 'v',
      createdAt: new Date(),
      expiresAt: new Date(),
      version: 1,
    });
    await store.set('k2', {
      key: 'k2',
      provider: 'p',
      stationId: 's',
      data: 'v',
      createdAt: new Date(),
      expiresAt: new Date(),
      version: 1,
    });
    await store.clear();
    expect(await store.keys()).toHaveLength(0);
  });

  it('lists all keys', async () => {
    const store = new InMemoryCacheStore<string>();
    await store.set('a', {
      key: 'a',
      provider: 'p',
      stationId: 's',
      data: 'v',
      createdAt: new Date(),
      expiresAt: new Date(),
      version: 1,
    });
    await store.set('b', {
      key: 'b',
      provider: 'p',
      stationId: 's',
      data: 'v',
      createdAt: new Date(),
      expiresAt: new Date(),
      version: 1,
    });
    const keys = await store.keys();
    expect(keys).toHaveLength(2);
  });
});

describe('InMemoryCacheStore — bounded growth', () => {
  function entry(key: string): CacheEntry<string> {
    return {
      key,
      provider: 'p',
      stationId: 's',
      data: 'v',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 60_000),
      version: 1,
    };
  }

  it('never grows past its entry cap', async () => {
    const store = new InMemoryCacheStore<string>(10);
    for (let i = 0; i < 500; i++) {
      await store.set(`k${i}`, entry(`k${i}`));
    }
    expect(store.size).toBeLessThanOrEqual(10);
  });

  it('evicts the oldest entries first and keeps the newest', async () => {
    const store = new InMemoryCacheStore<string>(3);
    for (const k of ['a', 'b', 'c', 'd']) await store.set(k, entry(k));

    expect(await store.exists('a')).toBe(false);
    expect(await store.exists('d')).toBe(true);
    expect(store.size).toBe(3);
  });

  it('overwriting an existing key does not count as growth', async () => {
    const store = new InMemoryCacheStore<string>(3);
    for (let i = 0; i < 50; i++) await store.set('same', entry('same'));

    expect(store.size).toBe(1);
    expect(await store.exists('same')).toBe(true);
  });
});
