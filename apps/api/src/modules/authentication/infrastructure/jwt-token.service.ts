import { Injectable } from '@nestjs/common';
import * as crypto from 'node:crypto';
import * as jwt from 'jsonwebtoken';
import type { AccessToken, AuthPrincipal, IssuedRefreshToken } from '../domain';
import type { TokenService } from '../application/ports/token-service.port';
import { UnauthorizedError } from '../domain';

interface AccessJwtPayload {
  sub: string;
  email: string;
  name: string;
  roles: string[];
  perms: string[];
  iat?: number;
  exp?: number;
}

/**
 * JWT + opaque-refresh-token implementation of TokenService (ADR-0010).
 *
 * - Access token: HS256 JWT, short TTL, returned in response body.
 * - Refresh token: 48-byte cryptographically-random string, base64url.
 *   Only its SHA-256 hash is persisted (refresh_token.token_hash).
 */
@Injectable()
export class JwtTokenService implements TokenService {
  constructor(
    private readonly accessSecret: string,
    private readonly refreshTtlSeconds: number,
    private readonly accessTtlSeconds: number,
  ) {}

  async mintAccessToken(principal: AuthPrincipal, now: Date = new Date()): Promise<AccessToken> {
    const expiresAt = new Date(now.getTime() + this.accessTtlSeconds * 1000);
    const payload: AccessJwtPayload = {
      sub: principal.userId,
      email: principal.email,
      name: principal.name,
      roles: principal.roles,
      perms: principal.permissionCodes,
    };
    const token = jwt.sign(payload, this.accessSecret, {
      algorithm: 'HS256',
      expiresIn: this.accessTtlSeconds,
      notBefore: 0,
    });
    return { token, expiresAt, ttlSeconds: this.accessTtlSeconds };
  }

  async verifyAccessToken(token: string): Promise<AuthPrincipal> {
    try {
      const decoded = jwt.verify(token, this.accessSecret, {
        algorithms: ['HS256'],
      }) as AccessJwtPayload;
      return {
        userId: decoded.sub,
        email: decoded.email,
        name: decoded.name,
        roles: decoded.roles ?? [],
        permissionCodes: decoded.perms ?? [],
      };
    } catch {
      throw new UnauthorizedError('Invalid or expired access token');
    }
  }

  async generateRefreshToken(_userId: string, now: Date = new Date()): Promise<IssuedRefreshToken> {
    const rawToken = crypto.randomBytes(48).toString('base64url');
    const hash = this.hashRefreshTokenSync(rawToken);
    const expiresAt = new Date(now.getTime() + this.refreshTtlSeconds * 1000);
    return { rawToken, hash, expiresAt, ttlSeconds: this.refreshTtlSeconds };
  }

  hashRefreshToken(rawToken: string): Promise<string> {
    return Promise.resolve(this.hashRefreshTokenSync(rawToken));
  }

  refreshTokenTtlSeconds(): number {
    return this.refreshTtlSeconds;
  }

  accessTokenTtlSeconds(): number {
    return this.accessTtlSeconds;
  }

  private hashRefreshTokenSync(rawToken: string): string {
    return crypto.createHash('sha256').update(rawToken).digest('hex');
  }
}
