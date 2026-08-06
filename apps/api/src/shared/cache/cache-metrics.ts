export interface CacheMetricsState {
  hits: number;
  misses: number;
  staleHits: number;
  expiredEntries: number;
  refreshCount: number;
  hitRatio: number;
  totalRequests: number;
}

export class CacheMetrics {
  private state: CacheMetricsState = {
    hits: 0,
    misses: 0,
    staleHits: 0,
    expiredEntries: 0,
    refreshCount: 0,
    hitRatio: 0,
    totalRequests: 0,
  };

  recordHit(): void {
    this.state.hits++;
    this.state.totalRequests++;
    this.recalculate();
  }

  recordMiss(): void {
    this.state.misses++;
    this.state.totalRequests++;
    this.recalculate();
  }

  recordStaleHit(): void {
    this.state.staleHits++;
  }

  recordExpired(): void {
    this.state.expiredEntries++;
  }

  recordRefresh(): void {
    this.state.refreshCount++;
  }

  getState(): Readonly<CacheMetricsState> {
    return { ...this.state };
  }

  private recalculate(): void {
    if (this.state.totalRequests > 0) {
      this.state.hitRatio = this.state.hits / this.state.totalRequests;
    }
  }
}
