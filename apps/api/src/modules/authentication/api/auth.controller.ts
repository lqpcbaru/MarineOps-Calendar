import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
import { LoginUseCase, RefreshUseCase, LogoutUseCase } from '../application';
import { type LoginCommand, type RefreshCommand, type LogoutCommand } from '../application/dtos';
import { Public } from './public.decorator';
import {
  REFRESH_COOKIE_NAME,
  clearRefreshCookie,
  cookieOptionsFromEnv,
  setRefreshCookie,
} from './refresh-cookie';
import { JwtAuthGuard } from './jwt-auth.guard';
import { InvalidCredentialsError, RefreshTokenNotFoundError } from '../domain';
import { ValidationError } from '../../../shared-kernel';

/**
 * HTTP endpoints under /api/v1/auth (SYSTEM_ARCHITECTURE §8).
 *
 * - POST /auth/login   — FR-AUTH-001
 * - POST /auth/refresh  — FR-AUTH-004, FR-AUTH-005
 * - POST /auth/logout   — FR-AUTH-003
 * - GET  /auth/me       — introspect current access token (helper)
 */
@Controller('auth')
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly refreshUseCase: RefreshUseCase,
    private readonly logoutUseCase: LogoutUseCase,
  ) {}

  @Public()
  @Post('login')
  async login(@Body() body: unknown, @Res({ passthrough: true }) res: Response) {
    const command = this.asLoginCommand(body);
    const result = await this.loginUseCase.execute(command);
    setRefreshCookie(res, result.refreshToken, this.refreshTtlSeconds(), cookieOptionsFromEnv());
    return {
      accessToken: result.accessToken,
      accessTokenExpiresAt: result.accessTokenExpiresAt,
    };
  }

  @Public()
  @Post('refresh')
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const rawFromCookie = req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined;
    const rawFromBody =
      typeof req.body === 'object' && req.body !== null
        ? (req.body as { refreshToken?: string }).refreshToken
        : undefined;
    const rawToken = rawFromCookie ?? rawFromBody;
    if (!rawToken) {
      clearRefreshCookie(res, cookieOptionsFromEnv());
      throw new RefreshTokenNotFoundError();
    }
    try {
      const command: RefreshCommand = { refreshToken: rawToken };
      const result = await this.refreshUseCase.execute(command);
      setRefreshCookie(res, result.refreshToken, this.refreshTtlSeconds(), cookieOptionsFromEnv());
      return {
        accessToken: result.accessToken,
        accessTokenExpiresAt: result.accessTokenExpiresAt,
      };
    } catch (err) {
      clearRefreshCookie(res, cookieOptionsFromEnv());
      throw err;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const rawToken = req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined;
    clearRefreshCookie(res, cookieOptionsFromEnv());
    if (rawToken) {
      const command: LogoutCommand = { refreshToken: rawToken };
      await this.logoutUseCase.execute(command);
    }
    return { ok: true };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Req() req: Request) {
    const principal = (req as unknown as Record<string, unknown>)['authPrincipal'] as
      { userId: string; email: string; name: string; roles: string[] } | undefined;
    if (!principal) {
      return { userId: null };
    }
    return {
      userId: principal.userId,
      email: principal.email,
      name: principal.name,
      roles: principal.roles,
    };
  }

  private asLoginCommand(body: unknown): LoginCommand {
    if (typeof body !== 'object' || body === null) {
      throw new ValidationError('Invalid login payload');
    }
    const b = body as { email?: string; password?: string };
    if (!b.email || !b.password) {
      throw new InvalidCredentialsError();
    }
    return { email: b.email, password: b.password };
  }

  private refreshTtlSeconds(): number {
    const days = parseInt(process.env['JWT_REFRESH_TTL_DAYS'] || '7', 10);
    return days * 24 * 60 * 60;
  }
}
