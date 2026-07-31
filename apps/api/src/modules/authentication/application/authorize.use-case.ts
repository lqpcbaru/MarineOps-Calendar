import { ForbiddenError } from '../domain';
import type { AuthPrincipal } from '../domain';

/**
 * RBAC enforcement at the application layer (ADR-0010 §5, ENGINEERING_STANDARDS §3.4).
 *
 * Use-cases and controllers call this at the entry point of a protected action.
 * UI hiding is never the only control.
 */
export class AuthorizeUseCase {
  /**
   * Require that the principal holds ALL of `required` permission codes.
   * Throws ForbiddenError on denial.
   */
  requireAll(principal: AuthPrincipal | null, required: string[]): void {
    if (!principal) {
      throw new ForbiddenError(required.join(','));
    }
    const held = new Set(principal.permissionCodes);
    for (const code of required) {
      if (!held.has(code)) {
        throw new ForbiddenError(code);
      }
    }
  }

  /** Require ANY of the given permission codes. */
  requireAny(principal: AuthPrincipal | null, anyOf: string[]): void {
    if (!principal) {
      throw new ForbiddenError(anyOf.join(','));
    }
    if (anyOf.length === 0) return;
    const held = new Set(principal.permissionCodes);
    const ok = anyOf.some((code) => held.has(code));
    if (!ok) {
      throw new ForbiddenError(anyOf.join(','));
    }
  }
}
