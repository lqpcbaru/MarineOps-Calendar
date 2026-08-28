import { Inject, Injectable } from '@nestjs/common';
import { RoleNotFoundError, RoleHasUsersError } from '../domain';
import type { RoleRepository } from './ports';
import { ROLE_REPOSITORY } from './di-tokens';
import { RecordAuditUseCase } from '../../audit/application/record-audit.use-case';

@Injectable()
export class DeleteRoleUseCase {
  constructor(
    @Inject(ROLE_REPOSITORY) private readonly roleRepo: RoleRepository,
    private readonly recordAudit: RecordAuditUseCase,
  ) {}

  async execute(id: string, actorId: string | null = null): Promise<void> {
    const existing = await this.roleRepo.findById(id);
    if (!existing) throw new RoleNotFoundError(id);

    const userCount = await this.roleRepo.getUserCount(id);
    if (userCount > 0) throw new RoleHasUsersError(id, userCount);

    await this.roleRepo.delete(id);

    await this.recordAudit.execute({
      actorId,
      action: 'role.delete',
      entityType: 'role',
      entityId: id,
    });
  }
}
