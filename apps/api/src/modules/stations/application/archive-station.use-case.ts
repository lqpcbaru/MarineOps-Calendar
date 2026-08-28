import { Inject, Injectable } from '@nestjs/common';
import type { StationRecord } from '../domain';
import { StationNotFoundError } from '../domain';
import type { StationEventBus } from '../domain';
import type { StationRepository } from './ports';
import { STATION_REPOSITORY } from './di-tokens';
import { RecordAuditUseCase } from '../../audit/application/record-audit.use-case';

@Injectable()
export class ArchiveStationUseCase {
  constructor(
    @Inject(STATION_REPOSITORY) private readonly stationRepo: StationRepository,
    @Inject('STATION_EVENT_BUS') private readonly events: StationEventBus,
    private readonly recordAudit: RecordAuditUseCase,
  ) {}

  async execute(id: string, actorId: string | null = null): Promise<StationRecord> {
    const existing = await this.stationRepo.findById(id);
    if (!existing) throw new StationNotFoundError(id);

    const station = await this.stationRepo.archive(id);

    await this.events.publish({
      type: 'StationArchived',
      stationId: station.id,
      at: new Date(),
    });

    await this.recordAudit.execute({
      actorId,
      action: 'station.archive',
      entityType: 'station',
      entityId: station.id,
    });

    return station;
  }
}
