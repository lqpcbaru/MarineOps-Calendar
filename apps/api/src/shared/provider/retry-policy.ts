import { isRetryableError } from './provider-error';
import type { ProviderMetrics } from './provider-metrics';
import type { ProviderLogger } from './provider-logger';

export interface RetryPolicyConfig {
  maxRetries: number;
  baseDelayMs: number;
}

export class RetryPolicy {
  constructor(private readonly config: RetryPolicyConfig) {}

  async execute<T>(
    fn: () => Promise<T>,
    providerName: string,
    logger?: ProviderLogger,
    metrics?: ProviderMetrics,
  ): Promise<T> {
    let lastError: Error | null = null;
    let retries = 0;

    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (!isRetryableError(lastError)) {
          throw lastError;
        }

        if (attempt < this.config.maxRetries) {
          retries++;
          const delay = this.calculateDelay(attempt);
          logger?.requestRetry(providerName, attempt, lastError.message);
          await this.sleep(delay);
        }
      }
    }

    metrics?.recordRetries(retries);
    throw lastError!;
  }

  calculateDelay(attempt: number): number {
    return this.config.baseDelayMs * Math.pow(2, attempt - 1);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
