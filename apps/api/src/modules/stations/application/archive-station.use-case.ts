import { Inject, Injectable } from '@nestjs/common';
import type { StationRecord } from '../domain';
import { StationNotFoundError } from '../domain';
import type { StationRepository } from './ports';
import { STATION_REPOSITORY } from './di-tokens';

@Injectable()
export class ArchiveStationUseCase {
  constructor(
    @Inject(STATION_REPOSITORY) private readonly stationRepo: StationRepository,
  ) {}

  async execute(id: string): Promise<StationRecord> {
    const existing = await this.stationRepo.findById(id);
    if (!existing) throw new StationNotFoundError(id);
    return this.stationRepo.archive(id);
  }
}
