import { Inject, Injectable } from '@nestjs/common';
import type { RoleRecord } from '../domain';
import { RoleNotFoundError, RoleNameExistsError } from '../domain';
import type { RoleRepository } from './ports';
import { ROLE_REPOSITORY } from './di-tokens';
import type { UpdateRoleCommand } from './dtos';
import { updateRoleCommandSchema } from './dtos';
import { ValidationError } from '../../../shared-kernel';

@Injectable()
export class UpdateRoleUseCase {
  constructor(@Inject(ROLE_REPOSITORY) private readonly roleRepo: RoleRepository) {}

  async execute(id: string, command: UpdateRoleCommand): Promise<RoleRecord> {
    const valid = updateRoleCommandSchema.safeParse(command);
    if (!valid.success) throw new ValidationError('Invalid role update data');

    const existing = await this.roleRepo.findById(id);
    if (!existing) throw new RoleNotFoundError(id);

    if (valid.data.name && valid.data.name !== existing.name) {
      const nameConflict = await this.roleRepo.findByName(valid.data.name);
      if (nameConflict) throw new RoleNameExistsError(valid.data.name);
    }

    return this.roleRepo.update(id, valid.data);
  }
}
