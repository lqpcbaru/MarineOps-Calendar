import { Controller, Get, Param, Query } from '@nestjs/common';
import { GetStationUseCase } from '../../modules/stations/application/get-station.use-case';
import type { OperationRegionRecord, StationRecord } from '../../modules/stations/domain';
import type { ListStationsQuery } from '../../modules/stations/application/dtos';
import { Public } from '../../modules/authentication/api/public.decorator';

@Controller('public/stations')
@Public()
export class PublicStationsController {
  constructor(private readonly getStation: GetStationUseCase) {}

  @Get()
  async list(@Query() query: ListStationsQuery) {
    const result = await this.getStation.listPublic(query);
    return { ...result, stations: result.stations.map(toPublicStation) };
  }

  @Get('regions')
  async listRegions(): Promise<{ data: OperationRegionRecord[] }> {
    const regions = await this.getStation.listRegions();
    return { data: regions };
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    const s = await this.getStation.findById(id);
    return toPublicStation(s);
  }
}

/** Public-safe subset — never forward a StationRecord (metadata, status, timestamps) to an unauthenticated caller. */
function toPublicStation(s: StationRecord) {
  return {
    id: s.id,
    code: s.code,
    name: s.name,
    latitude: s.latitude,
    longitude: s.longitude,
    timezone: s.timezone,
    regionId: s.regionId,
    regionName: s.regionName,
  };
}
