export interface ProviderConfig {
  providerName: string;
  baseUrl: string;
  timeoutMs: number;
  maxRetries: number;
  retryDelayMs: number;
  headers: Record<string, string>;
  apiKeyEnvVar: string;
}

export function createProviderConfig(overrides: Partial<ProviderConfig> & { providerName: string; baseUrl: string; apiKeyEnvVar: string }): ProviderConfig {
  return {
    timeoutMs: 10_000,
    maxRetries: 3,
    retryDelayMs: 1_000,
    headers: { 'Accept': 'application/json', 'User-Agent': 'MarineOps-Hub/2.1' },
    ...overrides,
  };
}
