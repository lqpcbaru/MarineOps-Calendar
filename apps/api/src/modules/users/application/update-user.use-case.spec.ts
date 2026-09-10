import { describe, expect, it } from 'vitest';
import { UpdateUserUseCase } from './update-user.use-case';
import { InMemoryUserRepository } from './test-doubles';
import { UserNotFoundError } from '../domain';
import type { UserRecord } from '../domain';
import { RecordAuditUseCase } from '../../audit/application/record-audit.use-case';
import { InMemoryAuditRepository } from '../../audit/application/test-doubles';

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
  it('updates user fields and records the audit entry', async () => {
    const repo = new InMemoryUserRepository();
    repo.seed([makeUser()]);
    const auditRepo = new InMemoryAuditRepository();
    const useCase = new UpdateUserUseCase(repo, new RecordAuditUseCase(auditRepo));

    const updated = await useCase.execute(
      'user-1',
      { name: 'New Name', timezone: 'Asia/Kolkata' },
      'user-admin',
    );
    expect(updated.name).toBe('New Name');
    expect(updated.timezone).toBe('Asia/Kolkata');
    expect(updated.email).toBe('test@marineops.local');
    expect(auditRepo.events).toHaveLength(1);
    expect(auditRepo.events[0]).toMatchObject({
      actorId: 'user-admin',
      action: 'user.update',
      entityType: 'user',
      entityId: 'user-1',
    });
  });

  it('throws when user not found', async () => {
    const repo = new InMemoryUserRepository();
    const useCase = new UpdateUserUseCase(
      repo,
      new RecordAuditUseCase(new InMemoryAuditRepository()),
    );

    await expect(useCase.execute('nonexistent', { name: 'X' })).rejects.toBeInstanceOf(
      UserNotFoundError,
    );
  });
});
