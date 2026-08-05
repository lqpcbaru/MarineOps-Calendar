import { describe, expect, it } from 'vitest';
import { GetUsersUseCase } from './get-users.use-case';
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

describe('GetUsersUseCase', () => {
  it('finds user by id', async () => {
    const repo = new InMemoryUserRepository();
    repo.seed([makeUser()]);
    const useCase = new GetUsersUseCase(repo);

    const user = await useCase.findById('user-1');
    expect(user.email).toBe('test@marineops.local');
  });

  it('throws when user not found', async () => {
    const repo = new InMemoryUserRepository();
    const useCase = new GetUsersUseCase(repo);

    await expect(useCase.findById('nonexistent')).rejects.toBeInstanceOf(UserNotFoundError);
  });

  it('lists users with pagination', async () => {
    const repo = new InMemoryUserRepository();
    repo.seed([
      makeUser({ id: 'user-1', email: 'a@test.com' }),
      makeUser({ id: 'user-2', email: 'b@test.com' }),
      makeUser({ id: 'user-3', email: 'c@test.com' }),
    ]);
    const useCase = new GetUsersUseCase(repo);

    const result = await useCase.list({ page: 1, pageSize: 2 });
    expect(result.users).toHaveLength(2);
    expect(result.total).toBe(3);
  });
});
