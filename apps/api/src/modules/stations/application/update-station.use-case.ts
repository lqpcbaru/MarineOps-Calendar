import { Inject, Injectable } from '@nestjs/common';
import type { StationRecord } from '../domain';
import { StationNotFoundError, StationArchivedError } from '../domain';
import type { StationEventBus } from '../domain';
import type { StationRepository } from './ports';
import { STATION_REPOSITORY } from './di-tokens';
import type { UpdateStationCommand } from './dtos';
import { updateStationSchema } from './dtos';
import { ValidationError } from '../../../shared-kernel';
import { RecordAuditUseCase } from '../../audit/application/record-audit.use-case';

@Injectable()
export class UpdateStationUseCase {
  constructor(
    @Inject(STATION_REPOSITORY) private readonly stationRepo: StationRepository,
    @Inject('STATION_EVENT_BUS') private readonly events: StationEventBus,
    private readonly recordAudit: RecordAuditUseCase,
  ) {}

  async execute(
    id: string,
    command: UpdateStationCommand,
    actorId: string | null = null,
  ): Promise<StationRecord> {
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

    await this.recordAudit.execute({
      actorId,
      action: 'station.update',
      entityType: 'station',
      entityId: station.id,
      payload: valid.data,
    });

    return station;
  }
}
