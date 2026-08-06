import { describe, expect, it } from 'vitest';
import { CreateStationUseCase } from './create-station.use-case';
import type { StationRepository } from './ports';
import type { StationEventBus, StationDomainEvent } from '../domain';
import type { StationRecord } from '../domain';
import { StationCodeExistsError } from '../domain';

describe('CreateStationUseCase', () => {
  function makeRepo(): StationRepository {
    const byId = new Map<string, StationRecord>();
    const byCode = new Map<string, StationRecord>();
    let counter = 0;
    return {
      findById: async (id: string) => byId.get(id) ?? null,
      findByIdAdmin: async (id: string) => byId.get(id) ?? null,
      findByCode: async (code: string) => byCode.get(code) ?? null,
      findAllPublic: async () => ({ stations: [...byId.values()], total: byId.size, page: 1, pageSize: 20 }),
      findAllAdmin: async () => ({ stations: [...byId.values()], total: byId.size, page: 1, pageSize: 20 }),
      create: async (params) => {
        const r: StationRecord = { id: `st-${++counter}`, code: params.code, name: params.name, latitude: params.latitude, longitude: params.longitude, timezone: params.timezone, regionId: params.regionId ?? null, status: 'ACTIVE', metadata: params.metadata ?? null, createdAt: new Date(), updatedAt: new Date() };
        byId.set(r.id, r); byCode.set(r.code, r); return r;
      },
      update: async () => { throw new Error('not used'); },
      archive: async () => { throw new Error('not used'); },
    };
  }

  function makeEventBus(): StationEventBus & { events: unknown[] } {
    const events: unknown[] = [];
    return {
      events,
      async publish(event: StationDomainEvent) { events.push(event); },
    };
  }

  it('creates a station with valid data and emits StationCreated', async () => {
    const repo = makeRepo();
    const events = makeEventBus();
    const useCase = new CreateStationUseCase(repo, events);

    const result = await useCase.execute({ code: 'PKG-01', name: 'Pelabuhan Klang', latitude: 3.0, longitude: 101.0, timezone: 'Asia/Kuala_Lumpur' });
    expect(result.code).toBe('PKG-01');
    expect(result.status).toBe('ACTIVE');
    expect(events.events).toHaveLength(1);
    expect((events.events[0] as { type: string }).type).toBe('StationCreated');
  });

  it('rejects duplicate code', async () => {
    const repo = makeRepo();
    await repo.create({ code: 'PKG-01', name: 'Existing', latitude: 1, longitude: 1, timezone: 'UTC' });
    const events = makeEventBus();
    const useCase = new CreateStationUseCase(repo, events);
    await expect(useCase.execute({ code: 'PKG-01', name: 'Dup', latitude: 2, longitude: 2, timezone: 'UTC' })).rejects.toBeInstanceOf(StationCodeExistsError);
  });
});
