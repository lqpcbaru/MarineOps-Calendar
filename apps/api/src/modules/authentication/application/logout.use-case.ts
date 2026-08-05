import { Inject, Injectable } from '@nestjs/common';
import { type DomainEventBus } from '../domain';
import type { Clock, LogoutCommand, RefreshTokenRepository, TokenService } from './contracts';
import { logoutCommandSchema } from './dtos';
import { CLOCK, DOMAIN_EVENT_BUS, REFRESH_TOKEN_REPOSITORY, TOKEN_SERVICE } from './di-tokens';

/**
 * FR-AUTH-003 — logout invalidates the refresh token and (via controller)
 * clears the httpOnly cookie. The access token expires naturally within its
 * short TTL window (ADR-0010 §2).
 */
@Injectable()
export class LogoutUseCase {
  constructor(
    @Inject(TOKEN_SERVICE) private readonly tokens: TokenService,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshRepo: RefreshTokenRepository,
    @Inject(DOMAIN_EVENT_BUS) private readonly events: DomainEventBus,
    @Inject(CLOCK) private readonly clock: Clock,
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
