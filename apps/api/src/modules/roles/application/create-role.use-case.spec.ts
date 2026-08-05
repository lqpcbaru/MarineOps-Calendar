import { describe, expect, it } from 'vitest';
import { CreateRoleUseCase } from './create-role.use-case';
import { InMemoryRoleRepository } from './test-doubles';
import { RoleNameExistsError } from '../domain';

describe('CreateRoleUseCase', () => {
  it('creates a role with permission codes', async () => {
    const repo = new InMemoryRoleRepository();
    const useCase = new CreateRoleUseCase(repo);

    const role = await useCase.execute({ name: 'TestRole', permissionCodes: ['read', 'write'] });
    expect(role.name).toBe('TestRole');
    expect(role.permissionCodes).toEqual(['read', 'write']);
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
    const useCase = new CreateRoleUseCase(repo);

    await expect(
      useCase.execute({ name: 'Existing', permissionCodes: ['read'] }),
    ).rejects.toBeInstanceOf(RoleNameExistsError);
  });
});
