import { isRetryableError } from './provider-error';

export interface RetryPolicyConfig {
  maxRetries: number;
  baseDelayMs: number;
}

export class RetryPolicy {
  constructor(private readonly config: RetryPolicyConfig) {}

  async execute<T>(fn: () => Promise<T>, _providerName: string): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (!isRetryableError(lastError)) {
          throw lastError;
        }

        if (attempt < this.config.maxRetries) {
          const delay = this.calculateDelay(attempt);
          await this.sleep(delay);
        }
      }
    }

    throw lastError!;
  }

  calculateDelay(attempt: number): number {
    return this.config.baseDelayMs * Math.pow(2, attempt - 1);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
