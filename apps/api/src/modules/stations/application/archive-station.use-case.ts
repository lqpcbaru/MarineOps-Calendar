import { Inject, Injectable } from '@nestjs/common';
import type { StationRecord } from '../domain';
import { StationNotFoundError } from '../domain';
import type { StationEventBus } from '../domain';
import type { StationRepository } from './ports';
import { STATION_REPOSITORY } from './di-tokens';

@Injectable()
export class ArchiveStationUseCase {
  constructor(
    @Inject(STATION_REPOSITORY) private readonly stationRepo: StationRepository,
    @Inject('STATION_EVENT_BUS') private readonly events: StationEventBus,
  ) {}

  async execute(id: string): Promise<StationRecord> {
    const existing = await this.stationRepo.findById(id);
    if (!existing) throw new StationNotFoundError(id);

    const station = await this.stationRepo.archive(id);

    await this.events.publish({
      type: 'StationArchived',
      stationId: station.id,
      at: new Date(),
    });

    return station;
  }
}
