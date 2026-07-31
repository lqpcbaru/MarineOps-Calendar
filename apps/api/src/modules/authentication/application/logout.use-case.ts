import {
  RefreshTokenNotFoundError,
  type DomainEventBus,
} from '../domain';
import {
  type Clock,
  type LogoutCommand,
  type RefreshTokenRepository,
  type TokenService,
} from './contracts';
import { logoutCommandSchema } from './dtos';

/**
 * FR-AUTH-003 — logout invalidates the refresh token and (via controller)
 * clears the httpOnly cookie. The access token expires naturally within its
 * short TTL window (ADR-0010 §2).
 */
export class LogoutUseCase {
  constructor(
    private readonly tokens: TokenService,
    private readonly refreshRepo: RefreshTokenRepository,
    private readonly events: DomainEventBus,
    private readonly clock: Clock,
  ) {}

  async execute(command: LogoutCommand): Promise<void> {
    const valid = logoutCommandSchema.safeParse(command);
    if (!valid.success) {
      // Treat malformed logout as a no-op rather than leaking the reason.
      return;
    }
    const { refreshToken: rawToken } = valid.data;
    const now = this.clock.now();

    const tokenHash = await this.tokens.hashRefreshToken(rawToken);
    const existing = await this.refreshRepo.findByHash(tokenHash);

    if (!existing) {
      // Idempotent: already logged out / token unknown. Still clear cookie client-side.
      return;
    }

    if (!existing.isRevoked()) {
      await this.refreshRepo.save(existing.revoke(now));
      await this.events.publish({
        type: 'UserLoggedOut',
        userId: existing.userId,
        at: now,
      });
    }
  }
}

export { RefreshTokenNotFoundError };
