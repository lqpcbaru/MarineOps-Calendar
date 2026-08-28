import { describe, expect, it } from 'vitest';
import { DisableUserUseCase } from './disable-user.use-case';
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

describe('DisableUserUseCase', () => {
  it('disables an active user and records the audit entry', async () => {
    const repo = new InMemoryUserRepository();
    repo.seed([makeUser()]);
    const auditRepo = new InMemoryAuditRepository();
    const useCase = new DisableUserUseCase(repo, new RecordAuditUseCase(auditRepo));

    const disabled = await useCase.execute('user-1', 'user-admin');
    expect(disabled.status).toBe('DISABLED');
    expect(auditRepo.events).toHaveLength(1);
    expect(auditRepo.events[0]).toMatchObject({
      actorId: 'user-admin',
      action: 'user.disable',
      entityType: 'user',
      entityId: 'user-1',
    });
  });

  it('throws when user not found', async () => {
    const repo = new InMemoryUserRepository();
    const useCase = new DisableUserUseCase(
      repo,
      new RecordAuditUseCase(new InMemoryAuditRepository()),
    );

    await expect(useCase.execute('nonexistent')).rejects.toBeInstanceOf(UserNotFoundError);
  });
});
