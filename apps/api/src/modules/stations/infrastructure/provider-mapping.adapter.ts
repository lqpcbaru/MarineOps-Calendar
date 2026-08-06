import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../platform/prisma.service';
import type { StationProviderMappingPort } from '../application/ports/provider-mapping.port';
import type { ProviderMappingRecord } from '../domain';

@Injectable()
export class ProviderMappingAdapter implements StationProviderMappingPort {
  constructor(private readonly prisma: PrismaService) {}

  async getByStation(stationId: string): Promise<ProviderMappingRecord[]> {
    const rows = await this.prisma.stationProviderMapping.findMany({
      where: { stationId, isActive: true },
      orderBy: { dataType: 'asc' },
    });
    return rows.map((r) => ({
      id: r.id, stationId: r.stationId, dataType: r.dataType,
      providerName: r.providerName, providerStationId: r.providerStationId,
      config: r.config as Record<string, unknown> | null,
      isActive: r.isActive, createdAt: r.createdAt, updatedAt: r.updatedAt,
    }));
  }

  async getByStationAndType(stationId: string, dataType: string): Promise<ProviderMappingRecord | null> {
    const row = await this.prisma.stationProviderMapping.findFirst({
      where: { stationId, dataType, isActive: true },
    });
    if (!row) return null;
    return {
      id: row.id, stationId: row.stationId, dataType: row.dataType,
      providerName: row.providerName, providerStationId: row.providerStationId,
      config: row.config as Record<string, unknown> | null,
      isActive: row.isActive, createdAt: row.createdAt, updatedAt: row.updatedAt,
    };
  }
}
