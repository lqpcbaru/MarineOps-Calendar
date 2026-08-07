import { describe, expect, it } from 'vitest';
import { RedisCacheStore } from './redis-cache.store';

describe('RedisCacheStore', () => {
  it('stores and retrieves entries (in-memory fallback)', async () => {
    const store = new RedisCacheStore<string>('redis://localhost:6379');
    await store.set('k', { key: 'k', provider: 'p', stationId: 's', data: 'v', createdAt: new Date(), expiresAt: new Date(), version: 1 });
    const result = await store.get('k');
    expect(result!.data).toBe('v');
  });

  it('returns null for missing key', async () => {
    const store = new RedisCacheStore<string>('redis://localhost:6379');
    expect(await store.get('missing')).toBeNull();
  });

  it('deletes entries', async () => {
    const store = new RedisCacheStore<string>('redis://localhost:6379');
    await store.set('k', { key: 'k', provider: 'p', stationId: 's', data: 'v', createdAt: new Date(), expiresAt: new Date(), version: 1 });
    expect(await store.delete('k')).toBe(true);
    expect(await store.exists('k')).toBe(false);
  });

  it('clears all entries', async () => {
    const store = new RedisCacheStore<string>('redis://localhost:6379');
    await store.set('k1', { key: 'k1', provider: 'p', stationId: 's', data: 'v', createdAt: new Date(), expiresAt: new Date(), version: 1 });
    await store.set('k2', { key: 'k2', provider: 'p', stationId: 's', data: 'v', createdAt: new Date(), expiresAt: new Date(), version: 1 });
    await store.clear();
    expect(await store.keys()).toHaveLength(0);
  });
});
