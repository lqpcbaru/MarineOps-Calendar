import type { ProviderMetrics, ProviderMetricsState } from './provider-metrics';

export type ProviderHealthStatus = 'ONLINE' | 'DEGRADED' | 'OFFLINE';

export class ProviderHealth {
  private readonly healthThresholds = {
    degradedSuccessRate: 0.7,
    offlineSuccessRate: 0.3,
    degradedLatencyMs: 5_000,
    recentFailureWindowMs: 300_000,
  };

  constructor(private readonly metrics: ProviderMetrics) {}

  getStatus(): ProviderHealthStatus {
    const state = this.metrics.getState();

    if (state.totalRequests === 0) return 'ONLINE';

    if (state.successRate < this.healthThresholds.offlineSuccessRate) {
      return 'OFFLINE';
    }

    if (state.successRate < this.healthThresholds.degradedSuccessRate) {
      return 'DEGRADED';
    }

    if (state.averageLatencyMs > this.healthThresholds.degradedLatencyMs) {
      return 'DEGRADED';
    }

    if (state.lastFailureAt && this.isRecentFailure(state)) {
      return 'DEGRADED';
    }

    return 'ONLINE';
  }

  isOnline(): boolean {
    return this.getStatus() === 'ONLINE';
  }

  isDegraded(): boolean {
    return this.getStatus() === 'DEGRADED';
  }

  isOffline(): boolean {
    return this.getStatus() === 'OFFLINE';
  }

  private isRecentFailure(state: Readonly<ProviderMetricsState>): boolean {
    if (!state.lastFailureAt) return false;
    const failureTime = new Date(state.lastFailureAt).getTime();
    const now = Date.now();
    return (now - failureTime) < this.healthThresholds.recentFailureWindowMs;
  }
}
