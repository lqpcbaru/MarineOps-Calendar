/**
 * Access token value object (ADR-0010 §1).
 *
 * A short-lived JWT returned in the response body; the frontend stores it
 * in memory and sends it as `Authorization: Bearer <token>`.
 */
export interface AccessToken {
  token: string;
  expiresAt: Date;
  ttlSeconds: number;
}

/**
 * Refresh token issuance value object (ADR-0010 §1, §4).
 *
 * `rawToken` is the opaque random string handed to the client once and
 * placed in an httpOnly cookie. Only `hash` is persisted (ADR-0010 §4).
 */
export interface IssuedRefreshToken {
  rawToken: string;
  hash: string;
  expiresAt: Date;
  ttlSeconds: number;
}

export interface TokenPair {
  accessToken: AccessToken;
  refreshToken: IssuedRefreshToken;
}
