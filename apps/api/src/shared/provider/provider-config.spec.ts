import { describe, expect, it } from 'vitest';
import { createProviderConfig } from './provider-config';

describe('ProviderConfig', () => {
  it('creates config with defaults', () => {
    const config = createProviderConfig({
      providerName: 'TestProvider',
      baseUrl: 'https://api.test.com',
      apiKeyEnvVar: 'TEST_API_KEY',
    });

    expect(config.providerName).toBe('TestProvider');
    expect(config.baseUrl).toBe('https://api.test.com');
    expect(config.timeoutMs).toBe(10_000);
    expect(config.maxRetries).toBe(3);
    expect(config.retryDelayMs).toBe(1_000);
    expect(config.headers['User-Agent']).toBe('MarineOps-Hub/2.1');
  });

  it('allows overriding defaults', () => {
    const config = createProviderConfig({
      providerName: 'Custom',
      baseUrl: 'https://custom.api',
      apiKeyEnvVar: 'KEY',
      timeoutMs: 5_000,
      maxRetries: 1,
    });

    expect(config.timeoutMs).toBe(5_000);
    expect(config.maxRetries).toBe(1);
  });
});
