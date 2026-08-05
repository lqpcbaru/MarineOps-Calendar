import { describe, expect, it } from 'vitest';
import { DeleteRoleUseCase } from './delete-role.use-case';
import { InMemoryRoleRepository } from './test-doubles';
import { RoleNotFoundError, RoleHasUsersError } from '../domain';

describe('DeleteRoleUseCase', () => {
  it('deletes a role with no users assigned', async () => {
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
    const useCase = new DeleteRoleUseCase(repo);

    await expect(useCase.execute('role-1')).resolves.toBeUndefined();
    const found = await repo.findById('role-1');
    expect(found).toBeNull();
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
    const useCase = new DeleteRoleUseCase(repo);

    await expect(useCase.execute('role-1')).rejects.toBeInstanceOf(RoleHasUsersError);
  });

  it('throws when role not found', async () => {
    const repo = new InMemoryRoleRepository();
    const useCase = new DeleteRoleUseCase(repo);

    await expect(useCase.execute('nonexistent')).rejects.toBeInstanceOf(RoleNotFoundError);
  });
});
