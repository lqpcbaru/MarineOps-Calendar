import { Module } from '@nestjs/common';
import { CreateStationUseCase } from '../application/create-station.use-case';
import { UpdateStationUseCase } from '../application/update-station.use-case';
import { ArchiveStationUseCase } from '../application/archive-station.use-case';
import { GetStationUseCase } from '../application/get-station.use-case';
import { PrismaStationRepository } from '../infrastructure/prisma-station.repository';
import { PrismaRegionRepository } from '../infrastructure/prisma-region.repository';
import { STATION_REPOSITORY, REGION_REPOSITORY } from '../application/di-tokens';

@Module({
  providers: [
    CreateStationUseCase,
    UpdateStationUseCase,
    ArchiveStationUseCase,
    GetStationUseCase,
    { provide: STATION_REPOSITORY, useClass: PrismaStationRepository },
    { provide: REGION_REPOSITORY, useClass: PrismaRegionRepository },
  ],
  exports: [
    CreateStationUseCase,
    UpdateStationUseCase,
    ArchiveStationUseCase,
    GetStationUseCase,
    STATION_REPOSITORY,
    REGION_REPOSITORY,
  ],
})
export class StationsModule {}
