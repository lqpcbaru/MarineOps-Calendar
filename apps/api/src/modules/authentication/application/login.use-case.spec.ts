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
import { InvalidCredentialsError, RefreshToken, UserDisabledError } from '../domain';
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
  return { useCase, users, hasher, tokens, refreshRepo, events };
}

describe('LoginUseCase', () => {
  // Nothing else in the system deletes a refresh token row, so without
  // pruning the table grows for the life of the deployment: one row per
  // login plus one per rotation, none removed when they expire.
  describe('expired refresh token pruning', () => {
    function seedToken(
      repo: InMemoryRefreshTokenRepository,
      opts: { id: string; userId: string; expiresAt: Date; revoked?: boolean },
    ) {
      let token = RefreshToken.create({
        id: opts.id,
        userId: opts.userId,
        tokenHash: `hash-${opts.id}`,
        familyId: `family-${opts.id}`,
        expiresAt: opts.expiresAt,
        createdAt: new Date(opts.expiresAt.getTime() - 1000),
      });
      if (opts.revoked) token = token.revoke(new Date(opts.expiresAt.getTime() - 500));
      return repo.save(token);
    }

    it('removes expired tokens belonging to the logging-in user', async () => {
      const { useCase, refreshRepo } = build();
      await seedToken(refreshRepo, {
        id: 'stale-1',
        userId: 'user-1',
        expiresAt: new Date(now.getTime() - 60_000),
      });
      await seedToken(refreshRepo, {
        id: 'stale-2',
        userId: 'user-1',
        expiresAt: new Date(now.getTime() - 1),
      });

      await useCase.execute({
        email: 'planner@marineops.local',
        password: 'correct-horse-battery',
      });

      expect(await refreshRepo.findById('stale-1')).toBeNull();
      expect(await refreshRepo.findById('stale-2')).toBeNull();
      // Only the token this login just minted remains.
      expect(refreshRepo.size).toBe(1);
    });

    it('keeps unexpired tokens, so other live sessions survive a login', async () => {
      const { useCase, refreshRepo } = build();
      await seedToken(refreshRepo, {
        id: 'live-1',
        userId: 'user-1',
        expiresAt: new Date(now.getTime() + 60_000),
      });

      await useCase.execute({
        email: 'planner@marineops.local',
        password: 'correct-horse-battery',
      });

      expect(await refreshRepo.findById('live-1')).not.toBeNull();
    });

    // Reuse detection finds a REVOKED row and revokes its whole family.
    // Deleting a revoked-but-unexpired token would downgrade a detectable
    // replay to an unknown token: still a 401, but the family would
    // survive and a thief could keep using the rest of it.
    it('keeps revoked-but-unexpired tokens, so reuse detection still fires', async () => {
      const { useCase, refreshRepo } = build();
      await seedToken(refreshRepo, {
        id: 'revoked-live',
        userId: 'user-1',
        expiresAt: new Date(now.getTime() + 60_000),
        revoked: true,
      });

      await useCase.execute({
        email: 'planner@marineops.local',
        password: 'correct-horse-battery',
      });

      expect(await refreshRepo.findById('revoked-live')).not.toBeNull();
    });

    it('leaves expired tokens belonging to a different user alone', async () => {
      const { useCase, refreshRepo } = build();
      await seedToken(refreshRepo, {
        id: 'other-user-stale',
        userId: 'user-2',
        expiresAt: new Date(now.getTime() - 60_000),
      });

      await useCase.execute({
        email: 'planner@marineops.local',
        password: 'correct-horse-battery',
      });

      expect(await refreshRepo.findById('other-user-stale')).not.toBeNull();
    });

    // The user is authenticated and their new token is already persisted by
    // the time pruning runs; a housekeeping failure must not undo that.
    it('still logs in when pruning fails', async () => {
      const { useCase, refreshRepo } = build();
      refreshRepo.deleteExpired = async () => {
        throw new Error('database unavailable');
      };

      const result = await useCase.execute({
        email: 'planner@marineops.local',
        password: 'correct-horse-battery',
      });

      expect(result.accessToken).toMatch(/^access-/);
    });
  });

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

  it('runs password verification even for an unknown email (timing-safe against enumeration)', async () => {
    const { useCase, hasher } = build();
    await expect(
      useCase.execute({ email: 'nobody@marineops.local', password: 'whatever-password' }),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);
    expect(hasher.verifyCallCount).toBe(1);
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
