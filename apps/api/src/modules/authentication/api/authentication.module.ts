import { Module, Global } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import { PermissionsGuard } from './permissions.guard';
import {
  LoginUseCase,
  RefreshUseCase,
  LogoutUseCase,
  AuthorizeUseCase,
  SystemClock,
} from '../application';
import type {
  PasswordHasher,
  RefreshTokenRepository,
  TokenService,
  UserIdentityProvider,
} from '../application/ports';
import type { Clock } from '../application/clock';
import { Argon2PasswordHasher } from '../infrastructure/argon2-password-hasher';
import { JwtTokenService } from '../infrastructure/jwt-token.service';
import { PrismaRefreshTokenRepository } from '../infrastructure/prisma-refresh-token.repository';
import { PrismaUserIdentityProvider } from '../infrastructure/prisma-user-identity-provider';
import { InProcessEventBus } from '../infrastructure/in-process-event-bus';
import type { DomainEventBus } from '../domain';
import {
  CLOCK,
  DOMAIN_EVENT_BUS,
  JWT_ACCESS_SECRET,
  JWT_ACCESS_TTL_MINUTES,
  JWT_REFRESH_TTL_DAYS,
  PASSWORD_HASHER,
  REFRESH_TOKEN_REPOSITORY,
  TOKEN_SERVICE,
  USER_IDENTITY_PROVIDER,
} from '../application/di-tokens';

@Global()
@Module({
  providers: [
    LoginUseCase,
    RefreshUseCase,
    LogoutUseCase,
    AuthorizeUseCase,
    JwtAuthGuard,
    PermissionsGuard,
    { provide: CLOCK, useValue: new SystemClock() },
    { provide: PASSWORD_HASHER, useClass: Argon2PasswordHasher },
    { provide: USER_IDENTITY_PROVIDER, useClass: PrismaUserIdentityProvider },
    { provide: REFRESH_TOKEN_REPOSITORY, useClass: PrismaRefreshTokenRepository },
    { provide: DOMAIN_EVENT_BUS, useClass: InProcessEventBus },
    {
      provide: TOKEN_SERVICE,
      useFactory: (accessSecret: string, refreshDays: number, accessMinutes: number) =>
        new JwtTokenService(accessSecret, refreshDays * 24 * 60 * 60, accessMinutes * 60),
      inject: [JWT_ACCESS_SECRET, JWT_REFRESH_TTL_DAYS, JWT_ACCESS_TTL_MINUTES],
    },
    {
      provide: JWT_ACCESS_SECRET,
      useFactory: () => process.env['JWT_ACCESS_SECRET'] || 'change-me',
    },
    {
      provide: JWT_REFRESH_TTL_DAYS,
      useFactory: () => parseInt(process.env['JWT_REFRESH_TTL_DAYS'] || '7', 10),
    },
    {
      provide: JWT_ACCESS_TTL_MINUTES,
      useFactory: () => parseInt(process.env['JWT_ACCESS_TTL_MINUTES'] || '15', 10),
    },
  ],
  exports: [
    TOKEN_SERVICE,
    JwtAuthGuard,
    PermissionsGuard,
    AuthorizeUseCase,
    LoginUseCase,
    RefreshUseCase,
    LogoutUseCase,
    USER_IDENTITY_PROVIDER,
    CLOCK,
    DOMAIN_EVENT_BUS,
    PASSWORD_HASHER,
    REFRESH_TOKEN_REPOSITORY,
    JWT_ACCESS_SECRET,
  ],
})
export class AuthenticationModule {}

export type {
  Clock,
  PasswordHasher,
  RefreshTokenRepository,
  TokenService,
  UserIdentityProvider,
  DomainEventBus,
};
