import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../platform/prisma.service';
import type { StationsQueryPort } from '../application/ports/stations-query.port';
import type { StationRecord, OperationRegionRecord } from '../domain';

@Injectable()
export class StationsQueryAdapter implements StationsQueryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<StationRecord | null> {
    const row = await this.prisma.station.findUnique({
      where: { id },
      include: { region: { select: { id: true, name: true } } },
    });
    return row ? this.mapStation(row) : null;
  }

  async findPublicById(id: string): Promise<StationRecord | null> {
    const row = await this.prisma.station.findFirst({
      where: { id, status: 'ACTIVE' },
      include: { region: { select: { id: true, name: true } } },
    });
    return row ? this.mapStation(row) : null;
  }

  async list(params: { page: number; pageSize: number; regionId?: string }) {
    const where: Record<string, unknown> = {};
    if (params.regionId) where['regionId'] = params.regionId;
    const [rows, total] = await Promise.all([
      this.prisma.station.findMany({
        where, include: { region: { select: { id: true, name: true } } },
        skip: (params.page - 1) * params.pageSize, take: params.pageSize,
        orderBy: { code: 'asc' },
      }),
      this.prisma.station.count({ where }),
    ]);
    return { stations: rows.map((r) => this.mapStation(r)), total, page: params.page, pageSize: params.pageSize };
  }

  async listPublic(params: { page: number; pageSize: number; regionId?: string }) {
    const where: Record<string, unknown> = { status: 'ACTIVE' };
    if (params.regionId) where['regionId'] = params.regionId;
    const [rows, total] = await Promise.all([
      this.prisma.station.findMany({
        where, include: { region: { select: { id: true, name: true } } },
        skip: (params.page - 1) * params.pageSize, take: params.pageSize,
        orderBy: { code: 'asc' },
      }),
      this.prisma.station.count({ where }),
    ]);
    return { stations: rows.map((r) => this.mapStation(r)), total, page: params.page, pageSize: params.pageSize };
  }

  async listRegions(): Promise<OperationRegionRecord[]> {
    const rows = await this.prisma.operationRegion.findMany({
      where: { status: 'ACTIVE' },
      include: { _count: { select: { stations: true } } },
      orderBy: { sortOrder: 'asc' },
    });
    return rows.map((r) => ({
      id: r.id, code: r.code, name: r.name, description: r.description,
      parentRegionId: r.parentRegionId,
      status: r.status as 'ACTIVE' | 'ARCHIVED',
      sortOrder: r.sortOrder, stationCount: r._count.stations,
      createdAt: r.createdAt, updatedAt: r.updatedAt,
    }));
  }

  private mapStation(row: {
    id: string; code: string; name: string;
    latitude: { toNumber: () => number }; longitude: { toNumber: () => number };
    timezone: string; regionId: string | null; status: string;
    metadata: unknown; createdAt: Date; updatedAt: Date;
    region: { id: string; name: string } | null;
  }): StationRecord {
    return {
      id: row.id, code: row.code, name: row.name,
      latitude: row.latitude.toNumber(), longitude: row.longitude.toNumber(),
      timezone: row.timezone, regionId: row.regionId,
      regionName: row.region?.name ?? null,
      status: row.status as 'ACTIVE' | 'ARCHIVED',
      metadata: row.metadata as Record<string, unknown> | null,
      createdAt: row.createdAt, updatedAt: row.updatedAt,
    };
  }
}
