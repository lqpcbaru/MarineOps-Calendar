import type { Response } from 'express';

/**
 * Refresh-token cookie config (ADR-0010 §1).
 * httpOnly + Secure (non-local) + SameSite=Lax. Path scoped to /api/v1/auth.
 */
export const REFRESH_COOKIE_NAME = 'mops_rt';

export interface CookieOptions {
  secure: boolean;
  sameSite: 'lax' | 'strict' | 'none';
}

export function setRefreshCookie(
  res: Response,
  rawToken: string,
  ttlSeconds: number,
  opts: CookieOptions,
): void {
  res.cookie(REFRESH_COOKIE_NAME, rawToken, {
    httpOnly: true,
    secure: opts.secure,
    sameSite: opts.sameSite,
    path: '/api/v1/auth',
    maxAge: ttlSeconds * 1000,
  });
}

export function clearRefreshCookie(res: Response, opts: CookieOptions): void {
  res.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: true,
    secure: opts.secure,
    sameSite: opts.sameSite,
    path: '/api/v1/auth',
  });
}

/** Secure flag = true unless NODE_ENV is development/test (local HTTP). */
export function cookieOptionsFromEnv(): CookieOptions {
  const dev = process.env['NODE_ENV'] === 'development' || process.env['NODE_ENV'] === 'test';
  return { secure: !dev, sameSite: 'lax' };
}
