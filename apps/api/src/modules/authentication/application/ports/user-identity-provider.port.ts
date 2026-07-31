import type { AuthPrincipal } from '../../domain/auth-principal';

/**
 * Snapshot of a user record sufficient for authentication decisions.
 * Loaded from the Users module's tables (owned by Users, read by Auth).
 */
export interface UserAuthRecord {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  status: 'ACTIVE' | 'DISABLED';
  roles: string[];
  permissionCodes: string[];
}

/**
 * Identity provider port (ADR-0010 §6).
 *
 * Abstracts where user identity comes from. Today: local Postgres-backed
 * Users tables. Future: external OIDC IdP (swap implementation only).
 *
 * Implemented in authentication/infrastructure.
 */
export interface UserIdentityProvider {
  /** Find a user by email for credential verification. Returns null if not found. */
  findByEmail(email: string): Promise<UserAuthRecord | null>;

  /** Find a user by id (used by refresh to rebuild the principal). Returns null if not found. */
  findById(id: string): Promise<UserAuthRecord | null>;

  /** Build the auth principal for a verified user id (used to mint access tokens). */
  toPrincipal(user: UserAuthRecord): AuthPrincipal;
}
