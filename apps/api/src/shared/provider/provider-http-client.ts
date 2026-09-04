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

/**
 * Hard ceiling on an upstream response body, in bytes.
 *
 * response.json() buffers whatever the upstream sends with no limit, so a
 * provider that misbehaves — or is redirected to something large — can
 * push the API into memory exhaustion from outside. None of the real
 * responses come close to this: the largest is a multi-day forecast for
 * one station, a few hundred kilobytes at most. 10 MB is far above any
 * legitimate payload and far below anything that threatens the process.
 */
const MAX_RESPONSE_BYTES = 10 * 1024 * 1024;

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
        return JSON.parse(await this.readCappedText(response)) as T;
      }

      void (await this.readCappedText(response).catch(() => ''));

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

  /**
   * Reads the body as text, aborting once MAX_RESPONSE_BYTES is exceeded
   * rather than after the fact — checking the length of an already-buffered
   * string would mean the memory has been allocated before the limit is
   * noticed, which is the thing being prevented. Content-Length is not
   * trusted for this: it is absent on chunked responses and is attacker-
   * controlled where it is present, so the running total is what enforces
   * the cap.
   */
  private async readCappedText(response: Response): Promise<string> {
    const body = response.body;
    if (!body) return '';

    const reader = body.getReader();
    const decoder = new TextDecoder();
    const chunks: string[] = [];
    let total = 0;

    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        total += value.byteLength;
        if (total > MAX_RESPONSE_BYTES) {
          throw new ProviderInvalidResponseError(
            this.config.providerName,
            `respons melebihi ${MAX_RESPONSE_BYTES} bait`,
          );
        }
        chunks.push(decoder.decode(value, { stream: true }));
      }
    } finally {
      // Releases the connection when we bail out early; a reader left
      // locked would hold the socket for the rest of the process.
      await reader.cancel().catch(() => undefined);
    }

    chunks.push(decoder.decode());
    return chunks.join('');
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
