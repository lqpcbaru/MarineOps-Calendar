import { describe, expect, it } from 'vitest';
import { ProviderHealth } from './provider-health';
import { ProviderMetrics } from './provider-metrics';

describe('ProviderHealth', () => {
  it('reports ONLINE when no requests made', () => {
    const metrics = new ProviderMetrics();
    const health = new ProviderHealth(metrics);
    expect(health.getStatus()).toBe('ONLINE');
    expect(health.isOnline()).toBe(true);
  });

  it('reports ONLINE with high success rate', () => {
    const metrics = new ProviderMetrics();
    for (let i = 0; i < 10; i++) metrics.recordSuccess(100);
    const health = new ProviderHealth(metrics);
    expect(health.getStatus()).toBe('ONLINE');
  });

  it('reports DEGRADED with moderate failure rate', () => {
    const metrics = new ProviderMetrics();
    metrics.recordSuccess(50);
    metrics.recordSuccess(50);
    metrics.recordFailure('error');
    metrics.recordFailure('error');
    metrics.recordFailure('error');
    const health = new ProviderHealth(metrics);
    expect(health.getStatus()).toBe('DEGRADED');
  });

  it('reports OFFLINE with high failure rate', () => {
    const metrics = new ProviderMetrics();
    metrics.recordFailure('error');
    metrics.recordFailure('error');
    metrics.recordFailure('error');
    metrics.recordSuccess(50);
    const health = new ProviderHealth(metrics);
    expect(health.getStatus()).toBe('OFFLINE');
  });

  it('isDegraded returns true for DEGRADED status', () => {
    const metrics = new ProviderMetrics();
    metrics.recordSuccess(50);
    metrics.recordFailure('error');
    const health = new ProviderHealth(metrics);
    expect(health.isDegraded()).toBe(true);
  });

  it('isOffline returns true for OFFLINE status', () => {
    const metrics = new ProviderMetrics();
    for (let i = 0; i < 8; i++) metrics.recordFailure('error');
    metrics.recordSuccess(50);
    const health = new ProviderHealth(metrics);
    expect(health.isOffline()).toBe(true);
  });
});
