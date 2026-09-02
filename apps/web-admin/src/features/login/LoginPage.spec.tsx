import '@testing-library/jest-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  Outlet,
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router';
import { AuthProvider } from '../../shared/auth/auth-context';
import { LoginPage } from './LoginPage';
import { clearAccessToken, getAccessToken } from '../../shared/api/session';
import { resetRefreshStateForTests } from '../../shared/api/http';

const PRINCIPAL = {
  userId: 'u-1',
  email: 'admin@marineops.local',
  name: 'System Admin',
  roles: ['Admin'],
  permissionCodes: ['user.manage'],
};

function jsonResponse(body: unknown): Response {
  return { ok: true, status: 200, json: async () => body } as Response;
}
function errorResponse(status: number, body: unknown = {}): Response {
  return { ok: false, status, json: async () => body } as unknown as Response;
}

function renderLogin() {
  const rootRoute = createRootRoute({ component: () => <Outlet /> });
  const loginRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/login',
    component: LoginPage,
  });
  const dashboardRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/dashboard',
    component: () => <div>Papan Pemuka</div>,
  });

  const router = createRouter({
    routeTree: rootRoute.addChildren([loginRoute, dashboardRoute]),
    history: createMemoryHistory({ initialEntries: ['/login'] }),
  });

  return render(
    <AuthProvider>
      <RouterProvider router={router as never} />
    </AuthProvider>,
  );
}

describe('LoginPage', () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    clearAccessToken();
    resetRefreshStateForTests();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    clearAccessToken();
    resetRefreshStateForTests();
  });

  it('renders accessible, correctly-typed credential fields', async () => {
    globalThis.fetch = vi.fn(async () => errorResponse(401)) as unknown as typeof globalThis.fetch;

    renderLogin();

    const password = await screen.findByLabelText('Kata Laluan');
    expect(screen.getByLabelText('E-mel')).toHaveAttribute('type', 'email');
    // Must be a password input so the browser masks it and never autofills
    // it into a plain-text field.
    expect(password).toHaveAttribute('type', 'password');
    expect(password).toHaveAttribute('autocomplete', 'current-password');
  });

  it('logs in and redirects to the dashboard', async () => {
    globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url === '/api/v1/auth/refresh') return errorResponse(401);
      if (url === '/api/v1/auth/login') return jsonResponse({ accessToken: 'granted' });
      if (url === '/api/v1/auth/me') return jsonResponse(PRINCIPAL);
      return errorResponse(404);
    }) as unknown as typeof globalThis.fetch;

    renderLogin();

    await userEvent.type(await screen.findByLabelText('E-mel'), 'admin@marineops.local');
    await userEvent.type(screen.getByLabelText('Kata Laluan'), 'correct-horse-battery');
    await userEvent.click(screen.getByRole('button', { name: 'Log Masuk' }));

    await waitFor(() => expect(screen.getByText('Papan Pemuka')).toBeInTheDocument());
    expect(getAccessToken()).toBe('granted');
  });

  it('sends the typed credentials to the real login endpoint', async () => {
    // Both params are declared so the recorded call tuple is typed and the
    // request init (and therefore the body) can be asserted below.
    const fetchMock = vi.fn(async (input: RequestInfo | URL, _init?: RequestInit) => {
      const url = String(input);
      if (url === '/api/v1/auth/refresh') return errorResponse(401);
      if (url === '/api/v1/auth/login') return jsonResponse({ accessToken: 'granted' });
      if (url === '/api/v1/auth/me') return jsonResponse(PRINCIPAL);
      return errorResponse(404);
    });
    globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;

    renderLogin();
    await userEvent.type(await screen.findByLabelText('E-mel'), 'admin@marineops.local');
    await userEvent.type(screen.getByLabelText('Kata Laluan'), 'pw12345678');
    await userEvent.click(screen.getByRole('button', { name: 'Log Masuk' }));

    await waitFor(() => expect(getAccessToken()).toBe('granted'));

    const loginCall = fetchMock.mock.calls.find((c) => String(c[0]) === '/api/v1/auth/login');
    expect(loginCall).toBeDefined();
    expect(JSON.parse((loginCall![1] as RequestInit).body as string)).toEqual({
      email: 'admin@marineops.local',
      password: 'pw12345678',
    });
  });

  it("shows the API's message on invalid credentials and stays on the page", async () => {
    globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url === '/api/v1/auth/refresh') return errorResponse(401);
      if (url === '/api/v1/auth/login') {
        return errorResponse(401, {
          code: 'AUTH_INVALID_CREDENTIALS',
          message: 'E-mel atau kata laluan tidak sah',
        });
      }
      return errorResponse(404);
    }) as unknown as typeof globalThis.fetch;

    renderLogin();

    await userEvent.type(await screen.findByLabelText('E-mel'), 'admin@marineops.local');
    await userEvent.type(screen.getByLabelText('Kata Laluan'), 'wrong');
    await userEvent.click(screen.getByRole('button', { name: 'Log Masuk' }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('E-mel atau kata laluan tidak sah');
    expect(screen.queryByText('Papan Pemuka')).not.toBeInTheDocument();
    expect(getAccessToken()).toBeNull();
  });

  it('clears the password field after a failed attempt', async () => {
    globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url === '/api/v1/auth/refresh') return errorResponse(401);
      return errorResponse(401, { message: 'E-mel atau kata laluan tidak sah' });
    }) as unknown as typeof globalThis.fetch;

    renderLogin();

    const password = await screen.findByLabelText('Kata Laluan');
    await userEvent.type(await screen.findByLabelText('E-mel'), 'admin@marineops.local');
    await userEvent.type(password, 'wrong');
    await userEvent.click(screen.getByRole('button', { name: 'Log Masuk' }));

    await screen.findByRole('alert');
    expect(password).toHaveValue('');
  });

  it('surfaces the login rate limit rather than a generic failure', async () => {
    globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url === '/api/v1/auth/refresh') return errorResponse(401);
      return errorResponse(429, {
        code: 'RATE_LIMITED',
        message: 'Terlalu banyak percubaan log masuk. Sila cuba semula kemudian.',
      });
    }) as unknown as typeof globalThis.fetch;

    renderLogin();

    await userEvent.type(await screen.findByLabelText('E-mel'), 'admin@marineops.local');
    await userEvent.type(screen.getByLabelText('Kata Laluan'), 'pw');
    await userEvent.click(screen.getByRole('button', { name: 'Log Masuk' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/Terlalu banyak percubaan/);
  });

  it('redirects straight to the dashboard if a session already exists', async () => {
    globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url === '/api/v1/auth/refresh') return jsonResponse({ accessToken: 'restored' });
      if (url === '/api/v1/auth/me') return jsonResponse(PRINCIPAL);
      return errorResponse(404);
    }) as unknown as typeof globalThis.fetch;

    renderLogin();

    await waitFor(() => expect(screen.getByText('Papan Pemuka')).toBeInTheDocument());
  });
});
