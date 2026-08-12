import { describe, expect, it } from 'vitest';
import { RefreshUseCase } from './refresh.use-case';
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
import {
  RefreshTokenExpiredError,
  RefreshTokenNotFoundError,
  RefreshTokenReusedError,
} from '../domain';

const T0 = new Date('2026-07-31T10:00:00Z');

function build(initialNow: Date = T0) {
  const users = new Map([['user-1', makeUserRecord()]]);
  const identity = new InMemoryUserIdentityProvider(users);
  const hasher = new FakePasswordHasher();
  const tokens = new FakeTokenService();
  const refreshRepo = new InMemoryRefreshTokenRepository();
  const events = new CapturingEventBus();
  const clock = new FixedClock(initialNow);
  const login = new LoginUseCase(identity, hasher, tokens, refreshRepo, events, clock);
  const refresh = new RefreshUseCase(identity, tokens, refreshRepo, events, clock);
  return { login, refresh, users, tokens, refreshRepo, events, clock };
}

describe('RefreshUseCase', () => {
  it('rotates the refresh token and mints a new access token', async () => {
    const { login, refresh, refreshRepo } = build();
    const loginResult = await login.execute({
      email: 'planner@marineops.local',
      password: 'correct-horse-battery',
    });

    const result = await refresh.execute({ refreshToken: loginResult.refreshToken });

    expect(result.accessToken).toMatch(/^access-/);
    expect(result.refreshToken).not.toBe(loginResult.refreshToken);

    // The old token is now revoked; the new one is usable.
    const oldHash = await new FakeTokenService().hashRefreshToken(loginResult.refreshToken);
    const newHash = await new FakeTokenService().hashRefreshToken(result.refreshToken);
    const old = await refreshRepo.findByHash(oldHash);
    const next = await refreshRepo.findByHash(newHash);
    expect(old?.isRevoked()).toBe(true);
    expect(old?.replacedBy).toBe(next?.id);
    expect(next?.isUsable(T0)).toBe(true);
    // Same family — the chain is preserved.
    expect(next?.familyId).toBe(old?.familyId);
  });

  it('invalidates the entire family on reuse of a revoked token (theft signal)', async () => {
    const { login, refresh, refreshRepo, events } = build();
    const loginResult = await login.execute({
      email: 'planner@marineops.local',
      password: 'correct-horse-battery',
    });

    // First legitimate rotation.
    const rotated = await refresh.execute({ refreshToken: loginResult.refreshToken });

    // Attacker replays the ORIGINAL (now-revoked) token.
    await expect(
      refresh.execute({ refreshToken: loginResult.refreshToken }),
    ).rejects.toBeInstanceOf(RefreshTokenReusedError);

    // The rotated (valid) token must now also be revoked — family is burned.
    const rotatedHash = await new FakeTokenService().hashRefreshToken(rotated.refreshToken);
    const rotatedRecord = await refreshRepo.findByHash(rotatedHash);
    expect(rotatedRecord?.isRevoked()).toBe(true);

    expect(events.events.some((e) => e.type === 'RefreshTokenReused')).toBe(true);
  });

  it('rejects an unknown refresh token without revoking anything', async () => {
    const { refresh, events } = build();
    await expect(
      refresh.execute({ refreshToken: 'never-issued-refresh-token' }),
    ).rejects.toBeInstanceOf(RefreshTokenNotFoundError);
    expect(events.events).toHaveLength(0);
  });

  it('rejects an expired refresh token', async () => {
    const { login, refresh, refreshRepo, tokens } = build();
    const loginResult = await login.execute({
      email: 'planner@marineops.local',
      password: 'correct-horse-battery',
    });
    // Force the stored token into the past.
    const hash = await tokens.hashRefreshToken(loginResult.refreshToken);
    const stored = await refreshRepo.findByHash(hash);
    expect(stored).not.toBeNull();
    // Mutate expiry to the past by re-creating from state with an old expiresAt.
    const past = new Date(T0.getTime() - 1000);
    const expired = stored!.toState();
    // Build an expired record directly via the aggregate.
    const { RefreshToken } = await import('../domain/refresh-token.aggregate');
    await refreshRepo.save(
      RefreshToken.create({
        id: expired.id,
        userId: expired.userId,
        tokenHash: expired.tokenHash,
        familyId: expired.familyId,
        expiresAt: past,
        createdAt: expired.createdAt,
      }),
    );

    await expect(
      refresh.execute({ refreshToken: loginResult.refreshToken }),
    ).rejects.toBeInstanceOf(RefreshTokenExpiredError);
  });

  it('revokes the family when the user has been disabled since login', async () => {
    const { login, refresh, users } = build();
    const loginResult = await login.execute({
      email: 'planner@marineops.local',
      password: 'correct-horse-battery',
    });
    users.set('user-1', makeUserRecord({ status: 'DISABLED' }));
    await expect(
      refresh.execute({ refreshToken: loginResult.refreshToken }),
    ).rejects.toBeInstanceOf(RefreshTokenExpiredError);
  });
});
