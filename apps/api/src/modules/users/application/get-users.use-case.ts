import { Inject, Injectable } from '@nestjs/common';
import type { UserRecord, UserListResult } from '../domain';
import { UserNotFoundError } from '../domain';
import type { UserRepository } from './ports';
import { USER_REPOSITORY } from './di-tokens';
import type { ListUsersQuery } from './dtos';
import { listUsersQuerySchema } from './dtos';
import { ValidationError } from '../../../shared-kernel';

@Injectable()
export class GetUsersUseCase {
  constructor(@Inject(USER_REPOSITORY) private readonly userRepo: UserRepository) {}

  async findById(id: string): Promise<UserRecord> {
    const user = await this.userRepo.findById(id);
    if (!user) throw new UserNotFoundError(id);
    return user;
  }

  async list(query: ListUsersQuery): Promise<UserListResult> {
    const valid = listUsersQuerySchema.safeParse(query);
    if (!valid.success) throw new ValidationError('Invalid query parameters');
    return this.userRepo.findAll(valid.data);
  }
}
