import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createRole, deleteRole, listRoles, updateRole } from './roles.api';
import { clearAccessToken, setAccessToken } from '../../shared/api/session';
import { resetRefreshStateForTests } from '../../shared/api/http';

const MOCK_ROLE = {
  id: 'r-1',
  name: 'Admin',
  permissionCodes: ['user.manage', 'role.manage'],
  createdAt: '2026-08-01T00:00:00.000Z',
  updatedAt: '2026-08-01T00:00:00.000Z',
};

function ok(body: unknown): Response {
  return { ok: true, status: 200, json: async () => body } as Response;
}

function lastCall() {
  const mock = globalThis.fetch as ReturnType<typeof vi.fn>;
  return { url: mock.mock.calls[0]![0] as string, init: mock.mock.calls[0]![1] as RequestInit };
}

describe('roles.api', () => {
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

  it('listRoles returns the bare array the API sends (not paginated)', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(ok([MOCK_ROLE]));

    const roles = await listRoles();

    expect(lastCall().url).toBe('/api/v1/roles');
    expect(roles).toHaveLength(1);
    expect(roles[0]!.permissionCodes).toContain('role.manage');
  });

  it('createRole POSTs name and permission codes', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(ok(MOCK_ROLE));

    await createRole({ name: 'Auditor', permissionCodes: ['audit.read'] });

    const { url, init } = lastCall();
    expect(url).toBe('/api/v1/roles');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual({
      name: 'Auditor',
      permissionCodes: ['audit.read'],
    });
  });

  it('updateRole PATCHes the permission set', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(ok(MOCK_ROLE));

    await updateRole('r-1', { permissionCodes: ['audit.read', 'station.read'] });

    const { url, init } = lastCall();
    expect(url).toBe('/api/v1/roles/r-1');
    expect(init.method).toBe('PATCH');
  });

  it('deleteRole surfaces the 409 raised when the role still has users', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({
        code: 'ROLE_HAS_USERS',
        message: 'Peranan masih digunakan oleh 3 pengguna',
      }),
    } as unknown as Response);

    await expect(deleteRole('r-1')).rejects.toThrow('Peranan masih digunakan oleh 3 pengguna');
  });

  it('deleteRole resolves on 204', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, status: 204 } as Response);
    await expect(deleteRole('r-1')).resolves.toBeUndefined();
  });
});
