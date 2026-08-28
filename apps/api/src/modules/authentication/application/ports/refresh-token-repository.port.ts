import type { RefreshToken } from '../../domain';

/**
 * Refresh token repository port — persistence for the RefreshToken aggregate.
 *
 * Per ADR-0010 §4 only the HASH is persisted. The repository never sees the
 * raw token. Implemented in authentication/infrastructure (Prisma).
 */
export interface RefreshTokenRepository {
  save(token: RefreshToken): Promise<void>;

  /** Load by token hash (the only indexed lookup the API can do from a cookie). */
  findByHash(tokenHash: string): Promise<RefreshToken | null>;

  /** Load by id. */
  findById(id: string): Promise<RefreshToken | null>;

  /** Revoke every non-revoked token in a family (theft mitigation, ADR-0010 §1). */
  revokeFamily(familyId: string, now?: Date): Promise<number>;

  /**
   * Atomically revoke `id` and record its replacement, but ONLY if it is
   * still active (not already revoked). Returns false if it lost the race —
   * some other request already revoked it first. This is what makes
   * rotation safe under concurrent refresh calls presenting the same token:
   * without a conditional check here, two concurrent callers could both
   * read the token as active before either persists, and both would go on
   * to mint a sibling replacement from the same parent.
   */
  revokeIfActive(id: string, replacedBy: string, now?: Date): Promise<boolean>;
}
