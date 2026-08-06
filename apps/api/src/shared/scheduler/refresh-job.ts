export type JobStatus = 'PENDING' | 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'SKIPPED';
export type JobPriority = 'HIGH' | 'NORMAL' | 'LOW';

export interface RefreshJobConfig {
  id: string;
  name: string;
  provider: string;
  intervalMs: number;
  priority: JobPriority;
  maxRetries: number;
  rateLimitPerMinute: number;
  enabled: boolean;
}

export interface RefreshJobState {
  id: string;
  name: string;
  provider: string;
  enabled: boolean;
  priority: JobPriority;
  intervalMs: number;
  maxRetries: number;
  rateLimitPerMinute: number;
  lastRun: Date | null;
  nextRun: Date | null;
  status: JobStatus;
  retryCount: number;
  lastError: string | null;
}

export function createRefreshJob(config: RefreshJobConfig): RefreshJobState {
  return {
    id: config.id,
    name: config.name,
    provider: config.provider,
    enabled: config.enabled,
    priority: config.priority,
    intervalMs: config.intervalMs,
    maxRetries: config.maxRetries,
    rateLimitPerMinute: config.rateLimitPerMinute,
    lastRun: null,
    nextRun: config.enabled ? new Date() : null,
    status: 'PENDING',
    retryCount: 0,
    lastError: null,
  };
}
