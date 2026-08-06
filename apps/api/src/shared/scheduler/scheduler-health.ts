import type { SchedulerMetrics } from './scheduler-metrics';

export type SchedulerHealthStatus = 'ONLINE' | 'DEGRADED' | 'OFFLINE' | 'UNKNOWN';

export class SchedulerHealth {
  private failureThreshold = 0.5;
  private offlineThreshold = 0.9;

  constructor(private readonly metrics: SchedulerMetrics) {}

  getStatus(): SchedulerHealthStatus {
    const state = this.metrics.getState();
    if (state.totalExecutions === 0) return 'UNKNOWN';

    if (state.failedExecutions === 0) return 'ONLINE';

    const failureRate = state.failedExecutions / state.totalExecutions;

    if (failureRate >= this.offlineThreshold) return 'OFFLINE';
    if (failureRate >= this.failureThreshold) return 'DEGRADED';

    return 'ONLINE';
  }

  isOnline(): boolean { return this.getStatus() === 'ONLINE'; }
  isDegraded(): boolean { return this.getStatus() === 'DEGRADED'; }
  isOffline(): boolean { return this.getStatus() === 'OFFLINE'; }
}
