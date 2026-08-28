import { Redis } from 'ioredis';
import { LoggingService } from '../../platform/logging.service';

/**
 * One shared ioredis connection per process, reused by every RedisCacheStore
 * instance. Each of the 7 cache-consuming modules creates its own
 * CacheService/store — without this, enabling REDIS_ENABLED would open 7
 * independent connections to the same Redis server.
 */
let client: Redis | null = null;

export function getSharedRedisClient(url: string): Redis {
  if (client) return client;

  const logger = new LoggingService('RedisClient');
  client = new Redis(url, {
    // Never block application startup/requests waiting to (re)connect —
    // callers treat a Redis failure as a cache miss, not a hard failure.
    maxRetriesPerRequest: 1,
    lazyConnect: false,
    retryStrategy: (attempt) => Math.min(attempt * 200, 5000),
  });
  client.on('error', (err) => {
    logger.error('Redis connection error', err instanceof Error ? err : undefined);
  });
  client.on('connect', () => {
    logger.log('Redis connected');
  });
  return client;
}

/**
 * Test-only: closes the shared connection (if any) and forces the next
 * getSharedRedisClient() call to create a fresh instance. Without this,
 * a test that enables Redis leaves a live reconnect loop running against
 * whatever host/port it was pointed at for the rest of the test process.
 */
export function resetSharedRedisClientForTests(): void {
  client?.disconnect();
  client = null;
}
