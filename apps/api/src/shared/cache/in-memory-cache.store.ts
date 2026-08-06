import { Injectable } from '@nestjs/common';
import type { CacheEntry } from './cache-entry';
import type { CacheStorePort } from './cache-store.port';

@Injectable()
export class InMemoryCacheStore<T = unknown> implements CacheStorePort<T> {
  private readonly store = new Map<string, CacheEntry<T>>();

  async get(key: string): Promise<CacheEntry<T> | null> {
    return this.store.get(key) ?? null;
  }

  async set(key: string, entry: CacheEntry<T>): Promise<void> {
    this.store.set(key, entry);
  }

  async delete(key: string): Promise<boolean> {
    return this.store.delete(key);
  }

  async clear(): Promise<void> {
    this.store.clear();
  }

  async exists(key: string): Promise<boolean> {
    return this.store.has(key);
  }

  async keys(): Promise<string[]> {
    return [...this.store.keys()];
  }
}
