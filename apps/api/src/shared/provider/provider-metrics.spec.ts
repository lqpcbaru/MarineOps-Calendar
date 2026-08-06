import { describe, expect, it } from 'vitest';
import { ProviderMetrics } from './provider-metrics';

describe('ProviderMetrics', () => {
  it('tracks success and failure counts', () => {
    const metrics = new ProviderMetrics();
    metrics.recordSuccess(100);
    metrics.recordSuccess(200);
    metrics.recordFailure('timeout');

    const state = metrics.getState();
    expect(state.totalRequests).toBe(3);
    expect(state.successfulRequests).toBe(2);
    expect(state.failedRequests).toBe(1);
  });

  it('calculates success rate', () => {
    const metrics = new ProviderMetrics();
    metrics.recordSuccess(100);
    metrics.recordFailure('error');

    const state = metrics.getState();
    expect(state.successRate).toBe(0.5);
  });

  it('calculates average latency', () => {
    const metrics = new ProviderMetrics();
    metrics.recordSuccess(100);
    metrics.recordSuccess(300);

    const state = metrics.getState();
    expect(state.averageLatencyMs).toBe(200);
  });

  it('records timestamps for last success and failure', () => {
    const metrics = new ProviderMetrics();
    metrics.recordSuccess(50);
    metrics.recordFailure('test error');

    const state = metrics.getState();
    expect(state.lastSuccessAt).toBeDefined();
    expect(state.lastFailureAt).toBeDefined();
    expect(state.lastFailureError).toBe('test error');
  });

  it('tracks retries separately', () => {
    const metrics = new ProviderMetrics();
    metrics.recordRetries(3);
    metrics.recordSuccess(100);

    const state = metrics.getState();
    expect(state.totalRetries).toBe(3);
    expect(state.successfulRequests).toBe(1);
  });
});
