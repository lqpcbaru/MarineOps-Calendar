import { Redis } from 'ioredis';
import { LoggingService } from '../../platform/logging.service';

/**
 * One shared ioredis connection per process, reused by every RedisCacheStore
 * instance. Each of the 7 cache-consuming modules creates its own
 * CacheService/store — without this, enabling REDIS_ENABLED would open 7
 * independent connections to the same Redis server.
 */
let client: Redis | null = null;

/** Collapses the reconnect-loop error storm to one message per interval. */
const ERROR_LOG_INTERVAL_MS = 30_000;

export function getSharedRedisClient(url: string): Redis {
  if (client) return client;

  const logger = new LoggingService('RedisClient');
  client = new Redis(url, {
    // Never block application startup/requests waiting to (re)connect —
    // callers treat a Redis failure as a cache miss, not a hard failure.
    //
    // enableOfflineQueue MUST stay false. It defaults to true, which makes
    // ioredis QUEUE commands issued while the connection is down and hold
    // them until it comes back: get()/set() then neither resolve nor
    // reject, so the store's try/catch never runs and the request hangs
    // instead of falling back to the origin. That turns a cache outage
    // into a full outage of every cached endpoint — verified against a
    // real stopped Redis, where /api/public/moon and /api/public/dashboard
    // hung until the client timed out. With it false, commands reject
    // immediately while disconnected and the caller degrades to a miss.
    enableOfflineQueue: false,
    // Bounds a command against a server that is connected but wedged —
    // the case enableOfflineQueue cannot cover, because the socket is up.
    commandTimeout: 1000,
    connectTimeout: 5000,
    maxRetriesPerRequest: 1,
    lazyConnect: false,
    retryStrategy: (attempt) => Math.min(attempt * 200, 5000),
  });
  // While Redis is down every reconnect attempt emits an error. Logging
  // each one floods the log with one message per retry for the whole
  // outage, burying anything else; the state is already visible from the
  // first message plus the reconnect notice.
  let lastErrorLoggedAt = 0;
  client.on('error', (err) => {
    const now = Date.now();
    if (now - lastErrorLoggedAt < ERROR_LOG_INTERVAL_MS) return;
    lastErrorLoggedAt = now;
    logger.error(
      'Redis connection error — serving cached reads as misses until it recovers',
      err instanceof Error ? err : undefined,
    );
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
