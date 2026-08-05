import { Inject, Injectable } from '@nestjs/common';
import type { PasswordHasher } from '../../authentication/application/ports';
import type { UserRecord } from '../domain';
import { UserEmailExistsError } from '../domain';
import type { UserRepository } from './ports';
import { USER_REPOSITORY } from './di-tokens';
import { PASSWORD_HASHER } from '../../authentication/application/di-tokens';
import type { CreateUserCommand } from './dtos';
import { createUserCommandSchema } from './dtos';
import { ValidationError } from '../../../shared-kernel';

@Injectable()
export class CreateUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: UserRepository,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasher,
  ) {}

  async execute(command: CreateUserCommand): Promise<UserRecord> {
    const valid = createUserCommandSchema.safeParse(command);
    if (!valid.success) throw new ValidationError('Invalid user data');

    const { email, name, password, timezone, locale, roleIds } = valid.data;

    const existing = await this.userRepo.findByEmail(email);
    if (existing) throw new UserEmailExistsError(email);

    const passwordHash = await this.hasher.hash(password);

    return this.userRepo.create({
      email,
      name,
      passwordHash,
      timezone,
      locale,
      roleIds,
    });
  }
}
