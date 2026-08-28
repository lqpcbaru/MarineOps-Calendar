import { describe, expect, it } from 'vitest';
import { UpdateRoleUseCase } from './update-role.use-case';
import { InMemoryRoleRepository } from './test-doubles';
import { RoleNotFoundError, RoleNameExistsError } from '../domain';
import { RecordAuditUseCase } from '../../audit/application/record-audit.use-case';
import { InMemoryAuditRepository } from '../../audit/application/test-doubles';

describe('UpdateRoleUseCase', () => {
  it('updates role name and permissions and records the audit entry', async () => {
    const repo = new InMemoryRoleRepository();
    repo.seed([
      {
        id: 'role-1',
        name: 'OldName',
        permissionCodes: ['read'],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    const auditRepo = new InMemoryAuditRepository();
    const useCase = new UpdateRoleUseCase(repo, new RecordAuditUseCase(auditRepo));

    const updated = await useCase.execute(
      'role-1',
      { name: 'NewName', permissionCodes: ['read', 'write'] },
      'user-admin',
    );
    expect(updated.name).toBe('NewName');
    expect(updated.permissionCodes).toEqual(['read', 'write']);
    expect(auditRepo.events).toHaveLength(1);
    expect(auditRepo.events[0]).toMatchObject({
      actorId: 'user-admin',
      action: 'role.update',
      entityType: 'role',
      entityId: 'role-1',
    });
  });

  it('rejects when new name conflicts', async () => {
    const repo = new InMemoryRoleRepository();
    repo.seed([
      {
        id: 'role-1',
        name: 'First',
        permissionCodes: ['read'],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'role-2',
        name: 'Second',
        permissionCodes: ['write'],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    const useCase = new UpdateRoleUseCase(
      repo,
      new RecordAuditUseCase(new InMemoryAuditRepository()),
    );

    await expect(useCase.execute('role-1', { name: 'Second' })).rejects.toBeInstanceOf(
      RoleNameExistsError,
    );
  });

  it('throws when role not found', async () => {
    const repo = new InMemoryRoleRepository();
    const useCase = new UpdateRoleUseCase(
      repo,
      new RecordAuditUseCase(new InMemoryAuditRepository()),
    );

    await expect(useCase.execute('nonexistent', { name: 'X' })).rejects.toBeInstanceOf(
      RoleNotFoundError,
    );
  });
});
