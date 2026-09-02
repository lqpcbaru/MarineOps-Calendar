import '@testing-library/jest-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import {
  Outlet,
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router';
import { AuthProvider } from './auth-context';
import { RequireAuth } from './RequireAuth';
import { clearAccessToken } from '../api/session';
import { resetRefreshStateForTests } from '../api/http';

const PRINCIPAL = {
  userId: 'u-1',
  email: 'officer@marineops.local',
  name: 'Fisheries Officer',
  roles: ['FisheriesOfficer'],
  // Deliberately lacks user.manage — the same shape as the seeded
  // FisheriesOfficer role in apps/api/prisma/seed.ts.
  permissionCodes: ['station.read', 'audit.read', 'dashboard.read'],
};

function jsonResponse(body: unknown): Response {
  return { ok: true, status: 200, json: async () => body } as Response;
}
function unauthorized(): Response {
  return { ok: false, status: 401, json: async () => ({}) } as unknown as Response;
}

/** Builds a throwaway router so the guard can be exercised in isolation. */
function renderAt(path: string, permission?: string) {
  const rootRoute = createRootRoute({ component: () => <Outlet /> });

  const loginRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/login',
    component: () => <div>Halaman Log Masuk</div>,
  });

  const guardedRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/users',
    component: () => (
      <RequireAuth permission={permission}>
        <div>Kandungan Terlindung</div>
      </RequireAuth>
    ),
  });

  const router = createRouter({
    routeTree: rootRoute.addChildren([loginRoute, guardedRoute]),
    history: createMemoryHistory({ initialEntries: [path] }),
  });

  return render(
    <AuthProvider>
      <RouterProvider router={router as never} />
    </AuthProvider>,
  );
}

describe('RequireAuth', () => {
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

  it('shows a loading state while the session is being restored', async () => {
    globalThis.fetch = vi.fn(() => new Promise(() => {})) as unknown as typeof globalThis.fetch;

    renderAt('/users');

    // Critically NOT the login page: redirecting here would bounce an
    // authenticated user to /login on every hard refresh.
    expect(await screen.findByRole('status')).toBeInTheDocument();
    expect(screen.queryByText('Halaman Log Masuk')).not.toBeInTheDocument();
  });

  it('redirects an anonymous visitor to /login', async () => {
    globalThis.fetch = vi.fn(async () => unauthorized()) as unknown as typeof globalThis.fetch;

    renderAt('/users');

    await waitFor(() => expect(screen.getByText('Halaman Log Masuk')).toBeInTheDocument());
    expect(screen.queryByText('Kandungan Terlindung')).not.toBeInTheDocument();
  });

  it('renders the page when authenticated and no permission is required', async () => {
    globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url === '/api/v1/auth/refresh') return jsonResponse({ accessToken: 'tok' });
      if (url === '/api/v1/auth/me') return jsonResponse(PRINCIPAL);
      return unauthorized();
    }) as unknown as typeof globalThis.fetch;

    renderAt('/users');

    await waitFor(() => expect(screen.getByText('Kandungan Terlindung')).toBeInTheDocument());
  });

  it('renders the page when the principal holds the required permission', async () => {
    globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url === '/api/v1/auth/refresh') return jsonResponse({ accessToken: 'tok' });
      if (url === '/api/v1/auth/me') return jsonResponse(PRINCIPAL);
      return unauthorized();
    }) as unknown as typeof globalThis.fetch;

    renderAt('/users', 'station.read');

    await waitFor(() => expect(screen.getByText('Kandungan Terlindung')).toBeInTheDocument());
  });

  it('shows 403 — not a redirect — when the permission is missing', async () => {
    globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url === '/api/v1/auth/refresh') return jsonResponse({ accessToken: 'tok' });
      if (url === '/api/v1/auth/me') return jsonResponse(PRINCIPAL);
      return unauthorized();
    }) as unknown as typeof globalThis.fetch;

    // FisheriesOfficer has no user.manage.
    renderAt('/users', 'user.manage');

    await waitFor(() => expect(screen.getByText('Akses Ditolak')).toBeInTheDocument());
    expect(screen.getByText(/user\.manage/)).toBeInTheDocument();
    expect(screen.queryByText('Kandungan Terlindung')).not.toBeInTheDocument();
    // "Not allowed" must stay distinguishable from "logged out".
    expect(screen.queryByText('Halaman Log Masuk')).not.toBeInTheDocument();
  });
});
