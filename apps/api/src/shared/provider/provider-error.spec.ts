import { describe, expect, it } from 'vitest';
import {
  ProviderUnavailableError,
  ProviderTimeoutError,
  ProviderAuthenticationError,
  ProviderRateLimitError,
  ProviderInvalidResponseError,
  ProviderConfigurationError,
  ProviderServerError,
  isRetryableError,
} from './provider-error';

describe('ProviderError', () => {
  it('stores provider name and original error', () => {
    const original = new Error('network down');
    const err = new ProviderUnavailableError('TestProvider', original);
    expect(err.providerName).toBe('TestProvider');
    expect(err.originalError).toBe(original);
    expect(err.code).toBe('PROVIDER_UNAVAILABLE');
  });

  it('TimeoutError includes timeout value', () => {
    const err = new ProviderTimeoutError('TestProvider', 5000);
    expect(err.message).toContain('5000ms');
  });

  it('AuthenticationError includes status code', () => {
    const err = new ProviderAuthenticationError('TestProvider', 403);
    expect(err.message).toContain('403');
  });

  it('RateLimitError includes retry hint', () => {
    const err = new ProviderRateLimitError('TestProvider', '60');
    expect(err.message).toContain('60');
  });

  it('ConfigurationError includes detail', () => {
    const err = new ProviderConfigurationError('TestProvider', 'missing API key');
    expect(err.message).toContain('missing API key');
  });

  it('isRetryableError returns false for auth errors', () => {
    expect(isRetryableError(new ProviderAuthenticationError('t', 401))).toBe(false);
  });

  it('isRetryableError returns false for config errors', () => {
    expect(isRetryableError(new ProviderConfigurationError('t', 'bad'))).toBe(false);
  });

  it('isRetryableError returns false for invalid response errors', () => {
    expect(isRetryableError(new ProviderInvalidResponseError('t'))).toBe(false);
  });

  it('isRetryableError returns true for server/timeout/rate/unavailable', () => {
    expect(isRetryableError(new ProviderServerError('t', 500))).toBe(true);
    expect(isRetryableError(new ProviderTimeoutError('t', 1000))).toBe(true);
    expect(isRetryableError(new ProviderRateLimitError('t'))).toBe(true);
    expect(isRetryableError(new ProviderUnavailableError('t'))).toBe(true);
  });
});
