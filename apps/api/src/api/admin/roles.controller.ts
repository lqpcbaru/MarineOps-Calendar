import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { GetRolesUseCase } from '../../modules/roles/application/get-roles.use-case';
import { CreateRoleUseCase } from '../../modules/roles/application/create-role.use-case';
import { UpdateRoleUseCase } from '../../modules/roles/application/update-role.use-case';
import { DeleteRoleUseCase } from '../../modules/roles/application/delete-role.use-case';
import type { CreateRoleCommand, UpdateRoleCommand } from '../../modules/roles/application/dtos';
import { JwtAuthGuard } from '../../modules/authentication/api/jwt-auth.guard';
import {
  PermissionsGuard,
  RequirePermissions,
} from '../../modules/authentication/api/permissions.guard';

@Controller('v1/roles')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RolesController {
  constructor(
    private readonly getRoles: GetRolesUseCase,
    private readonly createRole: CreateRoleUseCase,
    private readonly updateRole: UpdateRoleUseCase,
    private readonly deleteRole: DeleteRoleUseCase,
  ) {}

  @Get()
  @RequirePermissions('role.manage')
  async list() {
    const roles = await this.getRoles.listAll();
    return roles.map((r) => ({
      id: r.id,
      name: r.name,
      permissionCodes: r.permissionCodes,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }));
  }

  @Get(':id')
  @RequirePermissions('role.manage')
  async getById(@Param('id') id: string) {
    const role = await this.getRoles.findById(id);
    return {
      id: role.id,
      name: role.name,
      permissionCodes: role.permissionCodes,
      createdAt: role.createdAt.toISOString(),
      updatedAt: role.updatedAt.toISOString(),
    };
  }

  @Post()
  @RequirePermissions('role.manage')
  async create(@Body() body: CreateRoleCommand) {
    const role = await this.createRole.execute(body);
    return {
      id: role.id,
      name: role.name,
      permissionCodes: role.permissionCodes,
      createdAt: role.createdAt.toISOString(),
      updatedAt: role.updatedAt.toISOString(),
    };
  }

  @Patch(':id')
  @RequirePermissions('role.manage')
  async update(@Param('id') id: string, @Body() body: UpdateRoleCommand) {
    const role = await this.updateRole.execute(id, body);
    return {
      id: role.id,
      name: role.name,
      permissionCodes: role.permissionCodes,
      createdAt: role.createdAt.toISOString(),
      updatedAt: role.updatedAt.toISOString(),
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('role.manage')
  async delete(@Param('id') id: string) {
    await this.deleteRole.execute(id);
  }
}
