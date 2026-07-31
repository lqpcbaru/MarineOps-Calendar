/**
 * Auth principal (DOMAIN_MODEL §2, ADR-0010 §5).
 *
 * Carries the authenticated user's identity + permissions through the
 * application layer. RBAC checks happen against `permissionCodes` at
 * use-case entry (ENGINEERING_STANDARDS §3.4).
 */
export interface AuthPrincipal {
  userId: string;
  email: string;
  name: string;
  roles: string[];
  permissionCodes: string[];
}

export type { DomainId } from '../../../shared-kernel';
