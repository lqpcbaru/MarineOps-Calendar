import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createUser, disableUser, listUsers, updateUser } from './users.api';
import { clearAccessToken, setAccessToken } from '../../shared/api/session';
import { resetRefreshStateForTests } from '../../shared/api/http';

const MOCK_LIST = {
  users: [
    {
      id: 'u-1',
      email: 'admin@marineops.local',
      name: 'System Admin',
      status: 'ACTIVE',
      timezone: 'UTC',
      locale: 'en',
      roleIds: ['r-1'],
      createdAt: '2026-08-01T00:00:00.000Z',
      updatedAt: '2026-08-01T00:00:00.000Z',
    },
  ],
  total: 1,
  page: 1,
  pageSize: 20,
};

function ok(body: unknown): Response {
  return { ok: true, status: 200, json: async () => body } as Response;
}

function lastCall() {
  const mock = globalThis.fetch as ReturnType<typeof vi.fn>;
  return {
    url: mock.mock.calls[0]![0] as string,
    init: mock.mock.calls[0]![1] as RequestInit,
  };
}

describe('users.api', () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    setAccessToken('test-token');
    resetRefreshStateForTests();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    clearAccessToken();
    resetRefreshStateForTests();
  });

  describe('listUsers', () => {
    it('calls the admin endpoint and returns the paginated result', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue(ok(MOCK_LIST));

      const result = await listUsers({ page: 2, pageSize: 20 });

      expect(lastCall().url).toBe('/api/v1/users?page=2&pageSize=20');
      expect(result.users[0]!.email).toBe('admin@marineops.local');
      expect(result.total).toBe(1);
    });

    it('omits empty filters rather than sending status=', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue(ok(MOCK_LIST));

      await listUsers({ page: 1, status: '', search: undefined });

      expect(lastCall().url).toBe('/api/v1/users?page=1');
    });

    it('passes search and status through when set', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue(ok(MOCK_LIST));

      await listUsers({ search: 'admin', status: 'DISABLED' });

      expect(lastCall().url).toBe('/api/v1/users?status=DISABLED&search=admin');
    });

    it('surfaces a BM failure message', async () => {
      globalThis.fetch = vi
        .fn()
        .mockResolvedValue({
          ok: false,
          status: 500,
          json: async () => ({}),
        } as unknown as Response);

      await expect(listUsers()).rejects.toThrow(/Gagal mendapatkan senarai pengguna/);
    });
  });

  describe('createUser', () => {
    it('POSTs the create payload', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue(ok(MOCK_LIST.users[0]));

      await createUser({
        email: 'new@marineops.local',
        name: 'New User',
        password: 'password123',
        roleIds: ['r-1'],
      });

      const { url, init } = lastCall();
      expect(url).toBe('/api/v1/users');
      expect(init.method).toBe('POST');
      expect(JSON.parse(init.body as string)).toEqual({
        email: 'new@marineops.local',
        name: 'New User',
        password: 'password123',
        roleIds: ['r-1'],
      });
    });

    it('surfaces the API 409 message for a duplicate email', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 409,
        json: async () => ({ code: 'USER_EMAIL_EXISTS', message: 'E-mel sudah digunakan' }),
      } as unknown as Response);

      await expect(
        createUser({ email: 'dup@x.com', name: 'Dup', password: 'password123', roleIds: ['r-1'] }),
      ).rejects.toThrow('E-mel sudah digunakan');
    });
  });

  describe('updateUser', () => {
    it('PATCHes only the updatable fields', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue(ok(MOCK_LIST.users[0]));

      await updateUser('u-1', { name: 'Renamed', roleIds: ['r-2'] });

      const { url, init } = lastCall();
      expect(url).toBe('/api/v1/users/u-1');
      expect(init.method).toBe('PATCH');
      const body = JSON.parse(init.body as string) as Record<string, unknown>;
      // The API's updateUserCommandSchema accepts neither of these.
      expect(body).not.toHaveProperty('email');
      expect(body).not.toHaveProperty('password');
    });

    it('encodes the id into the path', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue(ok(MOCK_LIST.users[0]));
      await updateUser('a/b?c', { name: 'X' });
      expect(lastCall().url).toBe('/api/v1/users/a%2Fb%3Fc');
    });
  });

  describe('disableUser', () => {
    it('DELETEs and tolerates a 204 with no body', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, status: 204 } as Response);

      await expect(disableUser('u-1')).resolves.toBeUndefined();

      const { url, init } = lastCall();
      expect(url).toBe('/api/v1/users/u-1');
      expect(init.method).toBe('DELETE');
    });
  });
});
