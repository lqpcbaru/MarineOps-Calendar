import { Module } from '@nestjs/common';
import { CreateStationUseCase } from '../application/create-station.use-case';
import { UpdateStationUseCase } from '../application/update-station.use-case';
import { ArchiveStationUseCase } from '../application/archive-station.use-case';
import { GetStationUseCase } from '../application/get-station.use-case';
import { PrismaStationRepository } from '../infrastructure/prisma-station.repository';
import { PrismaRegionRepository } from '../infrastructure/prisma-region.repository';
import { StationsQueryAdapter } from '../infrastructure/stations-query.adapter';
import { ProviderMappingAdapter } from '../infrastructure/provider-mapping.adapter';
import { LoggingService } from '../../../platform/logging.service';
import { STATION_REPOSITORY, REGION_REPOSITORY } from '../application/di-tokens';

export const STATIONS_QUERY_PORT = 'STATIONS_QUERY_PORT';
export const PROVIDER_MAPPING_PORT = 'PROVIDER_MAPPING_PORT';

@Module({
  providers: [
    CreateStationUseCase,
    UpdateStationUseCase,
    ArchiveStationUseCase,
    GetStationUseCase,
    { provide: STATION_REPOSITORY, useClass: PrismaStationRepository },
    { provide: REGION_REPOSITORY, useClass: PrismaRegionRepository },
    { provide: STATIONS_QUERY_PORT, useClass: StationsQueryAdapter },
    { provide: PROVIDER_MAPPING_PORT, useClass: ProviderMappingAdapter },
    { provide: 'STATION_EVENT_BUS', useValue: { publish: async (event: unknown) => { const logger = new LoggingService('StationEvents'); logger.log((event as { type: string }).type, { ...(event as Record<string, unknown>) }); } } },
  ],
  exports: [
    CreateStationUseCase,
    UpdateStationUseCase,
    ArchiveStationUseCase,
    GetStationUseCase,
    STATION_REPOSITORY,
    REGION_REPOSITORY,
    STATIONS_QUERY_PORT,
    PROVIDER_MAPPING_PORT,
  ],
})
export class StationsModule {}
