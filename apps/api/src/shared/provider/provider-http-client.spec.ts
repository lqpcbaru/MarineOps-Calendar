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
import { errorResponse, jsonResponse } from './test-responses';

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
    globalThis.fetch = vi.fn().mockResolvedValue(jsonResponse({ hello: 'world' }, 200));

    const client = createClient();
    await expect(client.get('/path')).resolves.toEqual({ hello: 'world' });
  });

  it('throws ProviderAuthenticationError on 401/403', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(errorResponse(401, 'Unauthorized'));
    await expect(createClient().get('/path')).rejects.toBeInstanceOf(ProviderAuthenticationError);
  });

  it('throws ProviderRateLimitError on 429', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(errorResponse(429, 'Too many requests'));
    await expect(createClient().get('/path')).rejects.toBeInstanceOf(ProviderRateLimitError);
  });

  it('throws ProviderServerError on 5xx', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(errorResponse(503, 'Service unavailable'));
    await expect(createClient().get('/path')).rejects.toBeInstanceOf(ProviderServerError);
  });

  it('throws ProviderTimeoutError when the request is aborted', async () => {
    globalThis.fetch = vi
      .fn()
      .mockRejectedValue(new DOMException('The operation was aborted', 'AbortError'));
    await expect(createClient().get('/path')).rejects.toBeInstanceOf(ProviderTimeoutError);
  });

  it('throws ProviderInvalidResponseError on malformed JSON in an ok response', async () => {
    // Real malformed body rather than a stubbed json() that throws: the
    // client parses the body itself, so this exercises the actual path.
    globalThis.fetch = vi.fn().mockResolvedValue(new Response('{"data": [', { status: 200 }));
    await expect(createClient().get('/path')).rejects.toBeInstanceOf(ProviderInvalidResponseError);
  });

  // response.json() buffers whatever the upstream sends, with no limit, so
  // a provider that misbehaves can push this process into memory
  // exhaustion from the outside. The cap is enforced while reading rather
  // than after, so the memory is never allocated in the first place.
  it('refuses an upstream response larger than the size cap', async () => {
    const oversized = 'x'.repeat(11 * 1024 * 1024);
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ pad: oversized }), { status: 200 }));

    await expect(createClient().get('/path')).rejects.toBeInstanceOf(ProviderInvalidResponseError);
  });

  it('accepts a response comfortably under the cap', async () => {
    const payload = { pad: 'x'.repeat(64 * 1024) };
    globalThis.fetch = vi.fn().mockResolvedValue(jsonResponse(payload, 200));

    await expect(createClient().get('/path')).resolves.toEqual(payload);
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
