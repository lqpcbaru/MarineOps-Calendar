import type { ProviderConfig } from './provider-config';
import {
  ProviderError,
  ProviderTimeoutError,
  ProviderServerError,
  ProviderAuthenticationError,
  ProviderRateLimitError,
  ProviderConfigurationError,
  ProviderInvalidResponseError,
  ProviderUnavailableError,
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
        // Must be awaited here (not `return response.json()`) so a parse
        // failure is caught by this try/catch rather than escaping it —
        // returning the bare promise would let it reject after this
        // function's own try/catch has already exited.
        return (await response.json()) as T;
      }

      void (await response.text().catch(() => ''));

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
      // Errors we've already classified below (401/403/404/429/5xx, or a
      // config error from resolveApiKey) — propagate as-is.
      if (error instanceof ProviderError) {
        throw error;
      }
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new ProviderTimeoutError(this.config.providerName, this.config.timeoutMs);
      }
      if (error instanceof SyntaxError) {
        throw new ProviderInvalidResponseError(this.config.providerName, 'malformed JSON response');
      }
      // Anything else here is a raw network failure (DNS, connection
      // refused, TLS) that fetch() rejects with rather than an HTTP error
      // response — classify it so it surfaces as a 503 upstream failure
      // instead of an opaque internal 500.
      throw new ProviderUnavailableError(
        this.config.providerName,
        error instanceof Error ? error : undefined,
      );
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
      throw new ProviderConfigurationError(
        this.config.providerName,
        `API key '${this.config.apiKeyEnvVar}' tidak dijumpai dalam environment`,
      );
    }
    return key;
  }
}
