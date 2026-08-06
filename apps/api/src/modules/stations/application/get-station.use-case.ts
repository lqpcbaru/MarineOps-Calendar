import { Inject, Injectable } from '@nestjs/common';
import type { StationRecord, StationListResult, OperationRegionRecord } from '../domain';
import { StationNotFoundError } from '../domain';
import type { StationRepository, RegionRepository } from './ports';
import { STATION_REPOSITORY, REGION_REPOSITORY } from './di-tokens';
import type { ListStationsQuery } from './dtos';
import { listStationsQuerySchema } from './dtos';
import { ValidationError } from '../../../shared-kernel';

@Injectable()
export class GetStationUseCase {
  constructor(
    @Inject(STATION_REPOSITORY) private readonly stationRepo: StationRepository,
    @Inject(REGION_REPOSITORY) private readonly regionRepo: RegionRepository,
  ) {}

  async findById(id: string): Promise<StationRecord> {
    const station = await this.stationRepo.findById(id);
    if (!station) throw new StationNotFoundError(id);
    return station;
  }

  async findByIdAdmin(id: string): Promise<StationRecord> {
    const station = await this.stationRepo.findByIdAdmin(id);
    if (!station) throw new StationNotFoundError(id);
    return station;
  }

  async listPublic(query: ListStationsQuery): Promise<StationListResult> {
    const valid = listStationsQuerySchema.safeParse(query);
    if (!valid.success) throw new ValidationError('Parameter carian tidak sah');
    return this.stationRepo.findAllPublic({ page: valid.data.page, pageSize: valid.data.pageSize, regionId: valid.data.regionId });
  }

  async listAdmin(query: ListStationsQuery): Promise<StationListResult> {
    const valid = listStationsQuerySchema.safeParse(query);
    if (!valid.success) throw new ValidationError('Parameter carian tidak sah');
    return this.stationRepo.findAllAdmin({
      page: valid.data.page, pageSize: valid.data.pageSize,
      status: valid.data.status, search: valid.data.search, regionId: valid.data.regionId,
    });
  }

  async listRegions(): Promise<OperationRegionRecord[]> {
    const regions = await this.regionRepo.findAllActive();
    return this.buildRegionTree(regions);
  }

  buildRegionTree(regions: OperationRegionRecord[]): OperationRegionRecord[] {
    const map = new Map<string, OperationRegionRecord>();
    for (const r of regions) {
      map.set(r.id, { ...r, children: [] });
    }
    const roots: OperationRegionRecord[] = [];
    for (const r of map.values()) {
      if (r.parentRegionId && map.has(r.parentRegionId)) {
        const parent = map.get(r.parentRegionId)!;
        parent.children = parent.children || [];
        parent.children!.push(r);
      } else {
        roots.push(r);
      }
    }
    return roots;
  }
}
