import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../platform/prisma.service';
import type { RoleRecord } from '../domain';
import type { RoleRepository } from '../application/ports';

@Injectable()
export class PrismaRoleRepository implements RoleRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<RoleRecord | null> {
    const row = await this.prisma.role.findUnique({ where: { id } });
    return row ? this.map(row) : null;
  }

  async findByName(name: string): Promise<RoleRecord | null> {
    const row = await this.prisma.role.findUnique({ where: { name } });
    return row ? this.map(row) : null;
  }

  async findAll(): Promise<RoleRecord[]> {
    const rows = await this.prisma.role.findMany({ orderBy: { name: 'asc' } });
    return rows.map((r) => this.map(r));
  }

  async create(params: { name: string; permissionCodes: string[] }): Promise<RoleRecord> {
    const row = await this.prisma.role.create({
      data: {
        name: params.name,
        permissionCodes: params.permissionCodes,
      },
    });
    return this.map(row);
  }

  async update(
    id: string,
    params: { name?: string; permissionCodes?: string[] },
  ): Promise<RoleRecord> {
    const data: { name?: string; permissionCodes?: string[] } = {};
    if (params.name !== undefined) data.name = params.name;
    if (params.permissionCodes !== undefined) data.permissionCodes = params.permissionCodes;

    const row = await this.prisma.role.update({ where: { id }, data });
    return this.map(row);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.role.delete({ where: { id } });
  }

  async getUserCount(roleId: string): Promise<number> {
    return this.prisma.userRole.count({ where: { roleId } });
  }

  private map(row: {
    id: string;
    name: string;
    permissionCodes: string[];
    createdAt: Date;
    updatedAt: Date;
  }): RoleRecord {
    return {
      id: row.id,
      name: row.name,
      permissionCodes: row.permissionCodes,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
