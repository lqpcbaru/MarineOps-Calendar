import { describe, expect, it } from 'vitest';
import { CreateUserUseCase } from './create-user.use-case';
import { InMemoryUserRepository } from './test-doubles';
import { FakePasswordHasher } from '../../authentication/application/test-doubles';
import { UserEmailExistsError } from '../domain';

describe('CreateUserUseCase', () => {
  it('creates a user with hashed password', async () => {
    const repo = new InMemoryUserRepository();
    const hasher = new FakePasswordHasher();
    const useCase = new CreateUserUseCase(repo, hasher);

    const user = await useCase.execute({
      email: 'test@marineops.local',
      name: 'Test User',
      password: 'password123',
      roleIds: ['role-1'],
    });

    expect(user.email).toBe('test@marineops.local');
    expect(user.name).toBe('Test User');
    expect(user.status).toBe('ACTIVE');
    expect(user.passwordHash).toBe('fake:password123');
    expect(user.roleIds).toEqual(['role-1']);
  });

  it('rejects duplicate email', async () => {
    const repo = new InMemoryUserRepository();
    repo.seed([
      {
        id: 'user-1',
        email: 'dup@marineops.local',
        name: 'Existing',
        passwordHash: 'x',
        status: 'ACTIVE',
        timezone: 'UTC',
        locale: 'en',
        roleIds: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    const hasher = new FakePasswordHasher();
    const useCase = new CreateUserUseCase(repo, hasher);

    await expect(
      useCase.execute({
        email: 'dup@marineops.local',
        name: 'Dup',
        password: 'password123',
        roleIds: ['role-1'],
      }),
    ).rejects.toBeInstanceOf(UserEmailExistsError);
  });
});
