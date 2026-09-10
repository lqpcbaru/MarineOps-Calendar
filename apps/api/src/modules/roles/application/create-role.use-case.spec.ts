import { describe, expect, it } from 'vitest';
import { CreateRoleUseCase } from './create-role.use-case';
import { InMemoryRoleRepository } from './test-doubles';
import { RoleNameExistsError } from '../domain';
import { RecordAuditUseCase } from '../../audit/application/record-audit.use-case';
import { InMemoryAuditRepository } from '../../audit/application/test-doubles';

describe('CreateRoleUseCase', () => {
  it('creates a role with permission codes and records the audit entry', async () => {
    const repo = new InMemoryRoleRepository();
    const auditRepo = new InMemoryAuditRepository();
    const useCase = new CreateRoleUseCase(repo, new RecordAuditUseCase(auditRepo));

    const role = await useCase.execute(
      { name: 'TestRole', permissionCodes: ['read', 'write'] },
      'user-admin',
    );
    expect(role.name).toBe('TestRole');
    expect(role.permissionCodes).toEqual(['read', 'write']);
    expect(auditRepo.events).toHaveLength(1);
    expect(auditRepo.events[0]).toMatchObject({
      actorId: 'user-admin',
      action: 'role.create',
      entityType: 'role',
      entityId: role.id,
    });
  });

  it('rejects duplicate name', async () => {
    const repo = new InMemoryRoleRepository();
    repo.seed([
      {
        id: 'role-1',
        name: 'Existing',
        permissionCodes: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    const useCase = new CreateRoleUseCase(
      repo,
      new RecordAuditUseCase(new InMemoryAuditRepository()),
    );

    await expect(
      useCase.execute({ name: 'Existing', permissionCodes: ['read'] }),
    ).rejects.toBeInstanceOf(RoleNameExistsError);
  });
});
