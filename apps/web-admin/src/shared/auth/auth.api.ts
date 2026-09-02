import { apiRequest } from '../api/http';
import { setAccessToken } from '../api/session';

/** GET /api/v1/auth/me — the authenticated principal. */
export interface AuthPrincipal {
  userId: string;
  email: string;
  name: string;
  roles: string[];
  permissionCodes: string[];
}

interface TokenResponse {
  accessToken: string;
  accessTokenExpiresAt: string;
}

/**
 * POST /api/v1/auth/login. The access token comes back in the body (held in
 * memory); the refresh token is set by the server as an httpOnly cookie and
 * is never visible to this code.
 */
export async function login(email: string, password: string): Promise<void> {
  const result = await apiRequest<TokenResponse>('/api/v1/auth/login', {
    method: 'POST',
    body: { email, password },
    fallbackMessage: 'Log masuk gagal',
  });
  setAccessToken(result.accessToken);
}

export async function fetchPrincipal(): Promise<AuthPrincipal> {
  return apiRequest<AuthPrincipal>('/api/v1/auth/me', {
    fallbackMessage: 'Gagal mendapatkan maklumat pengguna',
  });
}

/**
 * POST /api/v1/auth/logout — revokes the refresh token and clears the
 * cookie server-side. The in-memory access token is dropped by the caller
 * regardless of the outcome; a failed logout must never strand the user in
 * a logged-in-looking UI.
 */
export async function logout(): Promise<void> {
  await apiRequest<{ ok: boolean }>('/api/v1/auth/logout', {
    method: 'POST',
    fallbackMessage: 'Log keluar gagal',
  });
}
