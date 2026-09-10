import '@testing-library/jest-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from './auth-context';
import { clearAccessToken, getAccessToken } from '../api/session';
import { resetRefreshStateForTests } from '../api/http';

const PRINCIPAL = {
  userId: 'u-1',
  email: 'admin@marineops.local',
  name: 'System Admin',
  roles: ['Admin'],
  permissionCodes: ['user.manage', 'audit.read'],
};

function jsonResponse(body: unknown, status = 200): Response {
  return { ok: status >= 200 && status < 300, status, json: async () => body } as Response;
}
function errorResponse(status: number): Response {
  return { ok: false, status, json: async () => ({}) } as unknown as Response;
}

function Probe() {
  const { status, principal, can, login, logout } = useAuth();
  return (
    <div>
      <span data-testid="status">{status}</span>
      <span data-testid="name">{principal?.name ?? '-'}</span>
      <span data-testid="can-users">{String(can('user.manage'))}</span>
      <span data-testid="can-roles">{String(can('role.manage'))}</span>
      <button onClick={() => void login('admin@marineops.local', 'pw')}>masuk</button>
      <button onClick={() => void logout()}>keluar</button>
    </div>
  );
}

function renderProbe() {
  return render(
    <AuthProvider>
      <Probe />
    </AuthProvider>,
  );
}

describe('AuthProvider', () => {
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

  it('restores a session on boot by trading the refresh cookie for a token', async () => {
    globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url === '/api/v1/auth/refresh') return jsonResponse({ accessToken: 'restored' });
      if (url === '/api/v1/auth/me') return jsonResponse(PRINCIPAL);
      return errorResponse(404);
    }) as unknown as typeof globalThis.fetch;

    renderProbe();

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('authenticated'));
    expect(screen.getByTestId('name')).toHaveTextContent('System Admin');
    expect(getAccessToken()).toBe('restored');
  });

  it('becomes anonymous when there is no valid refresh cookie', async () => {
    globalThis.fetch = vi.fn(async () => errorResponse(401)) as unknown as typeof globalThis.fetch;

    renderProbe();

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('anonymous'));
    expect(getAccessToken()).toBeNull();
  });

  it('starts in `restoring` so a hard refresh does not flash the login page', () => {
    globalThis.fetch = vi.fn(() => new Promise(() => {})) as unknown as typeof globalThis.fetch;

    renderProbe();

    expect(screen.getByTestId('status')).toHaveTextContent('restoring');
  });

  it('authenticates on login and exposes the principal permissions', async () => {
    globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url === '/api/v1/auth/refresh') return errorResponse(401);
      if (url === '/api/v1/auth/login') return jsonResponse({ accessToken: 'fresh' });
      if (url === '/api/v1/auth/me') return jsonResponse(PRINCIPAL);
      return errorResponse(404);
    }) as unknown as typeof globalThis.fetch;

    renderProbe();
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('anonymous'));

    await userEvent.click(screen.getByText('masuk'));

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('authenticated'));
    expect(screen.getByTestId('can-users')).toHaveTextContent('true');
    // Not in the principal's codes — `can` must not be optimistic.
    expect(screen.getByTestId('can-roles')).toHaveTextContent('false');
  });

  it('clears the session on logout', async () => {
    globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url === '/api/v1/auth/refresh') return jsonResponse({ accessToken: 'restored' });
      if (url === '/api/v1/auth/me') return jsonResponse(PRINCIPAL);
      if (url === '/api/v1/auth/logout') return jsonResponse({ ok: true });
      return errorResponse(404);
    }) as unknown as typeof globalThis.fetch;

    renderProbe();
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('authenticated'));

    await userEvent.click(screen.getByText('keluar'));

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('anonymous'));
    expect(getAccessToken()).toBeNull();
  });

  it('still clears the session locally when server-side logout fails', async () => {
    globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url === '/api/v1/auth/refresh') return jsonResponse({ accessToken: 'restored' });
      if (url === '/api/v1/auth/me') return jsonResponse(PRINCIPAL);
      if (url === '/api/v1/auth/logout') throw new Error('network down');
      return errorResponse(404);
    }) as unknown as typeof globalThis.fetch;

    renderProbe();
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('authenticated'));

    await userEvent.click(screen.getByText('keluar'));

    // Leaving the operator on an authenticated-looking screen would be worse.
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('anonymous'));
    expect(getAccessToken()).toBeNull();
  });

  it('never persists the access token to browser storage', async () => {
    globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url === '/api/v1/auth/refresh') return jsonResponse({ accessToken: 'secret-token' });
      if (url === '/api/v1/auth/me') return jsonResponse(PRINCIPAL);
      return errorResponse(404);
    }) as unknown as typeof globalThis.fetch;

    renderProbe();
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('authenticated'));

    // AUTHENTICATION.md: "Frontend memory only (never localStorage)".
    expect(JSON.stringify(localStorage)).not.toContain('secret-token');
    expect(JSON.stringify(sessionStorage)).not.toContain('secret-token');
    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);
    expect(document.cookie).not.toContain('secret-token');
  });
});
