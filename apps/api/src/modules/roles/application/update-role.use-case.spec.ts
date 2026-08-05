import { describe, expect, it } from 'vitest';
import { UpdateRoleUseCase } from './update-role.use-case';
import { InMemoryRoleRepository } from './test-doubles';
import { RoleNotFoundError, RoleNameExistsError } from '../domain';

describe('UpdateRoleUseCase', () => {
  it('updates role name and permissions', async () => {
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
    const useCase = new UpdateRoleUseCase(repo);

    const updated = await useCase.execute('role-1', {
      name: 'NewName',
      permissionCodes: ['read', 'write'],
    });
    expect(updated.name).toBe('NewName');
    expect(updated.permissionCodes).toEqual(['read', 'write']);
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
    const useCase = new UpdateRoleUseCase(repo);

    await expect(useCase.execute('role-1', { name: 'Second' })).rejects.toBeInstanceOf(
      RoleNameExistsError,
    );
  });

  it('throws when role not found', async () => {
    const repo = new InMemoryRoleRepository();
    const useCase = new UpdateRoleUseCase(repo);

    await expect(useCase.execute('nonexistent', { name: 'X' })).rejects.toBeInstanceOf(
      RoleNotFoundError,
    );
  });
});
