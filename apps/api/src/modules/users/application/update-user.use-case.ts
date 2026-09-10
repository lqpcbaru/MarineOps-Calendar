import { Inject, Injectable } from '@nestjs/common';
import type { UserRecord } from '../domain';
import { UserNotFoundError } from '../domain';
import type { UserRepository } from './ports';
import { USER_REPOSITORY } from './di-tokens';
import type { UpdateUserCommand } from './dtos';
import { updateUserCommandSchema } from './dtos';
import { ValidationError } from '../../../shared-kernel';
import { RecordAuditUseCase } from '../../audit/application/record-audit.use-case';

@Injectable()
export class UpdateUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: UserRepository,
    private readonly recordAudit: RecordAuditUseCase,
  ) {}

  async execute(
    id: string,
    command: UpdateUserCommand,
    actorId: string | null = null,
  ): Promise<UserRecord> {
    const valid = updateUserCommandSchema.safeParse(command);
    if (!valid.success) throw new ValidationError('Invalid update data');

    const existing = await this.userRepo.findById(id);
    if (!existing) throw new UserNotFoundError(id);

    const user = await this.userRepo.update(id, valid.data);

    await this.recordAudit.execute({
      actorId,
      action: 'user.update',
      entityType: 'user',
      entityId: user.id,
      payload: valid.data,
    });

    return user;
  }
}
