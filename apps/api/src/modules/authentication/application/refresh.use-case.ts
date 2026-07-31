import { createId } from '../../../shared-kernel';
import { type DomainId } from '../../../shared-kernel';
import {
  RefreshTokenExpiredError,
  RefreshTokenNotFoundError,
  RefreshTokenReusedError,
  type DomainEventBus,
  type RefreshToken,
} from '../domain';
import {
  type Clock,
  type RefreshCommand,
  type RefreshResult,
  type RefreshTokenRepository,
  type TokenService,
  type UserIdentityProvider,
} from './contracts';
import { refreshCommandSchema } from './dtos';

/**
 * FR-AUTH-004 / FR-AUTH-005 — refresh access token with rotation.
 *
 * Rotation + theft detection (ADR-0010 §1):
 * 1. Hash the presented refresh token; load the matching record.
 * 2. If no record → REFRESH_NOT_FOUND (treat as suspicious; do nothing more).
 * 3. If record is revoked/replaced → REUSE_DETECTED → revoke entire family.
 * 4. If expired → REFRESH_EXPIRED.
 * 5. Otherwise: revoke this token, mint a NEW refresh token in the SAME family,
 *    persist, and emit RefreshTokenRotated.
 *
 * The new refresh token shares the familyId of the original so the chain
 * stays traceable. Any future reuse of a revoked token in the chain invalidates
 * the whole family.
 */
export class RefreshUseCase {
  constructor(
    private readonly users: UserIdentityProvider,
    private readonly tokens: TokenService,
    private readonly refreshRepo: RefreshTokenRepository,
    private readonly events: DomainEventBus,
    private readonly clock: Clock,
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
      await this.refreshRepo.revokeFamily(existing.familyId, now);
      await this.events.publish({
        type: 'RefreshTokenReused',
        userId: existing.userId,
        familyId: existing.familyId,
        at: now,
      });
      throw new RefreshTokenReusedError();
    }

    if (existing.isExpired(now)) {
      throw new RefreshTokenExpiredError();
    }

    // Load principal to mint a new access token.
    const userRecord = await this.findUserOrInvalidate(existing.userId, existing.familyId, now);
    const principal = this.users.toPrincipal(userRecord);

    // Revoke the presented token and record its replacement.
    const revoked = existing.revoke(now);
    const newAccessToken = await this.tokens.mintAccessToken(principal, now);
    const newRefresh = await this.tokens.generateRefreshToken(existing.userId, now);

    const newTokenId = createId() as DomainId;
    const newAggregate = RefreshToken.create({
      id: newTokenId,
      userId: existing.userId,
      tokenHash: newRefresh.hash,
      familyId: existing.familyId,
      expiresAt: newRefresh.expiresAt,
      createdAt: now,
    });

    await this.refreshRepo.save(revoked.markReplacedBy(newTokenId));
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
   * valid → revoke the family and surface as expired/not-found.
   */
  private async findUserOrInvalidate(
    userId: string,
    familyId: string,
    now: Date,
  ) {
    // The identity provider must support lookup by id for refresh; we reuse
    // findByEmail semantics by extending the contract via a throw on missing.
    // Here we use an explicit cast-free lookup through a helper.
    const record = await this.users.findById(userId);
    if (!record || record.status === 'DISABLED') {
      await this.refreshRepo.revokeFamily(familyId, now);
      throw new RefreshTokenExpiredError();
    }
    return record;
  }
}
