import { Inject, Injectable } from '@nestjs/common';
import type { UserRecord } from '../domain';
import { UserNotFoundError } from '../domain';
import type { UserRepository } from './ports';
import { USER_REPOSITORY } from './di-tokens';
import type { UpdateUserCommand } from './dtos';
import { updateUserCommandSchema } from './dtos';
import { ValidationError } from '../../../shared-kernel';

@Injectable()
export class UpdateUserUseCase {
  constructor(@Inject(USER_REPOSITORY) private readonly userRepo: UserRepository) {}

  async execute(id: string, command: UpdateUserCommand): Promise<UserRecord> {
    const valid = updateUserCommandSchema.safeParse(command);
    if (!valid.success) throw new ValidationError('Invalid update data');

    const existing = await this.userRepo.findById(id);
    if (!existing) throw new UserNotFoundError(id);

    return this.userRepo.update(id, valid.data);
  }
}
