import { describe, expect, it } from 'vitest';
import { RetryPolicy } from './retry-policy';
import { ProviderAuthenticationError, ProviderRateLimitError, ProviderServerError } from './provider-error';

describe('RetryPolicy', () => {
  it('executes successfully on first attempt', async () => {
    const policy = new RetryPolicy({ maxRetries: 3, baseDelayMs: 100 });
    let calls = 0;
    const result = await policy.execute(async () => {
      calls++;
      return 'ok';
    }, 'test');
    expect(result).toBe('ok');
    expect(calls).toBe(1);
  });

  it('retries on retryable error and succeeds', async () => {
    const policy = new RetryPolicy({ maxRetries: 3, baseDelayMs: 10 });
    let calls = 0;
    const result = await policy.execute(async () => {
      calls++;
      if (calls < 3) throw new ProviderServerError('test', 500);
      return 'ok';
    }, 'test');
    expect(result).toBe('ok');
    expect(calls).toBe(3);
  });

  it('throws after max retries on retryable error', async () => {
    const policy = new RetryPolicy({ maxRetries: 2, baseDelayMs: 10 });
    await expect(policy.execute(async () => {
      throw new ProviderRateLimitError('test', '60');
    }, 'test')).rejects.toBeInstanceOf(ProviderRateLimitError);
  });

  it('does not retry authentication errors', async () => {
    const policy = new RetryPolicy({ maxRetries: 3, baseDelayMs: 10 });
    let calls = 0;
    await expect(policy.execute(async () => {
      calls++;
      throw new ProviderAuthenticationError('test', 401);
    }, 'test')).rejects.toBeInstanceOf(ProviderAuthenticationError);
    expect(calls).toBe(1);
  });

  it('calculates exponential delay', () => {
    const policy = new RetryPolicy({ maxRetries: 3, baseDelayMs: 1000 });
    expect(policy.calculateDelay(1)).toBe(1000);
    expect(policy.calculateDelay(2)).toBe(2000);
    expect(policy.calculateDelay(3)).toBe(4000);
  });
});
