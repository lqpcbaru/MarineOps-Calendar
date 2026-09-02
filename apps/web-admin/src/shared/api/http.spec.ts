import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { apiRequest, ApiError, buildQuery, resetRefreshStateForTests } from './http';
import { clearAccessToken, getAccessToken, onSessionEnded, setAccessToken } from './session';

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

function errorResponse(status: number, body: unknown = {}): Response {
  return { ok: false, status, json: async () => body } as unknown as Response;
}

describe('apiRequest', () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    clearAccessToken();
    onSessionEnded(null);
    resetRefreshStateForTests();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    clearAccessToken();
    onSessionEnded(null);
    resetRefreshStateForTests();
  });

  it('sends the in-memory access token as a Bearer header', async () => {
    setAccessToken('token-abc');
    globalThis.fetch = vi.fn().mockResolvedValue(jsonResponse({ ok: true }));

    await apiRequest('/api/v1/users');

    const init = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]![1] as RequestInit;
    expect((init.headers as Record<string, string>)['Authorization']).toBe('Bearer token-abc');
  });

  it('sends same-origin credentials so the httpOnly refresh cookie is attached', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(jsonResponse({}));

    await apiRequest('/api/v1/roles');

    const init = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]![1] as RequestInit;
    expect(init.credentials).toBe('same-origin');
  });

  it('returns undefined for 204 rather than trying to parse a body', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, status: 204 } as Response);
    await expect(apiRequest('/api/v1/users/u1', { method: 'DELETE' })).resolves.toBeUndefined();
  });

  it("surfaces the API's own error message from the envelope", async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(
        errorResponse(409, { code: 'ROLE_HAS_USERS', message: 'Peranan masih digunakan' }),
      );

    await expect(apiRequest('/api/v1/roles/r1', { method: 'DELETE' })).rejects.toThrow(
      'Peranan masih digunakan',
    );
  });

  it('exposes status and code on ApiError, and flags 403 as forbidden', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(errorResponse(403, { code: 'AUTH_FORBIDDEN' }));

    const error = await apiRequest('/api/v1/users').catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(403);
    expect((error as ApiError).isForbidden).toBe(true);
  });

  describe('401 handling', () => {
    it('silently refreshes once and replays the original request', async () => {
      setAccessToken('expired-token');
      const calls: string[] = [];

      globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        calls.push(url);
        if (url === '/api/v1/auth/refresh') return jsonResponse({ accessToken: 'fresh-token' });
        // First protected call 401s; the replay (after refresh) succeeds.
        if (calls.filter((c) => c === '/api/v1/users').length === 1) return errorResponse(401);
        return jsonResponse({ users: [] });
      }) as unknown as typeof globalThis.fetch;

      const result = await apiRequest<{ users: unknown[] }>('/api/v1/users');

      expect(result).toEqual({ users: [] });
      expect(calls).toEqual(['/api/v1/users', '/api/v1/auth/refresh', '/api/v1/users']);
      expect(getAccessToken()).toBe('fresh-token');
    });

    it('ends the session when the refresh also fails', async () => {
      setAccessToken('expired-token');
      const onEnded = vi.fn();
      onSessionEnded(onEnded);

      globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
        if (String(input) === '/api/v1/auth/refresh') return errorResponse(401);
        return errorResponse(401);
      }) as unknown as typeof globalThis.fetch;

      await expect(apiRequest('/api/v1/users')).rejects.toThrow(/Sesi tamat/);
      expect(onEnded).toHaveBeenCalledTimes(1);
      expect(getAccessToken()).toBeNull();
    });

    it('does not retry more than once (no infinite refresh loop)', async () => {
      setAccessToken('expired-token');
      let protectedCalls = 0;

      globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
        if (String(input) === '/api/v1/auth/refresh') return jsonResponse({ accessToken: 'new' });
        protectedCalls++;
        return errorResponse(401);
      }) as unknown as typeof globalThis.fetch;

      await expect(apiRequest('/api/v1/users')).rejects.toBeInstanceOf(ApiError);
      // Original + exactly one replay.
      expect(protectedCalls).toBe(2);
    });

    it('refreshes only once for concurrent 401s (rotation would revoke the family)', async () => {
      setAccessToken('expired-token');
      let refreshCalls = 0;
      const failedOnce = new Set<string>();

      globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url === '/api/v1/auth/refresh') {
          refreshCalls++;
          return jsonResponse({ accessToken: 'fresh-token' });
        }
        if (!failedOnce.has(url)) {
          failedOnce.add(url);
          return errorResponse(401);
        }
        return jsonResponse({ ok: true });
      }) as unknown as typeof globalThis.fetch;

      await Promise.all([
        apiRequest('/api/v1/users'),
        apiRequest('/api/v1/roles'),
        apiRequest('/api/v1/stations'),
      ]);

      expect(refreshCalls).toBe(1);
    });

    it('does not attempt a refresh for a failed login', async () => {
      let refreshCalls = 0;
      globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
        if (String(input) === '/api/v1/auth/refresh') refreshCalls++;
        return errorResponse(401, { message: 'E-mel atau kata laluan tidak sah' });
      }) as unknown as typeof globalThis.fetch;

      await expect(
        apiRequest('/api/v1/auth/login', { method: 'POST', body: { email: 'a', password: 'b' } }),
      ).rejects.toThrow('E-mel atau kata laluan tidak sah');
      expect(refreshCalls).toBe(0);
    });
  });
});

describe('buildQuery', () => {
  it('omits undefined, null and empty values', () => {
    expect(buildQuery({ page: 1, search: '', status: undefined, regionId: null })).toBe('?page=1');
  });

  it('returns an empty string when nothing is set', () => {
    expect(buildQuery({ a: undefined })).toBe('');
  });

  it('encodes values', () => {
    expect(buildQuery({ search: 'a b&c' })).toBe('?search=a+b%26c');
  });
});
