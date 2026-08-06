import { describe, expect, it } from 'vitest';
import { CacheMetrics } from './cache-metrics';

describe('CacheMetrics', () => {
  it('tracks hits and misses', () => {
    const m = new CacheMetrics();
    m.recordHit();
    m.recordHit();
    m.recordMiss();
    const state = m.getState();
    expect(state.hits).toBe(2);
    expect(state.misses).toBe(1);
    expect(state.totalRequests).toBe(3);
  });

  it('calculates hit ratio', () => {
    const m = new CacheMetrics();
    m.recordHit();
    m.recordMiss();
    m.recordMiss();
    expect(m.getState().hitRatio).toBeCloseTo(1 / 3);
  });

  it('tracks stale hits separately', () => {
    const m = new CacheMetrics();
    m.recordStaleHit();
    m.recordStaleHit();
    expect(m.getState().staleHits).toBe(2);
  });

  it('tracks refresh count', () => {
    const m = new CacheMetrics();
    m.recordRefresh();
    m.recordRefresh();
    m.recordRefresh();
    expect(m.getState().refreshCount).toBe(3);
  });
});
