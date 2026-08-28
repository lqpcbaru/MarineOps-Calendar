import { Inject, Injectable } from '@nestjs/common';
import type { StationRecord } from '../domain';
import { StationCodeExistsError } from '../domain';
import type { StationEventBus } from '../domain';
import type { StationRepository } from './ports';
import { STATION_REPOSITORY } from './di-tokens';
import type { CreateStationCommand } from './dtos';
import { createStationSchema } from './dtos';
import { ValidationError } from '../../../shared-kernel';
import { RecordAuditUseCase } from '../../audit/application/record-audit.use-case';

@Injectable()
export class CreateStationUseCase {
  constructor(
    @Inject(STATION_REPOSITORY) private readonly stationRepo: StationRepository,
    @Inject('STATION_EVENT_BUS') private readonly events: StationEventBus,
    private readonly recordAudit: RecordAuditUseCase,
  ) {}

  async execute(
    command: CreateStationCommand,
    actorId: string | null = null,
  ): Promise<StationRecord> {
    const valid = createStationSchema.safeParse(command);
    if (!valid.success) throw new ValidationError('Data stesen tidak sah');

    const existing = await this.stationRepo.findByCode(valid.data.code);
    if (existing) throw new StationCodeExistsError(valid.data.code);

    const station = await this.stationRepo.create({
      code: valid.data.code,
      name: valid.data.name,
      latitude: valid.data.latitude,
      longitude: valid.data.longitude,
      timezone: valid.data.timezone,
      regionId: valid.data.regionId ?? null,
      metadata: valid.data.metadata ?? null,
    });

    await this.events.publish({
      type: 'StationCreated',
      stationId: station.id,
      stationCode: station.code,
      stationName: station.name,
      at: new Date(),
    });

    await this.recordAudit.execute({
      actorId,
      action: 'station.create',
      entityType: 'station',
      entityId: station.id,
      payload: { code: station.code, name: station.name },
    });

    return station;
  }
}
