import { describe, expect, it } from 'vitest';
import { DeleteRoleUseCase } from './delete-role.use-case';
import { InMemoryRoleRepository } from './test-doubles';
import { RoleNotFoundError, RoleHasUsersError } from '../domain';
import { RecordAuditUseCase } from '../../audit/application/record-audit.use-case';
import { InMemoryAuditRepository } from '../../audit/application/test-doubles';

describe('DeleteRoleUseCase', () => {
  it('deletes a role with no users assigned and records the audit entry', async () => {
    const repo = new InMemoryRoleRepository();
    repo.seed([
      {
        id: 'role-1',
        name: 'TestRole',
        permissionCodes: ['read'],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    repo.setUserCount('role-1', 0);
    const auditRepo = new InMemoryAuditRepository();
    const useCase = new DeleteRoleUseCase(repo, new RecordAuditUseCase(auditRepo));

    await expect(useCase.execute('role-1', 'user-admin')).resolves.toBeUndefined();
    const found = await repo.findById('role-1');
    expect(found).toBeNull();
    expect(auditRepo.events).toHaveLength(1);
    expect(auditRepo.events[0]).toMatchObject({
      actorId: 'user-admin',
      action: 'role.delete',
      entityType: 'role',
      entityId: 'role-1',
    });
  });

  it('rejects when role has users assigned', async () => {
    const repo = new InMemoryRoleRepository();
    repo.seed([
      {
        id: 'role-1',
        name: 'TestRole',
        permissionCodes: ['read'],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    repo.setUserCount('role-1', 3);
    const useCase = new DeleteRoleUseCase(
      repo,
      new RecordAuditUseCase(new InMemoryAuditRepository()),
    );

    await expect(useCase.execute('role-1')).rejects.toBeInstanceOf(RoleHasUsersError);
  });

  it('throws when role not found', async () => {
    const repo = new InMemoryRoleRepository();
    const useCase = new DeleteRoleUseCase(
      repo,
      new RecordAuditUseCase(new InMemoryAuditRepository()),
    );

    await expect(useCase.execute('nonexistent')).rejects.toBeInstanceOf(RoleNotFoundError);
  });
});
