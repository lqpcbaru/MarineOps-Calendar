import { Inject, Injectable } from '@nestjs/common';
import type { RoleRecord } from '../domain';
import { RoleNameExistsError } from '../domain';
import type { RoleRepository } from './ports';
import { ROLE_REPOSITORY } from './di-tokens';
import type { CreateRoleCommand } from './dtos';
import { createRoleCommandSchema } from './dtos';
import { ValidationError } from '../../../shared-kernel';
import { RecordAuditUseCase } from '../../audit/application/record-audit.use-case';

@Injectable()
export class CreateRoleUseCase {
  constructor(
    @Inject(ROLE_REPOSITORY) private readonly roleRepo: RoleRepository,
    private readonly recordAudit: RecordAuditUseCase,
  ) {}

  async execute(command: CreateRoleCommand, actorId: string | null = null): Promise<RoleRecord> {
    const valid = createRoleCommandSchema.safeParse(command);
    if (!valid.success) throw new ValidationError('Invalid role data');

    const existing = await this.roleRepo.findByName(valid.data.name);
    if (existing) throw new RoleNameExistsError(valid.data.name);

    const role = await this.roleRepo.create(valid.data);

    await this.recordAudit.execute({
      actorId,
      action: 'role.create',
      entityType: 'role',
      entityId: role.id,
      payload: { name: role.name, permissionCodes: role.permissionCodes },
    });

    return role;
  }
}
