import { Inject, Injectable } from '@nestjs/common';
import type { StationRecord } from '../domain';
import { StationNotFoundError, StationArchivedError } from '../domain';
import type { StationRepository } from './ports';
import { STATION_REPOSITORY } from './di-tokens';
import type { UpdateStationCommand } from './dtos';
import { updateStationSchema } from './dtos';
import { ValidationError } from '../../../shared-kernel';

@Injectable()
export class UpdateStationUseCase {
  constructor(
    @Inject(STATION_REPOSITORY) private readonly stationRepo: StationRepository,
  ) {}

  async execute(id: string, command: UpdateStationCommand): Promise<StationRecord> {
    const valid = updateStationSchema.safeParse(command);
    if (!valid.success) throw new ValidationError('Data kemas kini tidak sah');

    const existing = await this.stationRepo.findById(id);
    if (!existing) throw new StationNotFoundError(id);
    if (existing.status === 'ARCHIVED') throw new StationArchivedError(id);

    return this.stationRepo.update(id, valid.data);
  }
}
