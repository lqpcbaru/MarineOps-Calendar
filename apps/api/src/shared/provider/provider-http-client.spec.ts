import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { ProviderHttpClient } from './provider-http-client';
import { createProviderConfig } from './provider-config';
import {
  ProviderAuthenticationError,
  ProviderRateLimitError,
  ProviderServerError,
  ProviderTimeoutError,
  ProviderInvalidResponseError,
  ProviderUnavailableError,
  ProviderConfigurationError,
} from './provider-error';

describe('ProviderHttpClient', () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    process.env['TEST_PROVIDER_API_KEY'] = 'test-token';
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    delete process.env['TEST_PROVIDER_API_KEY'];
  });

  function createClient(): ProviderHttpClient {
    return new ProviderHttpClient(
      createProviderConfig({
        providerName: 'TestProvider',
        baseUrl: 'https://example.invalid',
        apiKeyEnvVar: 'TEST_PROVIDER_API_KEY',
      }),
    );
  }

  it('returns parsed JSON on a 200 response', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ hello: 'world' }),
    } as Response);

    const client = createClient();
    await expect(client.get('/path')).resolves.toEqual({ hello: 'world' });
  });

  it('throws ProviderAuthenticationError on 401/403', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => 'Unauthorized',
    } as unknown as Response);
    await expect(createClient().get('/path')).rejects.toBeInstanceOf(ProviderAuthenticationError);
  });

  it('throws ProviderRateLimitError on 429', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      text: async () => 'Too many requests',
    } as unknown as Response);
    await expect(createClient().get('/path')).rejects.toBeInstanceOf(ProviderRateLimitError);
  });

  it('throws ProviderServerError on 5xx', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      text: async () => 'Service unavailable',
    } as unknown as Response);
    await expect(createClient().get('/path')).rejects.toBeInstanceOf(ProviderServerError);
  });

  it('throws ProviderTimeoutError when the request is aborted', async () => {
    globalThis.fetch = vi
      .fn()
      .mockRejectedValue(new DOMException('The operation was aborted', 'AbortError'));
    await expect(createClient().get('/path')).rejects.toBeInstanceOf(ProviderTimeoutError);
  });

  it('throws ProviderInvalidResponseError on malformed JSON in an ok response', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => {
        throw new SyntaxError('Unexpected token in JSON');
      },
    } as unknown as Response);
    await expect(createClient().get('/path')).rejects.toBeInstanceOf(ProviderInvalidResponseError);
  });

  it('throws ProviderUnavailableError on a raw network failure (DNS/connection refused)', async () => {
    // This is the shape Node's fetch (undici) actually rejects with for a
    // network-level failure — a bare TypeError, not a DOMException/AbortError.
    globalThis.fetch = vi.fn().mockRejectedValue(new TypeError('fetch failed'));
    const err = await createClient()
      .get('/path')
      .catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ProviderUnavailableError);
    expect((err as ProviderUnavailableError).originalError?.message).toBe('fetch failed');
  });

  it('throws ProviderConfigurationError when the API key env var is unset', async () => {
    delete process.env['TEST_PROVIDER_API_KEY'];
    await expect(createClient().get('/path')).rejects.toBeInstanceOf(ProviderConfigurationError);
  });
});
