import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { TokenService } from '../application/ports/token-service.port';
import { IS_PUBLIC_KEY } from './public.decorator';
import type { AuthPrincipal } from '../domain';
import { TOKEN_SERVICE } from '../application/di-tokens';

export const REQUEST_PRINCIPAL_KEY = 'authPrincipal';

/**
 * JWT auth guard (ADR-0010 §1).
 *
 * Extracts the Bearer access token from the Authorization header, verifies it,
 * and attaches the AuthPrincipal to the request. Public routes (via @Public())
 * are skipped.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(TOKEN_SERVICE) private readonly tokens: TokenService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<{
      headers: { authorization?: string };
    }>();
    const header = request.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing access token');
    }
    const token = header.slice('Bearer '.length).trim();
    let principal: AuthPrincipal;
    try {
      principal = await this.tokens.verifyAccessToken(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired access token');
    }
    (request as Record<string, unknown>)[REQUEST_PRINCIPAL_KEY] = principal;
    return true;
  }
}
