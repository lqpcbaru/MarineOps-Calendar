import { describe, expect, it } from 'vitest';
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
import { InvalidCredentialsError, UserDisabledError } from '../domain';
import { ValidationError } from '../../../shared-kernel';

const now = new Date('2026-07-31T10:00:00Z');

function build() {
  const users = new Map([['user-1', makeUserRecord()]]);
  const identity = new InMemoryUserIdentityProvider(users);
  const hasher = new FakePasswordHasher();
  const tokens = new FakeTokenService();
  const refreshRepo = new InMemoryRefreshTokenRepository();
  const events = new CapturingEventBus();
  const clock = new FixedClock(now);
  const useCase = new LoginUseCase(identity, hasher, tokens, refreshRepo, events, clock);
  return { useCase, users, tokens, refreshRepo, events };
}

describe('LoginUseCase', () => {
  it('logs in an active user with correct password and persists refresh hash', async () => {
    const { useCase, refreshRepo, events } = build();
    const result = await useCase.execute({
      email: 'planner@marineops.local',
      password: 'correct-horse-battery',
    });

    expect(result.accessToken).toMatch(/^access-/);
    expect(result.accessTokenExpiresAt).toBeDefined();
    expect(result.refreshToken).toMatch(/^refresh-/);
    expect(events.events).toContainEqual({
      type: 'UserLoggedIn',
      userId: 'user-1',
      at: now,
    });
    // The raw token must NOT be stored; only its hash.
    const stored = await refreshRepo.findByHash(
      // re-hash to look up — the repo stores by hash, which the fake service produced
      await new FakeTokenService().hashRefreshToken(result.refreshToken),
    );
    expect(stored).not.toBeNull();
    expect(stored?.userId).toBe('user-1');
    expect(stored?.isRevoked()).toBe(false);
  });

  it('rejects unknown email', async () => {
    const { useCase } = build();
    await expect(
      useCase.execute({ email: 'nobody@marineops.local', password: 'whatever-password' }),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);
  });

  it('rejects wrong password', async () => {
    const { useCase } = build();
    await expect(
      useCase.execute({ email: 'planner@marineops.local', password: 'wrong-password' }),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);
  });

  it('rejects a disabled user (FR-USR-003)', async () => {
    const { useCase, users } = build();
    users.set('user-1', makeUserRecord({ status: 'DISABLED' }));
    await expect(
      useCase.execute({ email: 'planner@marineops.local', password: 'correct-horse-battery' }),
    ).rejects.toBeInstanceOf(UserDisabledError);
  });

  it('rejects malformed command (validation)', async () => {
    const { useCase } = build();
    await expect(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      useCase.execute({ email: 'not-an-email', password: 'short' } as any),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);
  });

  it('never throws ValidationError directly — maps all credential issues to InvalidCredentials', async () => {
    const { useCase, events } = build();
    try {
      await useCase.execute({ email: '', password: '' });
    } catch (e) {
      expect(e).not.toBeInstanceOf(ValidationError);
    }
    expect(events.events).toHaveLength(0);
  });
});
