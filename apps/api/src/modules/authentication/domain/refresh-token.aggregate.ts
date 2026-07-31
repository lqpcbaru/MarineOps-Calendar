import type { DomainId } from '../../../shared-kernel';

/**
 * RefreshToken aggregate root (DOMAIN_MODEL §5.1, ADR-0010 §4).
 *
 * Invariants:
 * - Revoked tokens cannot be used for refresh.
 * - Reuse of a revoked token invalidates the entire token family.
 * - Only the HASH of the token is persisted; the raw token exists only at issuance.
 *
 * No I/O. Pure domain logic.
 */
export interface RefreshTokenState {
  id: string;
  userId: string;
  tokenHash: string;
  familyId: string;
  expiresAt: Date;
  revokedAt: Date | null;
  replacedBy: string | null;
  createdAt: Date;
}

export class RefreshToken {
  private constructor(private readonly state: RefreshTokenState) {}

  static create(params: {
    id: string;
    userId: string;
    tokenHash: string;
    familyId: string;
    expiresAt: Date;
    createdAt?: Date;
  }): RefreshToken {
    return new RefreshToken({
      id: params.id,
      userId: params.userId,
      tokenHash: params.tokenHash,
      familyId: params.familyId,
      expiresAt: params.expiresAt,
      revokedAt: null,
      replacedBy: null,
      createdAt: params.createdAt ?? new Date(),
    });
  }

  static fromState(state: RefreshTokenState): RefreshToken {
    return new RefreshToken({ ...state });
  }

  get id(): string {
    return this.state.id;
  }
  get userId(): string {
    return this.state.userId;
  }
  get tokenHash(): string {
    return this.state.tokenHash;
  }
  get familyId(): string {
    return this.state.familyId;
  }
  get expiresAt(): Date {
    return this.state.expiresAt;
  }
  get revokedAt(): Date | null {
    return this.state.revokedAt;
  }
  get replacedBy(): string | null {
    return this.state.replacedBy;
  }
  get createdAt(): Date {
    return this.state.createdAt;
  }

  isExpired(now: Date = new Date()): boolean {
    return now.getTime() >= this.state.expiresAt.getTime();
  }

  isRevoked(): boolean {
    return this.state.revokedAt !== null;
  }

  /** A token is usable for refresh only if not revoked, not replaced, and not expired. */
  isUsable(now: Date = new Date()): boolean {
    return !this.isRevoked() && !this.isExpired(now);
  }

  /** Mark this token as revoked (used on rotation or logout). */
  revoke(now: Date = new Date()): RefreshToken {
    if (this.state.revokedAt !== null) {
      return this;
    }
    return new RefreshToken({ ...this.state, revokedAt: now });
  }

  /** Record the id of the token that replaced this one on rotation. */
  markReplacedBy(newTokenId: string): RefreshToken {
    return new RefreshToken({ ...this.state, replacedBy: newTokenId });
  }

  toState(): RefreshTokenState {
    return { ...this.state };
  }
}

export type { DomainId };
