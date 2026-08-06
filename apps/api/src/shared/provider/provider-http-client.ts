import type { ProviderConfig } from './provider-config';
import { ProviderTimeoutError, ProviderServerError } from './provider-error';

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

      if (response.status >= 500) {
        throw new ProviderServerError(this.config.providerName, response.status);
      }

      if (!response.ok) {
        void await response.text().catch(() => '');
        throw new ProviderServerError(this.config.providerName, response.status);
      }

      return response.json() as Promise<T>;
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
      throw new Error(`API key '${this.config.apiKeyEnvVar}' tidak dijumpai dalam environment`);
    }
    return key;
  }
}
