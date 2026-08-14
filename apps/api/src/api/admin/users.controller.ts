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
  Query,
  UseGuards,
} from '@nestjs/common';
import { CreateUserUseCase } from '../../modules/users/application/create-user.use-case';
import { GetUsersUseCase } from '../../modules/users/application/get-users.use-case';
import { UpdateUserUseCase } from '../../modules/users/application/update-user.use-case';
import { DisableUserUseCase } from '../../modules/users/application/disable-user.use-case';
import type {
  CreateUserCommand,
  UpdateUserCommand,
  ListUsersQuery,
} from '../../modules/users/application/dtos';
import { JwtAuthGuard } from '../../modules/authentication/api/jwt-auth.guard';
import {
  PermissionsGuard,
  RequirePermissions,
} from '../../modules/authentication/api/permissions.guard';

@Controller('v1/users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UsersController {
  constructor(
    private readonly getUsers: GetUsersUseCase,
    private readonly createUser: CreateUserUseCase,
    private readonly updateUser: UpdateUserUseCase,
    private readonly disableUser: DisableUserUseCase,
  ) {}

  @Get()
  @RequirePermissions('user.manage')
  async list(@Query() query: ListUsersQuery) {
    return this.getUsers.list(query);
  }

  @Get(':id')
  @RequirePermissions('user.manage')
  async getById(@Param('id') id: string) {
    const user = await this.getUsers.findById(id);
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      status: user.status,
      timezone: user.timezone,
      locale: user.locale,
      roleIds: user.roleIds,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }

  @Post()
  @RequirePermissions('user.manage')
  async create(@Body() body: CreateUserCommand) {
    const user = await this.createUser.execute(body);
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      status: user.status,
      timezone: user.timezone,
      locale: user.locale,
      roleIds: user.roleIds,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }

  @Patch(':id')
  @RequirePermissions('user.manage')
  async update(@Param('id') id: string, @Body() body: UpdateUserCommand) {
    const user = await this.updateUser.execute(id, body);
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      status: user.status,
      timezone: user.timezone,
      locale: user.locale,
      roleIds: user.roleIds,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('user.manage')
  async disable(@Param('id') id: string) {
    await this.disableUser.execute(id);
  }
}
