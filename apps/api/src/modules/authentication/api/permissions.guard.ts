import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUEST_PRINCIPAL_KEY } from './jwt-auth.guard';
import type { AuthPrincipal } from '../domain';

export const PERMISSIONS_KEY = 'requiredPermissions';

/**
 * Optional RBAC guard (ADR-0010 §5).
 *
 * Use-case-level authorization is the authoritative control (AuthorizeUseCase);
 * this guard is a defense-in-depth layer for routes decorated with
 * `@RequirePermissions('...')`.
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[] | undefined>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) return true;

    const request = context.switchToHttp().getRequest<Record<string, unknown>>();
    const principal = request[REQUEST_PRINCIPAL_KEY] as AuthPrincipal | undefined;
    if (!principal) {
      throw new ForbiddenException('Missing authenticated principal');
    }
    const held = new Set(principal.permissionCodes);
    const ok = required.every((code) => held.has(code));
    if (!ok) {
      throw new ForbiddenException(`Missing required permission: ${required.join(', ')}`);
    }
    return true;
  }
}

export const RequirePermissions = (...codes: string[]): MethodDecorator & ClassDecorator =>
  SetMetadata(PERMISSIONS_KEY, codes);
