import { Inject, Injectable } from '@nestjs/common';
import type { RoleRecord } from '../domain';
import { RoleNameExistsError } from '../domain';
import type { RoleRepository } from './ports';
import { ROLE_REPOSITORY } from './di-tokens';
import type { CreateRoleCommand } from './dtos';
import { createRoleCommandSchema } from './dtos';
import { ValidationError } from '../../../shared-kernel';

@Injectable()
export class CreateRoleUseCase {
  constructor(@Inject(ROLE_REPOSITORY) private readonly roleRepo: RoleRepository) {}

  async execute(command: CreateRoleCommand): Promise<RoleRecord> {
    const valid = createRoleCommandSchema.safeParse(command);
    if (!valid.success) throw new ValidationError('Invalid role data');

    const existing = await this.roleRepo.findByName(valid.data.name);
    if (existing) throw new RoleNameExistsError(valid.data.name);

    return this.roleRepo.create(valid.data);
  }
}
