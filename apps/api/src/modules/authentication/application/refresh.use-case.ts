import { Inject, Injectable } from '@nestjs/common';
import { createId } from '../../../shared-kernel';
import { type DomainId } from '../../../shared-kernel';
import {
  RefreshToken,
  RefreshTokenExpiredError,
  RefreshTokenNotFoundError,
  RefreshTokenReusedError,
  type DomainEventBus,
} from '../domain';
import type {
  Clock,
  RefreshCommand,
  RefreshResult,
  RefreshTokenRepository,
  TokenService,
  UserIdentityProvider,
} from './contracts';
import { refreshCommandSchema } from './dtos';
import {
  CLOCK,
  DOMAIN_EVENT_BUS,
  REFRESH_TOKEN_REPOSITORY,
  TOKEN_SERVICE,
  USER_IDENTITY_PROVIDER,
} from './di-tokens';

/**
 * FR-AUTH-004 / FR-AUTH-005 — refresh access token with rotation.
 *
 * Rotation + theft detection (ADR-0010 §1):
 * 1. Hash the presented refresh token; load the matching record.
 * 2. If no record → REFRESH_NOT_FOUND.
 * 3. If record is revoked/replaced → REUSE_DETECTED → revoke entire family.
 * 4. If expired → REFRESH_EXPIRED.
 * 5. Otherwise: atomically claim the token for rotation (conditional revoke —
 *    see revokeIfActive), mint a NEW refresh token in the SAME family,
 *    persist, and emit RefreshTokenRotated. If the atomic claim loses a race
 *    against a concurrent refresh call presenting the same token, it's
 *    treated the same as REUSE_DETECTED.
 *
 * The new refresh token shares the familyId of the original so the chain
 * stays traceable. Any future reuse of a revoked token in the chain invalidates
 * the whole family.
 */
@Injectable()
export class RefreshUseCase {
  constructor(
    @Inject(USER_IDENTITY_PROVIDER) private readonly users: UserIdentityProvider,
    @Inject(TOKEN_SERVICE) private readonly tokens: TokenService,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshRepo: RefreshTokenRepository,
    @Inject(DOMAIN_EVENT_BUS) private readonly events: DomainEventBus,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async execute(command: RefreshCommand): Promise<RefreshResult> {
    const valid = refreshCommandSchema.safeParse(command);
    if (!valid.success) {
      throw new RefreshTokenNotFoundError();
    }
    const { refreshToken: rawToken } = valid.data;
    const now = this.clock.now();

    const tokenHash = await this.tokens.hashRefreshToken(rawToken);
    const existing = await this.refreshRepo.findByHash(tokenHash);

    if (!existing) {
      throw new RefreshTokenNotFoundError();
    }

    // Reuse of a revoked/replaced token → invalidate the family (theft signal).
    if (existing.isRevoked()) {
      return this.handleReuse(existing.userId, existing.familyId, now);
    }

    if (existing.isExpired(now)) {
      throw new RefreshTokenExpiredError();
    }

    // Load principal to mint a new access token.
    const userRecord = await this.findUserOrInvalidate(existing.userId, existing.familyId, now);
    const principal = this.users.toPrincipal(userRecord);

    // Atomically claim this token for rotation. A conditional check here
    // (rather than a blind save of a locally-computed `revoked` state) is
    // what prevents two concurrent refresh calls presenting the same token
    // from both succeeding: only the request that wins the race gets
    // `true` back. The loser hits this exact branch as if it had presented
    // an already-revoked token, since that's genuinely what happened by
    // the time its write landed.
    const newTokenId = createId() as DomainId;
    const claimed = await this.refreshRepo.revokeIfActive(existing.id, newTokenId, now);
    if (!claimed) {
      return this.handleReuse(existing.userId, existing.familyId, now);
    }

    const newAccessToken = await this.tokens.mintAccessToken(principal, now);
    const newRefresh = await this.tokens.generateRefreshToken(existing.userId, now);

    const newAggregate = RefreshToken.create({
      id: newTokenId,
      userId: existing.userId,
      tokenHash: newRefresh.hash,
      familyId: existing.familyId,
      expiresAt: newRefresh.expiresAt,
      createdAt: now,
    });

    await this.refreshRepo.save(newAggregate);

    await this.events.publish({
      type: 'RefreshTokenRotated',
      userId: existing.userId,
      revokedTokenId: existing.id,
      newTokenId,
      at: now,
    });

    return {
      accessToken: newAccessToken.token,
      accessTokenExpiresAt: newAccessToken.expiresAt.toISOString(),
      refreshToken: newRefresh.rawToken,
    };
  }

  /**
   * If the user no longer exists or is disabled, the refresh token is no longer
   * valid → revoke the family and surface as expired.
   */
  private async findUserOrInvalidate(userId: string, familyId: string, now: Date) {
    const record = await this.users.findById(userId);
    if (!record || record.status === 'DISABLED') {
      await this.refreshRepo.revokeFamily(familyId, now);
      throw new RefreshTokenExpiredError();
    }
    return record;
  }

  /** Reuse of a revoked/replaced token → invalidate the family (theft signal). */
  private async handleReuse(userId: string, familyId: string, now: Date): Promise<never> {
    await this.refreshRepo.revokeFamily(familyId, now);
    await this.events.publish({
      type: 'RefreshTokenReused',
      userId,
      familyId,
      at: now,
    });
    throw new RefreshTokenReusedError();
  }
}
