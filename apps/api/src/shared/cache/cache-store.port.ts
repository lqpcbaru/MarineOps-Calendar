import type { CacheEntry } from './cache-entry';

export interface CacheStorePort<T = unknown> {
  get(key: string): Promise<CacheEntry<T> | null>;
  set(key: string, entry: CacheEntry<T>): Promise<void>;
  delete(key: string): Promise<boolean>;
  clear(): Promise<void>;
  exists(key: string): Promise<boolean>;
  keys(): Promise<string[]>;
}
