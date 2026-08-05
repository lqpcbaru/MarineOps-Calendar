import { Inject, Injectable } from '@nestjs/common';
import { RoleNotFoundError, RoleHasUsersError } from '../domain';
import type { RoleRepository } from './ports';
import { ROLE_REPOSITORY } from './di-tokens';

@Injectable()
export class DeleteRoleUseCase {
  constructor(@Inject(ROLE_REPOSITORY) private readonly roleRepo: RoleRepository) {}

  async execute(id: string): Promise<void> {
    const existing = await this.roleRepo.findById(id);
    if (!existing) throw new RoleNotFoundError(id);

    const userCount = await this.roleRepo.getUserCount(id);
    if (userCount > 0) throw new RoleHasUsersError(id, userCount);

    await this.roleRepo.delete(id);
  }
}
