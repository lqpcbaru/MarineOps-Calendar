import type { Redis } from 'ioredis';
import type { CacheEntry } from './cache-entry';
import type { CacheStorePort } from './cache-store.port';
import { getSharedRedisClient } from './redis-client';
import { LoggingService } from '../../platform/logging.service';

const DEFAULT_TTL_SECONDS = 7 * 24 * 60 * 60; // covers every current module's staleTtlMs

/**
 * A Redis outage fails EVERY cache operation, so logging each one emits a
 * line per lookup for as long as the outage lasts — under load that is a
 * flood that buries unrelated errors and costs real money in log storage,
 * while saying nothing the first line did not. Degrading to a cache miss is
 * also the designed behaviour, not an incident in itself, so these are
 * reported at warn and collapsed to one line per operation per interval.
 */
const FAILURE_LOG_INTERVAL_MS = 30_000;

/**
 * Real Redis-backed cache, shared across horizontally-scaled API replicas
 * (unlike InMemoryCacheStore, which is per-process and lost on every
 * restart). Redis is treated as best-effort: any connection or
 * (de)serialization failure is logged and degrades to a cache miss/no-op
 * rather than throwing — CacheService must keep working (falling through to
 * the provider) even when Redis is unavailable.
 */
export class RedisCacheStore<T = unknown> implements CacheStorePort<T> {
  private readonly prefix = 'marineops:cache:';
  private readonly redis: Redis;
  private readonly logger = new LoggingService('RedisCacheStore');
  private readonly lastFailureLoggedAt = new Map<string, number>();

  constructor(
    redisUrl: string,
    private readonly ttlSeconds: number = DEFAULT_TTL_SECONDS,
    client?: Redis,
  ) {
    this.redis = client ?? getSharedRedisClient(redisUrl);
  }

  async get(key: string): Promise<CacheEntry<T> | null> {
    try {
      const raw = await this.redis.get(this.prefix + key);
      if (!raw) return null;
      return this.deserialize(raw);
    } catch (error) {
      this.logFailure('get', 'get failed, treating as cache miss', error, { key });
      return null;
    }
  }

  async set(key: string, entry: CacheEntry<T>): Promise<void> {
    try {
      await this.redis.set(this.prefix + key, JSON.stringify(entry), 'EX', this.ttlSeconds);
    } catch (error) {
      this.logFailure('set', 'set failed, entry not cached', error, { key });
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      const removed = await this.redis.del(this.prefix + key);
      return removed > 0;
    } catch (error) {
      this.logFailure('delete', 'delete failed', error, { key });
      return false;
    }
  }

  async clear(): Promise<void> {
    try {
      const keys = await this.scanKeys();
      if (keys.length > 0) await this.redis.del(...keys);
    } catch (error) {
      this.logFailure('clear', 'clear failed', error);
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const count = await this.redis.exists(this.prefix + key);
      return count > 0;
    } catch (error) {
      this.logger.error('exists check failed', error instanceof Error ? error : undefined, { key });
      return false;
    }
  }

  async keys(): Promise<string[]> {
    try {
      const keys = await this.scanKeys();
      return keys.map((k) => k.slice(this.prefix.length));
    } catch (error) {
      this.logger.error('keys scan failed', error instanceof Error ? error : undefined);
      return [];
    }
  }

  /** SCAN, never KEYS — KEYS blocks the whole Redis instance on large datasets. */
  private async scanKeys(): Promise<string[]> {
    const found: string[] = [];
    let cursor = '0';
    do {
      const [next, batch] = await this.redis.scan(cursor, 'MATCH', `${this.prefix}*`, 'COUNT', 100);
      found.push(...batch);
      cursor = next;
    } while (cursor !== '0');
    return found;
  }

  /**
   * Collapses repeated failures of the same operation to one line per
   * FAILURE_LOG_INTERVAL_MS. The first failure of an outage is always
   * logged; the rest are suppressed until the window rolls over.
   */
  private logFailure(
    operation: string,
    message: string,
    error: unknown,
    context?: Record<string, unknown>,
  ): void {
    const now = Date.now();
    const previous = this.lastFailureLoggedAt.get(operation);
    if (previous !== undefined && now - previous < FAILURE_LOG_INTERVAL_MS) return;
    this.lastFailureLoggedAt.set(operation, now);
    this.logger.warn(message, {
      ...context,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  private deserialize(raw: string): CacheEntry<T> {
    const parsed = JSON.parse(raw) as CacheEntry<T> & { createdAt: string; expiresAt: string };
    return {
      ...parsed,
      createdAt: new Date(parsed.createdAt),
      expiresAt: new Date(parsed.expiresAt),
    };
  }
}
