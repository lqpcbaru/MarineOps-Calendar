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
}
