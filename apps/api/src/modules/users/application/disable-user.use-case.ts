import { Inject, Injectable } from '@nestjs/common';
import type { UserRecord } from '../domain';
import { UserNotFoundError } from '../domain';
import type { UserRepository } from './ports';
import { USER_REPOSITORY } from './di-tokens';

@Injectable()
export class DisableUserUseCase {
  constructor(@Inject(USER_REPOSITORY) private readonly userRepo: UserRepository) {}

  async execute(id: string): Promise<UserRecord> {
    const existing = await this.userRepo.findById(id);
    if (!existing) throw new UserNotFoundError(id);
    return this.userRepo.disable(id);
  }
}
