import { describe, expect, it } from 'vitest';
import { CreateUserUseCase } from './create-user.use-case';
import { InMemoryUserRepository } from './test-doubles';
import { FakePasswordHasher } from '../../authentication/application/test-doubles';
import { UserEmailExistsError } from '../domain';
import { RecordAuditUseCase } from '../../audit/application/record-audit.use-case';
import { InMemoryAuditRepository } from '../../audit/application/test-doubles';

describe('CreateUserUseCase', () => {
  it('creates a user with hashed password and records the audit entry', async () => {
    const repo = new InMemoryUserRepository();
    const hasher = new FakePasswordHasher();
    const auditRepo = new InMemoryAuditRepository();
    const useCase = new CreateUserUseCase(repo, hasher, new RecordAuditUseCase(auditRepo));

    const user = await useCase.execute(
      {
        email: 'test@marineops.local',
        name: 'Test User',
        password: 'password123',
        roleIds: ['role-1'],
      },
      'user-admin',
    );

    expect(user.email).toBe('test@marineops.local');
    expect(user.name).toBe('Test User');
    expect(user.status).toBe('ACTIVE');
    expect(user.passwordHash).toBe('fake:password123');
    expect(user.roleIds).toEqual(['role-1']);
    expect(auditRepo.events).toHaveLength(1);
    expect(auditRepo.events[0]).toMatchObject({
      actorId: 'user-admin',
      action: 'user.create',
      entityType: 'user',
      entityId: user.id,
    });
    expect(auditRepo.events[0]!.payload).not.toHaveProperty('password');
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
    const useCase = new CreateUserUseCase(
      repo,
      hasher,
      new RecordAuditUseCase(new InMemoryAuditRepository()),
    );

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
