import type { CacheEntry } from './cache-entry';
import type { CacheStorePort } from './cache-store.port';

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
