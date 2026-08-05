import { describe, expect, it } from 'vitest';
import { LogoutUseCase } from './logout.use-case';
import { LoginUseCase } from './login.use-case';
import {
  CapturingEventBus,
  FakePasswordHasher,
  FakeTokenService,
  FixedClock,
  InMemoryRefreshTokenRepository,
  InMemoryUserIdentityProvider,
  makeUserRecord,
} from './test-doubles';

const now = new Date('2026-07-31T10:00:00Z');

function build() {
  const users = new Map([['user-1', makeUserRecord()]]);
  const identity = new InMemoryUserIdentityProvider(users);
  const hasher = new FakePasswordHasher();
  const tokens = new FakeTokenService();
  const refreshRepo = new InMemoryRefreshTokenRepository();
  const events = new CapturingEventBus();
  const clock = new FixedClock(now);
  const login = new LoginUseCase(identity, hasher, tokens, refreshRepo, events, clock);
  const logout = new LogoutUseCase(tokens, refreshRepo, events, clock);
  return { login, logout, tokens, refreshRepo, events };
}

describe('LogoutUseCase', () => {
  it('revokes the presented refresh token and emits UserLoggedOut', async () => {
    const { login, logout, tokens, refreshRepo, events } = build();
    const { refreshToken } = await login.execute({
      email: 'planner@marineops.local',
      password: 'correct-horse-battery',
    });

    await logout.execute({ refreshToken });

    const hash = await tokens.hashRefreshToken(refreshToken);
    const stored = await refreshRepo.findByHash(hash);
    expect(stored?.isRevoked()).toBe(true);
    expect(events.events).toContainEqual({
      type: 'UserLoggedOut',
      userId: 'user-1',
      at: now,
    });
  });

  it('is idempotent — logging out an unknown token does not throw', async () => {
    const { logout, events } = build();
    await expect(logout.execute({ refreshToken: 'never-issued' })).resolves.toBeUndefined();
    expect(events.events).toHaveLength(0);
  });

  it('is idempotent — logging out twice does not double-publish the event', async () => {
    const { login, logout, events } = build();
    const { refreshToken } = await login.execute({
      email: 'planner@marineops.local',
      password: 'correct-horse-battery',
    });
    await logout.execute({ refreshToken });
    await logout.execute({ refreshToken });
    expect(events.events.filter((e) => e.type === 'UserLoggedOut')).toHaveLength(1);
  });
});
