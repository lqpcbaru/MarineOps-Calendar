import { afterEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  constructorCalls: [] as Array<{ url: string; options: Record<string, unknown> }>,
}));

vi.mock('ioredis', () => ({
  Redis: class {
    constructor(url: string, options: Record<string, unknown>) {
      mocks.constructorCalls.push({ url, options });
    }
    on(): this {
      return this;
    }
    disconnect(): void {}
  },
}));

import { getSharedRedisClient, resetSharedRedisClientForTests } from './redis-client';

const constructorCalls = mocks.constructorCalls;

afterEach(() => {
  resetSharedRedisClientForTests();
  constructorCalls.length = 0;
});

describe('getSharedRedisClient', () => {
  it('reuses one connection across callers', () => {
    const first = getSharedRedisClient('redis://localhost:6379');
    const second = getSharedRedisClient('redis://localhost:6379');

    expect(second).toBe(first);
    expect(constructorCalls).toHaveLength(1);
  });

  // Regression: ioredis defaults enableOfflineQueue to true, which QUEUES
  // commands issued while the connection is down and holds them until it
  // returns. get()/set() then never settle, so RedisCacheStore's try/catch
  // never runs and the request hangs instead of degrading to a cache miss —
  // a Redis outage becomes an outage of every cached endpoint. Observed for
  // real against a stopped Redis: /api/public/moon and /api/public/dashboard
  // hung until the HTTP client gave up, while uncached routes stayed healthy.
  it('rejects commands immediately while disconnected instead of queueing them', () => {
    getSharedRedisClient('redis://localhost:6379');

    expect(constructorCalls[0]?.options['enableOfflineQueue']).toBe(false);
  });

  // enableOfflineQueue only covers a connection that is known to be down.
  // A server that is connected but wedged accepts the command and never
  // answers, so an explicit per-command deadline is what bounds the wait.
  it('bounds every command with a timeout so a wedged server cannot stall a request', () => {
    getSharedRedisClient('redis://localhost:6379');

    const commandTimeout = constructorCalls[0]?.options['commandTimeout'];
    expect(typeof commandTimeout).toBe('number');
    expect(commandTimeout as number).toBeGreaterThan(0);
    expect(commandTimeout as number).toBeLessThanOrEqual(5_000);
  });
});
