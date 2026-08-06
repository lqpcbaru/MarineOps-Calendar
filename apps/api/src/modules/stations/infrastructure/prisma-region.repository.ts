import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../platform/prisma.service';
import type { OperationRegionRecord } from '../domain';
import type { RegionRepository } from '../application/ports';

@Injectable()
export class PrismaRegionRepository implements RegionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<OperationRegionRecord | null> {
    const row = await this.prisma.operationRegion.findUnique({ where: { id } });
    return row ? this.map(row) : null;
  }

  async findByCode(code: string): Promise<OperationRegionRecord | null> {
    const row = await this.prisma.operationRegion.findUnique({ where: { code } });
    return row ? this.map(row) : null;
  }

  async findAllActive(): Promise<OperationRegionRecord[]> {
    const rows = await this.prisma.operationRegion.findMany({
      where: { status: 'ACTIVE' },
      include: { _count: { select: { stations: true } } },
      orderBy: { sortOrder: 'asc' },
    });

    return rows.map((r) => ({
      id: r.id,
      code: r.code,
      name: r.name,
      description: r.description,
      parentRegionId: r.parentRegionId,
      status: r.status as 'ACTIVE' | 'ARCHIVED',
      sortOrder: r.sortOrder,
      stationCount: r._count.stations,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));
  }

  async create(params: { code: string; name: string; description?: string | null; parentRegionId?: string | null; sortOrder?: number }): Promise<OperationRegionRecord> {
    const row = await this.prisma.operationRegion.create({
      data: {
        code: params.code,
        name: params.name,
        description: params.description ?? null,
        parentRegionId: params.parentRegionId ?? null,
        sortOrder: params.sortOrder ?? 0,
        status: 'ACTIVE',
      },
    });
    return this.map(row);
  }

  private map(row: {
    id: string; code: string; name: string; description: string | null;
    parentRegionId: string | null; status: string; sortOrder: number;
    createdAt: Date; updatedAt: Date;
  }): OperationRegionRecord {
    return {
      id: row.id,
      code: row.code,
      name: row.name,
      description: row.description,
      parentRegionId: row.parentRegionId,
      status: row.status as 'ACTIVE' | 'ARCHIVED',
      sortOrder: row.sortOrder,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
