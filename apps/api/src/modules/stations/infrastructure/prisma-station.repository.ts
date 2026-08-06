import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../platform/prisma.service';
import type { StationRecord, CreateStationParams, UpdateStationParams, StationListResult } from '../domain';
import type { StationRepository } from '../application/ports';
import type { Prisma } from '@prisma/client';

@Injectable()
export class PrismaStationRepository implements StationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<StationRecord | null> {
    const row = await this.prisma.station.findFirst({
      where: { id, status: 'ACTIVE' },
      include: { region: { select: { id: true, name: true } } },
    });
    return row ? this.map(row) : null;
  }

  async findByIdAdmin(id: string): Promise<StationRecord | null> {
    const row = await this.prisma.station.findUnique({
      where: { id },
      include: { region: { select: { id: true, name: true } } },
    });
    return row ? this.map(row) : null;
  }

  async findByCode(code: string): Promise<StationRecord | null> {
    const row = await this.prisma.station.findUnique({
      where: { code },
      include: { region: { select: { id: true, name: true } } },
    });
    return row ? this.map(row) : null;
  }

  async findAllPublic(params: { page: number; pageSize: number; regionId?: string }): Promise<StationListResult> {
    const where: Prisma.StationWhereInput = { status: 'ACTIVE' };
    if (params.regionId) where.regionId = params.regionId;

    const [rows, total] = await Promise.all([
      this.prisma.station.findMany({
        where,
        include: { region: { select: { id: true, name: true } } },
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
        orderBy: { code: 'asc' },
      }),
      this.prisma.station.count({ where }),
    ]);
    return { stations: rows.map((r) => this.map(r)), total, page: params.page, pageSize: params.pageSize };
  }

  async findAllAdmin(params: { page: number; pageSize: number; status?: string; search?: string; regionId?: string }): Promise<StationListResult> {
    const where: Prisma.StationWhereInput = {};
    if (params.status) where.status = params.status as 'ACTIVE' | 'ARCHIVED';
    if (params.regionId) where.regionId = params.regionId;
    if (params.search) {
      where.OR = [
        { code: { contains: params.search, mode: 'insensitive' } },
        { name: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const [rows, total] = await Promise.all([
      this.prisma.station.findMany({
        where,
        include: { region: { select: { id: true, name: true } } },
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.station.count({ where }),
    ]);
    return { stations: rows.map((r) => this.map(r)), total, page: params.page, pageSize: params.pageSize };
  }

  async create(params: CreateStationParams): Promise<StationRecord> {
    const row = await this.prisma.station.create({
      data: {
        code: params.code,
        name: params.name,
        latitude: params.latitude,
        longitude: params.longitude,
        timezone: params.timezone,
        regionId: params.regionId ?? null,
        metadata: params.metadata as Prisma.InputJsonValue | undefined,
        status: 'ACTIVE',
      },
      include: { region: { select: { id: true, name: true } } },
    });
    return this.map(row);
  }

  async update(id: string, params: UpdateStationParams): Promise<StationRecord> {
    const data: Prisma.StationUpdateInput = {};
    if (params.name !== undefined) data.name = params.name;
    if (params.latitude !== undefined) data.latitude = params.latitude;
    if (params.longitude !== undefined) data.longitude = params.longitude;
    if (params.timezone !== undefined) data.timezone = params.timezone;
    if (params.regionId !== undefined) (data as Record<string, unknown>)['regionId'] = params.regionId;
    if (params.metadata !== undefined) data.metadata = params.metadata as Prisma.InputJsonValue;

    const row = await this.prisma.station.update({
      where: { id },
      data,
      include: { region: { select: { id: true, name: true } } },
    });
    return this.map(row);
  }

  async archive(id: string): Promise<StationRecord> {
    const row = await this.prisma.station.update({
      where: { id },
      data: { status: 'ARCHIVED' },
      include: { region: { select: { id: true, name: true } } },
    });
    return this.map(row);
  }

  private map(row: {
    id: string; code: string; name: string;
    latitude: { toNumber: () => number };
    longitude: { toNumber: () => number };
    timezone: string; regionId: string | null; status: string;
    metadata: unknown; createdAt: Date; updatedAt: Date;
    region: { id: string; name: string } | null;
  }): StationRecord {
    return {
      id: row.id,
      code: row.code,
      name: row.name,
      latitude: row.latitude.toNumber(),
      longitude: row.longitude.toNumber(),
      timezone: row.timezone,
      regionId: row.regionId,
      regionName: row.region?.name ?? null,
      status: row.status as 'ACTIVE' | 'ARCHIVED',
      metadata: row.metadata as Record<string, unknown> | null,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
