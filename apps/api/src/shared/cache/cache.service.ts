import { Injectable } from '@nestjs/common';
import type { CacheEntry } from './cache-entry';
import type { CacheStorePort } from './cache-store.port';
import type { CachePolicyConfig } from './cache-policy';
import { isCacheHit, isCacheStale } from './cache-policy';
import { CacheMetrics } from './cache-metrics';

export interface CacheResult<T> {
  data: T;
  status: 'FRESH' | 'STALE';
  source: 'cache' | 'provider';
}

@Injectable()
export class CacheService<T = unknown> {
  public readonly metrics: CacheMetrics;

  constructor(
    private readonly store: CacheStorePort<T>,
    private readonly policy: CachePolicyConfig,
  ) {
    this.metrics = new CacheMetrics();
  }

  async get(key: string): Promise<CacheEntry<T> | null> {
    const entry = await this.store.get(key);
    if (!entry) {
      this.metrics.recordMiss();
      return null;
    }

    const now = new Date();
    if (isCacheHit(entry.createdAt, this.policy.ttlMs, now)) {
      this.metrics.recordHit();
      return entry;
    }

    if (isCacheStale(entry.createdAt, this.policy.ttlMs, this.policy.staleTtlMs, now)) {
      this.metrics.recordStaleHit();
      return entry;
    }

    this.metrics.recordExpired();
    return null;
  }

  async set(
    key: string,
    data: T,
    provider: string,
    stationId: string,
  ): Promise<CacheEntry<T>> {
    const now = new Date();
    const entry: CacheEntry<T> = {
      key,
      provider,
      stationId,
      data,
      createdAt: now,
      expiresAt: new Date(now.getTime() + this.policy.ttlMs),
      version: 1,
    };

    await this.store.set(key, entry);
    this.metrics.recordRefresh();
    return entry;
  }

  async getOrFetch(
    key: string,
    fetcher: () => Promise<T>,
    provider: string,
    stationId: string,
  ): Promise<CacheResult<T>> {
    const entry = await this.get(key);

    if (entry) {
      const now = new Date();
      if (isCacheHit(entry.createdAt, this.policy.ttlMs, now)) {
        return { data: entry.data, status: 'FRESH', source: 'cache' };
      }

      try {
        const freshData = await fetcher();
        await this.set(key, freshData, provider, stationId);
        return { data: freshData, status: 'FRESH', source: 'provider' };
      } catch {
        return { data: entry.data, status: 'STALE', source: 'cache' };
      }
    }

    const freshData = await fetcher();
    await this.set(key, freshData, provider, stationId);
    return { data: freshData, status: 'FRESH', source: 'provider' };
  }

  async delete(key: string): Promise<boolean> {
    return this.store.delete(key);
  }

  async clear(): Promise<void> {
    await this.store.clear();
  }

  async exists(key: string): Promise<boolean> {
    return this.store.exists(key);
  }
}
