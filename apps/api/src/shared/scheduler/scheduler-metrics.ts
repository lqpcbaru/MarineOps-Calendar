export interface SchedulerMetricsState {
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  skippedExecutions: number;
  totalRetries: number;
  totalDurationMs: number;
  averageDurationMs: number;
  currentlyRunning: number;
  lastExecutionAt: string | null;
}

export class SchedulerMetrics {
  private state: SchedulerMetricsState = {
    totalExecutions: 0,
    successfulExecutions: 0,
    failedExecutions: 0,
    skippedExecutions: 0,
    totalRetries: 0,
    totalDurationMs: 0,
    averageDurationMs: 0,
    currentlyRunning: 0,
    lastExecutionAt: null,
  };

  recordStart(): void {
    this.state.currentlyRunning++;
    this.state.lastExecutionAt = new Date().toISOString();
  }

  recordSuccess(durationMs: number): void {
    this.state.totalExecutions++;
    this.state.successfulExecutions++;
    this.state.totalDurationMs += durationMs;
    this.state.currentlyRunning = Math.max(0, this.state.currentlyRunning - 1);
    this.recalculate();
  }

  recordFailure(durationMs: number): void {
    this.state.totalExecutions++;
    this.state.failedExecutions++;
    this.state.totalDurationMs += durationMs;
    this.state.currentlyRunning = Math.max(0, this.state.currentlyRunning - 1);
    this.recalculate();
  }

  recordSkipped(): void {
    this.state.skippedExecutions++;
    this.state.currentlyRunning = Math.max(0, this.state.currentlyRunning - 1);
  }

  recordRetries(count: number): void {
    this.state.totalRetries += count;
  }

  getState(): Readonly<SchedulerMetricsState> {
    return { ...this.state };
  }

  private recalculate(): void {
    if (this.state.totalExecutions > 0) {
      this.state.averageDurationMs = this.state.totalDurationMs / this.state.totalExecutions;
    }
  }
}
