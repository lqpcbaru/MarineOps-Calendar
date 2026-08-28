import { Inject, Injectable } from '@nestjs/common';
import type { UserRecord } from '../domain';
import { UserNotFoundError } from '../domain';
import type { UserRepository } from './ports';
import { USER_REPOSITORY } from './di-tokens';
import { RecordAuditUseCase } from '../../audit/application/record-audit.use-case';

@Injectable()
export class DisableUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: UserRepository,
    private readonly recordAudit: RecordAuditUseCase,
  ) {}

  async execute(id: string, actorId: string | null = null): Promise<UserRecord> {
    const existing = await this.userRepo.findById(id);
    if (!existing) throw new UserNotFoundError(id);
    const user = await this.userRepo.disable(id);

    await this.recordAudit.execute({
      actorId,
      action: 'user.disable',
      entityType: 'user',
      entityId: user.id,
    });

    return user;
  }
}
