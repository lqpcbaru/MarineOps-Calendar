import { Injectable } from '@nestjs/common';
import type { CacheEntry } from './cache-entry';
import type { CacheStorePort } from './cache-store.port';

/**
 * Entry cap for the in-process cache.
 *
 * This store backs the DEFAULT deployment (REDIS_ENABLED is false in both
 * infrastructure/environments templates), and a Map has no eviction of its
 * own, so without a bound the process grows monotonically for as long as it
 * runs: every distinct (station, date) pair ever requested stays resident
 * forever, and public endpoints keyed partly on caller-supplied values add
 * to it on demand. That is an OOM on a long-lived container, not a
 * theoretical leak.
 *
 * Legitimate working set is roughly 21 stations x ~5 data types x ~30 days
 * (~3k entries), so 5000 leaves headroom while still bounding the worst
 * case. Redis is the answer for anything larger — it has real eviction
 * policies and is shared across replicas.
 */
const DEFAULT_MAX_ENTRIES = 5000;

@Injectable()
export class InMemoryCacheStore<T = unknown> implements CacheStorePort<T> {
  private readonly store = new Map<string, CacheEntry<T>>();

  constructor(private readonly maxEntries: number = DEFAULT_MAX_ENTRIES) {}

  async get(key: string): Promise<CacheEntry<T> | null> {
    return this.store.get(key) ?? null;
  }

  async set(key: string, entry: CacheEntry<T>): Promise<void> {
    // Re-inserting an existing key must not count as growth, so delete
    // first: that also moves the key to the back of the insertion order,
    // making eviction least-recently-written rather than oldest-ever.
    this.store.delete(key);

    while (this.store.size >= this.maxEntries) {
      // Map iterates in insertion order, so the first key is the oldest.
      const oldest = this.store.keys().next();
      if (oldest.done) break;
      this.store.delete(oldest.value);
    }

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

  /** Current entry count. Exposed for tests and diagnostics. */
  get size(): number {
    return this.store.size;
  }
}
