import { describe, expect, it } from 'vitest';
import { UpdateStationUseCase } from './update-station.use-case';
import type { StationRepository } from './ports';
import type { StationDomainEvent } from '../domain';
import type { StationRecord } from '../domain';
import { StationNotFoundError, StationArchivedError } from '../domain';

describe('UpdateStationUseCase', () => {
  function makeRepo(station: StationRecord): StationRepository {
    return {
      findById: async (id: string) => (id === station.id && station.status === 'ACTIVE' ? station : null),
      findByIdAdmin: async (id: string) => (id === station.id ? station : null),
      findByCode: async () => null,
      findAllPublic: async () => ({ stations: [], total: 0, page: 1, pageSize: 20 }),
      findAllAdmin: async () => ({ stations: [], total: 0, page: 1, pageSize: 20 }),
      create: async () => { throw new Error('not used'); },
      update: async (id, params) => ({ ...station, ...params, updatedAt: new Date() }),
      archive: async () => { throw new Error('not used'); },
    };
  }

  function makeEventBus() {
    const events: unknown[] = [];
    return { events, async publish(event: StationDomainEvent) { events.push(event); } };
  }

  it('updates an active station and emits StationUpdated', async () => {
    const station: StationRecord = { id: 'st-1', code: 'PKG-01', name: 'Old', latitude: 1, longitude: 1, timezone: 'UTC', regionId: null, status: 'ACTIVE', metadata: null, createdAt: new Date(), updatedAt: new Date() };
    const events = makeEventBus();
    const useCase = new UpdateStationUseCase(makeRepo(station), events);

    const result = await useCase.execute('st-1', { name: 'New Name' });
    expect(result.name).toBe('New Name');
    expect(events.events).toHaveLength(1);
  });

  it('throws StationArchivedError when station is archived', async () => {
    const station: StationRecord = { id: 'st-1', code: 'PKG-01', name: 'Old', latitude: 1, longitude: 1, timezone: 'UTC', regionId: null, status: 'ARCHIVED', metadata: null, createdAt: new Date(), updatedAt: new Date() };
    const events = makeEventBus();
    const useCase = new UpdateStationUseCase(makeRepo(station), events);
    await expect(useCase.execute('st-1', { name: 'X' })).rejects.toBeInstanceOf(StationArchivedError);
  });

  it('throws StationNotFoundError for unknown id', async () => {
    const station: StationRecord = { id: 'st-1', code: 'PKG-01', name: 'Old', latitude: 1, longitude: 1, timezone: 'UTC', regionId: null, status: 'ACTIVE', metadata: null, createdAt: new Date(), updatedAt: new Date() };
    const events = makeEventBus();
    const useCase = new UpdateStationUseCase(makeRepo(station), events);
    await expect(useCase.execute('st-99', { name: 'X' })).rejects.toBeInstanceOf(StationNotFoundError);
  });
});
