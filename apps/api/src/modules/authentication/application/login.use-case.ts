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
import { LoggingService } from '../../../platform/logging.service';
import {
  CLOCK,
  DOMAIN_EVENT_BUS,
  PASSWORD_HASHER,
  REFRESH_TOKEN_REPOSITORY,
  TOKEN_SERVICE,
  USER_IDENTITY_PROVIDER,
} from './di-tokens';

/**
 * A valid argon2id hash with no corresponding real password. Verifying
 * against this when the user doesn't exist keeps the login use case's
 * response time indistinguishable from a wrong-password rejection, so an
 * attacker can't enumerate registered emails via timing.
 */
const DUMMY_PASSWORD_HASH =
  '$argon2id$v=19$m=19456,p=1,t=2$EY+Ie6Z8G1KE6NnB/uXirg$sCSOVjk56pLVG2AAEHsBQjQUw/12+vMlJ38ZIEKX6G4';

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
  private readonly logger = new LoggingService('LoginUseCase');

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

    // Always run the full argon2id verification, even for an unknown email,
    // against a dummy hash — so response timing can't be used to enumerate
    // which emails are registered.
    const ok = await this.hasher.verify(password, user?.passwordHash ?? DUMMY_PASSWORD_HASH);
    if (!user || !ok) {
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

    // Nothing else ever deletes a refresh token row, so without this the
    // table grows for the life of the deployment: one row per login plus
    // one per rotation, none of which are removed when they expire. That
    // is both unbounded growth and an indefinitely retained pile of
    // expired credential hashes.
    //
    // Pruning here keeps the work bounded to the one user who just logged
    // in and served by an existing index, rather than needing a sweep job
    // (there is no scheduler running in this application). It must never
    // fail a login: the user is already authenticated and their token is
    // already persisted by this point.
    try {
      await this.refreshRepo.deleteExpired(user.id, now);
    } catch (error) {
      this.logger.warn('Failed to prune expired refresh tokens', {
        userId: user.id,
        error: error instanceof Error ? error.message : String(error),
      });
    }

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
