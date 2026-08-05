import { Module } from '@nestjs/common';
import { GetRolesUseCase } from '../application/get-roles.use-case';
import { CreateRoleUseCase } from '../application/create-role.use-case';
import { UpdateRoleUseCase } from '../application/update-role.use-case';
import { DeleteRoleUseCase } from '../application/delete-role.use-case';
import { PrismaRoleRepository } from '../infrastructure/prisma-role.repository';
import { ROLE_REPOSITORY } from '../application/di-tokens';

@Module({
  providers: [
    GetRolesUseCase,
    CreateRoleUseCase,
    UpdateRoleUseCase,
    DeleteRoleUseCase,
    { provide: ROLE_REPOSITORY, useClass: PrismaRoleRepository },
  ],
  exports: [
    GetRolesUseCase,
    CreateRoleUseCase,
    UpdateRoleUseCase,
    DeleteRoleUseCase,
    ROLE_REPOSITORY,
  ],
})
export class RolesModule {}
