import { Controller, Get, Param, Query } from '@nestjs/common';
import { GetStationUseCase } from '../../modules/stations/application/get-station.use-case';
import type { StationRecord, OperationRegionRecord, StationListResult } from '../../modules/stations/domain';
import type { ListStationsQuery } from '../../modules/stations/application/dtos';
import { Public } from '../../modules/authentication/api/public.decorator';

@Controller('stations')
@Public()
export class PublicStationsController {
  constructor(private readonly getStation: GetStationUseCase) {}

  @Get()
  async list(@Query() query: ListStationsQuery): Promise<StationListResult> {
    return this.getStation.listPublic(query);
  }

  @Get('regions')
  async listRegions(): Promise<{ data: OperationRegionRecord[] }> {
    const regions = await this.getStation.listRegions();
    return { data: this.buildRegionTree(regions) };
  }

  @Get(':id')
  async getById(@Param('id') id: string): Promise<StationRecord> {
    return this.getStation.findById(id);
  }

  private buildRegionTree(regions: OperationRegionRecord[]): OperationRegionRecord[] {
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
