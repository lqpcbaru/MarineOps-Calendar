export interface ProviderMetricsState {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  totalRetries: number;
  totalLatencyMs: number;
  lastSuccessAt: string | null;
  lastFailureAt: string | null;
  lastFailureError: string | null;
  averageLatencyMs: number;
  successRate: number;
}

export class ProviderMetrics {
  private state: ProviderMetricsState = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    totalRetries: 0,
    totalLatencyMs: 0,
    lastSuccessAt: null,
    lastFailureAt: null,
    lastFailureError: null,
    averageLatencyMs: 0,
    successRate: 1,
  };

  recordSuccess(latencyMs: number): void {
    this.state.totalRequests++;
    this.state.successfulRequests++;
    this.state.totalLatencyMs += latencyMs;
    this.state.lastSuccessAt = new Date().toISOString();
    this.recalculate();
  }

  recordFailure(error: string): void {
    this.state.totalRequests++;
    this.state.failedRequests++;
    this.state.lastFailureAt = new Date().toISOString();
    this.state.lastFailureError = error;
    this.recalculate();
  }

  recordRetries(count: number): void {
    this.state.totalRetries += count;
  }

  getState(): Readonly<ProviderMetricsState> {
    return { ...this.state };
  }

  private recalculate(): void {
    const total = this.state.totalRequests;
    if (total > 0) {
      this.state.successRate = this.state.successfulRequests / total;
      this.state.averageLatencyMs = this.state.totalLatencyMs / total;
    }
  }
}
