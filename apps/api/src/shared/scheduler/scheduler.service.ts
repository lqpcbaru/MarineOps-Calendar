import type { RefreshJobState, JobPriority } from './refresh-job';
import { SchedulerLock } from './scheduler-lock';
import { SchedulerMetrics } from './scheduler-metrics';
import { SchedulerHealth } from './scheduler-health';

type JobRunner = () => Promise<void>;

interface RegisteredJob {
  state: RefreshJobState;
  runner: JobRunner;
  lastRequestTime: number;
}

const PRIORITY_ORDER: Record<JobPriority, number> = {
  HIGH: 0,
  NORMAL: 1,
  LOW: 2,
};

export class SchedulerService {
  private jobs = new Map<string, RegisteredJob>();
  private lock = new SchedulerLock();
  public readonly metrics = new SchedulerMetrics();
  public readonly health = new SchedulerHealth(this.metrics);

  register(state: RefreshJobState, runner: JobRunner): void {
    this.jobs.set(state.id, { state, runner, lastRequestTime: 0 });
  }

  remove(jobId: string): boolean {
    return this.jobs.delete(jobId);
  }

  enable(jobId: string): void {
    const job = this.jobs.get(jobId);
    if (job) job.state.enabled = true;
  }

  disable(jobId: string): void {
    const job = this.jobs.get(jobId);
    if (job) job.state.enabled = false;
  }

  getJob(jobId: string): RefreshJobState | undefined {
    return this.jobs.get(jobId)?.state;
  }

  getAllJobs(): RefreshJobState[] {
    return [...this.jobs.values()].map((j) => j.state);
  }

  async execute(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job) return;
    if (!job.state.enabled) return;

    if (!this.lock.acquire(jobId)) {
      job.state.status = 'SKIPPED';
      this.metrics.recordSkipped();
      return;
    }

    const now = Date.now();
    const minIntervalMs = (60_000 / job.state.rateLimitPerMinute);
    if (now - job.lastRequestTime < minIntervalMs) {
      job.state.status = 'SKIPPED';
      this.metrics.recordSkipped();
      this.lock.release(jobId);
      return;
    }

    job.state.status = 'RUNNING';
    job.state.retryCount = 0;
    this.metrics.recordStart();
    const start = Date.now();

    try {
      await job.runner();
      job.state.status = 'SUCCEEDED';
      job.state.lastError = null;
      job.state.lastRun = new Date();
      this.metrics.recordSuccess(Date.now() - start);
    } catch (error) {
      job.state.retryCount++;
      this.metrics.recordRetries(1);

      let success = false;
      for (let i = 1; i < job.state.maxRetries && !success; i++) {
        try {
          await job.runner();
          success = true;
          this.metrics.recordRetries(1);
        } catch {
          job.state.retryCount++;
          this.metrics.recordRetries(1);
        }
      }

      if (success) {
        job.state.status = 'SUCCEEDED';
        job.state.lastError = null;
        job.state.lastRun = new Date();
        this.metrics.recordSuccess(Date.now() - start);
      } else {
        job.state.status = 'FAILED';
        job.state.lastError = error instanceof Error ? error.message : 'unknown';
        this.metrics.recordFailure(Date.now() - start);
      }
    } finally {
      job.lastRequestTime = Date.now();
      job.state.nextRun = new Date(Date.now() + job.state.intervalMs);
      this.lock.release(jobId);
    }
  }

  async executeAll(): Promise<void> {
    const sorted = [...this.jobs.values()]
      .filter((j) => j.state.enabled)
      .sort((a, b) => PRIORITY_ORDER[a.state.priority] - PRIORITY_ORDER[b.state.priority]);

    for (const job of sorted) {
      await this.execute(job.state.id);
    }
  }
}
