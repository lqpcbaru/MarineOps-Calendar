import { describe, expect, it } from 'vitest';
import {
  buildCacheKey,
  isCacheHit,
  isCacheStale,
  isCacheExpired,
  createCachePolicy,
} from './cache-policy';

describe('CachePolicy', () => {
  it('builds cache keys', () => {
    expect(buildCacheKey('met', 'weather', 'PKG-01', '2026-08-06')).toBe('met:weather:PKG-01:2026-08-06');
    expect(buildCacheKey('jupem', 'tide', 'PKG-01', '2026-08-06')).toBe('jupem:tide:PKG-01:2026-08-06');
  });

  it('isCacheHit returns true for recent data', () => {
    const recent = new Date(Date.now() - 1_000);
    expect(isCacheHit(recent, 60_000)).toBe(true);
  });

  it('isCacheHit returns false for old data', () => {
    const old = new Date(Date.now() - 120_000);
    expect(isCacheHit(old, 60_000)).toBe(false);
  });

  it('isCacheStale returns true for data between ttl and staleTtl', () => {
    const created = new Date(Date.now() - 90_000);
    expect(isCacheStale(created, 60_000, 120_000)).toBe(true);
  });

  it('isCacheStale returns false for fresh data', () => {
    const created = new Date(Date.now() - 30_000);
    expect(isCacheStale(created, 60_000, 120_000)).toBe(false);
  });

  it('isCacheExpired returns true for data past staleTtl', () => {
    const created = new Date(Date.now() - 150_000);
    expect(isCacheExpired(created, 120_000)).toBe(true);
  });

  it('createCachePolicy returns defaults', () => {
    const policy = createCachePolicy();
    expect(policy.ttlMs).toBe(30 * 60 * 1000);
    expect(policy.staleTtlMs).toBe(120 * 60 * 1000);
  });

  it('createCachePolicy allows overrides', () => {
    const policy = createCachePolicy({ ttlMs: 5000 });
    expect(policy.ttlMs).toBe(5000);
    expect(policy.staleTtlMs).toBe(120 * 60 * 1000);
  });
});
