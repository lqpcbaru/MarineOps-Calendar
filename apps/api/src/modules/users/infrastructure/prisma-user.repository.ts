import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../platform/prisma.service';
import type { UserRecord, CreateUserParams, UpdateUserParams, UserListResult } from '../domain';
import type { UserRepository } from '../application/ports';
import type { Prisma } from '@prisma/client';

@Injectable()
export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<UserRecord | null> {
    const row = await this.prisma.user.findUnique({
      where: { id },
      include: { roles: { select: { roleId: true } } },
    });
    return row ? this.map(row) : null;
  }

  async findByEmail(email: string): Promise<UserRecord | null> {
    const row = await this.prisma.user.findUnique({
      where: { email },
      include: { roles: { select: { roleId: true } } },
    });
    return row ? this.map(row) : null;
  }

  async findAll(params: {
    page: number;
    pageSize: number;
    status?: string;
    search?: string;
  }): Promise<UserListResult> {
    const where: Prisma.UserWhereInput = {};
    if (params.status) where.status = params.status as 'ACTIVE' | 'DISABLED';
    if (params.search) {
      where.OR = [
        { email: { contains: params.search, mode: 'insensitive' } },
        { name: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const [rows, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        include: { roles: { select: { roleId: true } } },
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      users: rows.map((r) => this.map(r)),
      total,
      page: params.page,
      pageSize: params.pageSize,
    };
  }

  async create(params: CreateUserParams): Promise<UserRecord> {
    const row = await this.prisma.user.create({
      data: {
        email: params.email,
        name: params.name,
        passwordHash: params.passwordHash,
        timezone: params.timezone || 'UTC',
        locale: params.locale || 'en',
        status: 'ACTIVE',
        roles: {
          create: params.roleIds.map((roleId) => ({ roleId })),
        },
      },
      include: { roles: { select: { roleId: true } } },
    });
    return this.map(row);
  }

  async update(id: string, params: UpdateUserParams): Promise<UserRecord> {
    const data: Prisma.UserUpdateInput = {};
    if (params.name !== undefined) data.name = params.name;
    if (params.timezone !== undefined) data.timezone = params.timezone;
    if (params.locale !== undefined) data.locale = params.locale;

    if (params.roleIds !== undefined) {
      await this.prisma.userRole.deleteMany({ where: { userId: id } });
      if (params.roleIds.length > 0) {
        await this.prisma.userRole.createMany({
          data: params.roleIds.map((roleId) => ({ userId: id, roleId })),
        });
      }
    }

    const row = await this.prisma.user.update({
      where: { id },
      data,
      include: { roles: { select: { roleId: true } } },
    });
    return this.map(row);
  }

  async disable(id: string): Promise<UserRecord> {
    const row = await this.prisma.user.update({
      where: { id },
      data: { status: 'DISABLED' },
      include: { roles: { select: { roleId: true } } },
    });
    return this.map(row);
  }

  private map(row: {
    id: string;
    email: string;
    name: string;
    passwordHash: string;
    status: string;
    timezone: string;
    locale: string;
    roles: Array<{ roleId: string }>;
    createdAt: Date;
    updatedAt: Date;
  }): UserRecord {
    return {
      id: row.id,
      email: row.email,
      name: row.name,
      passwordHash: row.passwordHash,
      status: row.status as 'ACTIVE' | 'DISABLED',
      timezone: row.timezone,
      locale: row.locale,
      roleIds: row.roles.map((r) => r.roleId),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
