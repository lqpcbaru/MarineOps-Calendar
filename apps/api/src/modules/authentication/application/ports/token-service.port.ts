import type { AccessToken, IssuedRefreshToken, AuthPrincipal } from '../../domain';

/**
 * Token service port — mints and verifies access JWTs and refresh tokens.
 *
 * Access token = JWT (short TTL), returned in response body (ADR-0010 §1).
 * Refresh token = opaque random string; only its hash is stored.
 */
export interface TokenService {
  mintAccessToken(principal: AuthPrincipal, now?: Date): Promise<AccessToken>;
  verifyAccessToken(token: string): Promise<AuthPrincipal>;

  /** Generate a fresh refresh token (random opaque) + its hash. */
  generateRefreshToken(userId: string, now?: Date): Promise<IssuedRefreshToken>;

  /** Hash a raw refresh token (for storage lookup / comparison). */
  hashRefreshToken(rawToken: string): Promise<string>;

  /** TTLs (seconds), sourced from config. */
  refreshTokenTtlSeconds(): number;
  accessTokenTtlSeconds(): number;
}
