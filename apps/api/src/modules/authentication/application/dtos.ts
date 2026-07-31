import { z } from 'zod';

/** FR-AUTH-001: authenticate with email + password. */
export const loginCommandSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(256),
});
export type LoginCommand = z.infer<typeof loginCommandSchema>;

export interface LoginResult {
  accessToken: string;
  accessTokenExpiresAt: string;
  /** Raw refresh token to set in httpOnly cookie (never returned in JSON body). */
  refreshToken: string;
}

/** FR-AUTH-004: refresh access token using the cookie-carried refresh token. */
export const refreshCommandSchema = z.object({
  refreshToken: z.string().min(1).max(256),
});
export type RefreshCommand = z.infer<typeof refreshCommandSchema>;

export interface RefreshResult {
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshToken: string;
}

/** FR-AUTH-003: logout invalidates the refresh token + clears cookie. */
export const logoutCommandSchema = z.object({
  refreshToken: z.string().min(1).max(256),
});
export type LogoutCommand = z.infer<typeof logoutCommandSchema>;
