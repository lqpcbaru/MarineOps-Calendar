import '@testing-library/jest-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { UsersPage } from './UsersPage';
import { clearAccessToken, setAccessToken } from '../../shared/api/session';
import { resetRefreshStateForTests } from '../../shared/api/http';

const ROLES = [
  {
    id: 'r-admin',
    name: 'Admin',
    permissionCodes: ['user.manage'],
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 'r-officer',
    name: 'FisheriesOfficer',
    permissionCodes: ['station.read'],
    createdAt: '',
    updatedAt: '',
  },
];

const USER = {
  id: 'u-1',
  email: 'admin@marineops.local',
  name: 'System Admin',
  status: 'ACTIVE' as const,
  timezone: 'UTC',
  locale: 'en',
  roleIds: ['r-admin'],
  createdAt: '2026-08-01T00:00:00.000Z',
  updatedAt: '2026-08-01T00:00:00.000Z',
};

function ok(body: unknown): Response {
  return { ok: true, status: 200, json: async () => body } as Response;
}

interface Recorded {
  url: string;
  method: string;
  body: unknown;
}

/**
 * Routes requests the way the real API does, so the page is exercised
 * against actual endpoint shapes rather than a single blanket stub.
 */
function installApi(overrides: { onWrite?: (r: Recorded) => Response } = {}) {
  const recorded: Recorded[] = [];

  globalThis.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = init?.method ?? 'GET';
    const body = init?.body ? JSON.parse(init.body as string) : undefined;

    if (method !== 'GET') {
      recorded.push({ url, method, body });
      return overrides.onWrite?.({ url, method, body }) ?? ok(USER);
    }
    if (url.startsWith('/api/v1/roles')) return ok(ROLES);
    if (url.startsWith('/api/v1/users')) {
      return ok({ users: [USER], total: 1, page: 1, pageSize: 20 });
    }
    return ok({});
  }) as unknown as typeof globalThis.fetch;

  return recorded;
}

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <UsersPage />
    </QueryClientProvider>,
  );
}

describe('UsersPage', () => {
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

  it('lists users and resolves role ids to role names', async () => {
    installApi();
    renderPage();

    expect(await screen.findByText('System Admin')).toBeInTheDocument();
    expect(screen.getByText('admin@marineops.local')).toBeInTheDocument();

    // Scope to the table: "Admin"/"Aktif" also appear in the filter <select>.
    const row = screen.getByText('System Admin').closest('tr')!;
    // The list endpoint returns roleIds; the name comes from /roles.
    expect(within(row).getByText('Admin')).toBeInTheDocument();
    expect(within(row).getByText('Aktif')).toBeInTheDocument();
  });

  it('never renders a password hash even if the API were to leak one', async () => {
    globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.startsWith('/api/v1/roles')) return ok(ROLES);
      return ok({
        users: [{ ...USER, passwordHash: 'argon2id$leaked-hash' }],
        total: 1,
        page: 1,
        pageSize: 20,
      });
    }) as unknown as typeof globalThis.fetch;

    renderPage();
    await screen.findByText('System Admin');

    expect(document.body.textContent).not.toContain('argon2id$leaked-hash');
  });

  it('creates a user with the selected roles', async () => {
    const recorded = installApi();
    renderPage();
    await screen.findByText('System Admin');

    await userEvent.click(screen.getByRole('button', { name: 'Tambah Pengguna' }));

    const dialog = await screen.findByRole('dialog');
    await userEvent.type(within(dialog).getByLabelText('E-mel'), 'new@marineops.local');
    await userEvent.type(within(dialog).getByLabelText('Nama'), 'New User');
    await userEvent.type(within(dialog).getByLabelText('Kata Laluan'), 'password123');
    await userEvent.click(within(dialog).getByLabelText('FisheriesOfficer'));
    await userEvent.click(within(dialog).getByRole('button', { name: 'Simpan' }));

    await waitFor(() => expect(recorded).toHaveLength(1));
    expect(recorded[0]).toMatchObject({
      url: '/api/v1/users',
      method: 'POST',
      body: {
        email: 'new@marineops.local',
        name: 'New User',
        password: 'password123',
        roleIds: ['r-officer'],
      },
    });
  });

  it('refuses to submit a user with no role (the API requires at least one)', async () => {
    const recorded = installApi();
    renderPage();
    await screen.findByText('System Admin');

    await userEvent.click(screen.getByRole('button', { name: 'Tambah Pengguna' }));
    const dialog = await screen.findByRole('dialog');
    await userEvent.type(within(dialog).getByLabelText('E-mel'), 'x@y.com');
    await userEvent.type(within(dialog).getByLabelText('Nama'), 'X');
    await userEvent.type(within(dialog).getByLabelText('Kata Laluan'), 'password123');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Simpan' }));

    expect(await within(dialog).findByRole('alert')).toHaveTextContent(/satu peranan diperlukan/);
    expect(recorded).toHaveLength(0);
  });

  it('edits a user without sending email or password', async () => {
    const recorded = installApi();
    renderPage();
    await screen.findByText('System Admin');

    await userEvent.click(screen.getByRole('button', { name: 'Sunting' }));
    const dialog = await screen.findByRole('dialog');

    const nameInput = within(dialog).getByLabelText('Nama');
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, 'Renamed Admin');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Simpan' }));

    await waitFor(() => expect(recorded).toHaveLength(1));
    expect(recorded[0]!.method).toBe('PATCH');
    expect(recorded[0]!.url).toBe('/api/v1/users/u-1');
    expect(recorded[0]!.body).not.toHaveProperty('email');
    expect(recorded[0]!.body).not.toHaveProperty('password');
  });

  it('requires confirmation before disabling a user', async () => {
    const recorded = installApi({
      onWrite: () => ({ ok: true, status: 204 }) as Response,
    });
    renderPage();
    await screen.findByText('System Admin');

    await userEvent.click(screen.getByRole('button', { name: 'Nyahaktif' }));

    // Nothing may be sent until the operator confirms.
    expect(recorded).toHaveLength(0);
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveTextContent(/tidak akan dapat log masuk/);

    await userEvent.click(within(dialog).getByRole('button', { name: 'Nyahaktifkan' }));

    await waitFor(() => expect(recorded).toHaveLength(1));
    expect(recorded[0]).toMatchObject({ url: '/api/v1/users/u-1', method: 'DELETE' });
  });

  it('cancelling the confirmation sends nothing', async () => {
    const recorded = installApi();
    renderPage();
    await screen.findByText('System Admin');

    await userEvent.click(screen.getByRole('button', { name: 'Nyahaktif' }));
    const dialog = await screen.findByRole('dialog');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Batal' }));

    expect(recorded).toHaveLength(0);
  });

  it('shows the API error message when the list request fails', async () => {
    globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
      if (String(input).startsWith('/api/v1/roles')) return ok(ROLES);
      return {
        ok: false,
        status: 500,
        json: async () => ({ message: 'Pangkalan data tidak dapat dihubungi' }),
      } as unknown as Response;
    }) as unknown as typeof globalThis.fetch;

    renderPage();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Pangkalan data tidak dapat dihubungi',
    );
  });

  it('shows an empty state when no users match', async () => {
    globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
      if (String(input).startsWith('/api/v1/roles')) return ok(ROLES);
      return ok({ users: [], total: 0, page: 1, pageSize: 20 });
    }) as unknown as typeof globalThis.fetch;

    renderPage();

    expect(await screen.findByText(/Tiada pengguna sepadan/)).toBeInTheDocument();
  });

  it('surfaces a duplicate-email conflict from the API in the form', async () => {
    installApi({
      onWrite: () =>
        ({
          ok: false,
          status: 409,
          json: async () => ({ code: 'USER_EMAIL_EXISTS', message: 'E-mel sudah digunakan' }),
        }) as unknown as Response,
    });
    renderPage();
    await screen.findByText('System Admin');

    await userEvent.click(screen.getByRole('button', { name: 'Tambah Pengguna' }));
    const dialog = await screen.findByRole('dialog');
    await userEvent.type(within(dialog).getByLabelText('E-mel'), 'dup@marineops.local');
    await userEvent.type(within(dialog).getByLabelText('Nama'), 'Dup');
    await userEvent.type(within(dialog).getByLabelText('Kata Laluan'), 'password123');
    await userEvent.click(within(dialog).getByLabelText('Admin'));
    await userEvent.click(within(dialog).getByRole('button', { name: 'Simpan' }));

    expect(await within(dialog).findByRole('alert')).toHaveTextContent('E-mel sudah digunakan');
  });
});
