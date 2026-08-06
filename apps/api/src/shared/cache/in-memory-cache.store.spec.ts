import { describe, expect, it } from 'vitest';
import { InMemoryCacheStore } from './in-memory-cache.store';

describe('InMemoryCacheStore', () => {
  it('stores and retrieves entries', async () => {
    const store = new InMemoryCacheStore<string>();
    await store.set('k', { key: 'k', provider: 'p', stationId: 's', data: 'v', createdAt: new Date(), expiresAt: new Date(), version: 1 });
    const result = await store.get('k');
    expect(result!.data).toBe('v');
  });

  it('returns null for missing key', async () => {
    const store = new InMemoryCacheStore();
    expect(await store.get('missing')).toBeNull();
  });

  it('deletes entries', async () => {
    const store = new InMemoryCacheStore<string>();
    await store.set('k', { key: 'k', provider: 'p', stationId: 's', data: 'v', createdAt: new Date(), expiresAt: new Date(), version: 1 });
    expect(await store.delete('k')).toBe(true);
    expect(await store.exists('k')).toBe(false);
  });

  it('clears all entries', async () => {
    const store = new InMemoryCacheStore<string>();
    await store.set('k1', { key: 'k1', provider: 'p', stationId: 's', data: 'v', createdAt: new Date(), expiresAt: new Date(), version: 1 });
    await store.set('k2', { key: 'k2', provider: 'p', stationId: 's', data: 'v', createdAt: new Date(), expiresAt: new Date(), version: 1 });
    await store.clear();
    expect(await store.keys()).toHaveLength(0);
  });

  it('lists all keys', async () => {
    const store = new InMemoryCacheStore<string>();
    await store.set('a', { key: 'a', provider: 'p', stationId: 's', data: 'v', createdAt: new Date(), expiresAt: new Date(), version: 1 });
    await store.set('b', { key: 'b', provider: 'p', stationId: 's', data: 'v', createdAt: new Date(), expiresAt: new Date(), version: 1 });
    const keys = await store.keys();
    expect(keys).toHaveLength(2);
  });
});
