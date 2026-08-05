import { Inject, Injectable } from '@nestjs/common';
import type { RoleRecord } from '../domain';
import { RoleNotFoundError } from '../domain';
import type { RoleRepository } from './ports';
import { ROLE_REPOSITORY } from './di-tokens';

@Injectable()
export class GetRolesUseCase {
  constructor(@Inject(ROLE_REPOSITORY) private readonly roleRepo: RoleRepository) {}

  async findById(id: string): Promise<RoleRecord> {
    const role = await this.roleRepo.findById(id);
    if (!role) throw new RoleNotFoundError(id);
    return role;
  }

  async listAll(): Promise<RoleRecord[]> {
    return this.roleRepo.findAll();
  }
}
