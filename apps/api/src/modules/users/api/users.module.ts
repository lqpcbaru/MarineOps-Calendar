import { Module } from '@nestjs/common';
import { CreateUserUseCase } from '../application/create-user.use-case';
import { GetUsersUseCase } from '../application/get-users.use-case';
import { UpdateUserUseCase } from '../application/update-user.use-case';
import { DisableUserUseCase } from '../application/disable-user.use-case';
import { PrismaUserRepository } from '../infrastructure/prisma-user.repository';
import { USER_REPOSITORY } from '../application/di-tokens';
import { AuditModule } from '../../audit/api/audit.module';

@Module({
  imports: [AuditModule],
  providers: [
    CreateUserUseCase,
    GetUsersUseCase,
    UpdateUserUseCase,
    DisableUserUseCase,
    { provide: USER_REPOSITORY, useClass: PrismaUserRepository },
  ],
  exports: [
    CreateUserUseCase,
    GetUsersUseCase,
    UpdateUserUseCase,
    DisableUserUseCase,
    USER_REPOSITORY,
  ],
})
export class UsersModule {}
