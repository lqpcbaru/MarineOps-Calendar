import { Inject, Injectable } from '@nestjs/common';
import { createId } from '../../../shared-kernel';
import { type DomainId } from '../../../shared-kernel';
import {
  InvalidCredentialsError,
  UserDisabledError,
  RefreshToken,
  type DomainEventBus,
} from '../domain';
import type {
  Clock,
  LoginCommand,
  LoginResult,
  PasswordHasher,
  RefreshTokenRepository,
  TokenService,
  UserIdentityProvider,
} from './contracts';
import { loginCommandSchema } from './dtos';
import {
  CLOCK,
  DOMAIN_EVENT_BUS,
  PASSWORD_HASHER,
  REFRESH_TOKEN_REPOSITORY,
  TOKEN_SERVICE,
  USER_IDENTITY_PROVIDER,
} from './di-tokens';

/**
 * FR-AUTH-001 — authenticate with email and password.
 *
 * Flow (ADR-0010):
 * 1. Look up user by email.
 * 2. Verify password against argon2id hash.
 * 3. Reject if user not found, password wrong, or user DISABLED (FR-USR-003).
 * 4. Mint access JWT (15-min) + opaque refresh token (7-day).
 * 5. Persist refresh token HASH; emit UserLoggedIn event.
 */
@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(USER_IDENTITY_PROVIDER) private readonly users: UserIdentityProvider,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasher,
    @Inject(TOKEN_SERVICE) private readonly tokens: TokenService,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshRepo: RefreshTokenRepository,
    @Inject(DOMAIN_EVENT_BUS) private readonly events: DomainEventBus,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async execute(command: LoginCommand): Promise<LoginResult> {
    const valid = loginCommandSchema.safeParse(command);
    if (!valid.success) {
      throw new InvalidCredentialsError();
    }
    const { email, password } = valid.data;

    const user = await this.users.findByEmail(email);
    if (!user) {
      throw new InvalidCredentialsError();
    }

    const ok = await this.hasher.verify(password, user.passwordHash);
    if (!ok) {
      throw new InvalidCredentialsError();
    }

    if (user.status === 'DISABLED') {
      throw new UserDisabledError(user.id);
    }

    const principal = this.users.toPrincipal(user);
    const now = this.clock.now();

    const accessToken = await this.tokens.mintAccessToken(principal, now);
    const refreshToken = await this.tokens.generateRefreshToken(user.id, now);

    const tokenId = createId() as DomainId;
    const familyId = createId() as DomainId;
    const aggregate = RefreshToken.create({
      id: tokenId,
      userId: user.id,
      tokenHash: refreshToken.hash,
      familyId,
      expiresAt: refreshToken.expiresAt,
      createdAt: now,
    });
    await this.refreshRepo.save(aggregate);

    await this.events.publish({
      type: 'UserLoggedIn',
      userId: user.id,
      at: now,
    });

    return {
      accessToken: accessToken.token,
      accessTokenExpiresAt: accessToken.expiresAt.toISOString(),
      refreshToken: refreshToken.rawToken,
    };
  }
}
