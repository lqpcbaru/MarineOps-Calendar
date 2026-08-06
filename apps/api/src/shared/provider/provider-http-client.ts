import type { ProviderConfig } from './provider-config';
import {
  ProviderTimeoutError,
  ProviderServerError,
  ProviderAuthenticationError,
  ProviderRateLimitError,
  ProviderConfigurationError,
} from './provider-error';

export class ProviderHttpClient {
  constructor(private readonly config: ProviderConfig) {}

  async get<T>(path: string, query?: Record<string, string>): Promise<T> {
    const url = this.buildUrl(path, query);
    const apiKey = this.resolveApiKey();

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.config.timeoutMs);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          ...this.config.headers,
          ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
        },
        signal: controller.signal,
      });

      if (response.ok) {
        return response.json() as Promise<T>;
      }

      void await response.text().catch(() => '');

      switch (response.status) {
        case 401:
        case 403:
          throw new ProviderAuthenticationError(this.config.providerName, response.status);
        case 404:
          throw new ProviderServerError(this.config.providerName, 404);
        case 429:
          throw new ProviderRateLimitError(this.config.providerName);
        default:
          if (response.status >= 500) {
            throw new ProviderServerError(this.config.providerName, response.status);
          }
          throw new ProviderServerError(this.config.providerName, response.status);
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new ProviderTimeoutError(this.config.providerName, this.config.timeoutMs);
      }
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }

  private buildUrl(path: string, query?: Record<string, string>): string {
    const url = new URL(path, this.config.baseUrl);
    if (query) {
      for (const [key, value] of Object.entries(query)) {
        url.searchParams.set(key, value);
      }
    }
    return url.toString();
  }

  private resolveApiKey(): string | null {
    const key = process.env[this.config.apiKeyEnvVar];
    if (!key) {
      throw new ProviderConfigurationError(this.config.providerName, `API key '${this.config.apiKeyEnvVar}' tidak dijumpai dalam environment`);
    }
    return key;
  }
}
