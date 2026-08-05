import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { REQUEST_PRINCIPAL_KEY } from './jwt-auth.guard';
import type { AuthPrincipal } from '../domain';

/** Extracts the authenticated principal attached by JwtAuthGuard. */
export const CurrentPrincipal = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthPrincipal | undefined => {
    const request = context.switchToHttp().getRequest<Record<string, unknown>>();
    return request[REQUEST_PRINCIPAL_KEY] as AuthPrincipal | undefined;
  },
);
