import { Inject, Injectable } from '@nestjs/common';
import type { StationRecord } from '../domain';
import { StationNotFoundError, StationArchivedError } from '../domain';
import type { StationEventBus } from '../domain';
import type { StationRepository } from './ports';
import { STATION_REPOSITORY } from './di-tokens';
import type { UpdateStationCommand } from './dtos';
import { updateStationSchema } from './dtos';
import { ValidationError } from '../../../shared-kernel';

@Injectable()
export class UpdateStationUseCase {
  constructor(
    @Inject(STATION_REPOSITORY) private readonly stationRepo: StationRepository,
    @Inject('STATION_EVENT_BUS') private readonly events: StationEventBus,
  ) {}

  async execute(id: string, command: UpdateStationCommand): Promise<StationRecord> {
    const valid = updateStationSchema.safeParse(command);
    if (!valid.success) throw new ValidationError('Data kemas kini tidak sah');

    const existing = await this.stationRepo.findByIdAdmin(id);
    if (!existing) throw new StationNotFoundError(id);
    if (existing.status === 'ARCHIVED') throw new StationArchivedError(id);

    const station = await this.stationRepo.update(id, valid.data);

    await this.events.publish({
      type: 'StationUpdated',
      stationId: station.id,
      at: new Date(),
    });

    return station;
  }
}
