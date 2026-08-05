import { describe, expect, it } from 'vitest';
import { UpdateUserUseCase } from './update-user.use-case';
import { InMemoryUserRepository } from './test-doubles';
import { UserNotFoundError } from '../domain';
import type { UserRecord } from '../domain';

const makeUser = (overrides: Partial<UserRecord> = {}): UserRecord => ({
  id: 'user-1',
  email: 'test@marineops.local',
  name: 'Test User',
  passwordHash: 'hash',
  status: 'ACTIVE',
  timezone: 'UTC',
  locale: 'en',
  roleIds: ['role-1'],
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe('UpdateUserUseCase', () => {
  it('updates user fields', async () => {
    const repo = new InMemoryUserRepository();
    repo.seed([makeUser()]);
    const useCase = new UpdateUserUseCase(repo);

    const updated = await useCase.execute('user-1', { name: 'New Name', timezone: 'Asia/Kolkata' });
    expect(updated.name).toBe('New Name');
    expect(updated.timezone).toBe('Asia/Kolkata');
    expect(updated.email).toBe('test@marineops.local');
  });

  it('throws when user not found', async () => {
    const repo = new InMemoryUserRepository();
    const useCase = new UpdateUserUseCase(repo);

    await expect(useCase.execute('nonexistent', { name: 'X' })).rejects.toBeInstanceOf(
      UserNotFoundError,
    );
  });
});
