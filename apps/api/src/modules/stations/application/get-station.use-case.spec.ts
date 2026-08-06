import { describe, expect, it } from 'vitest';
import { GetStationUseCase } from './get-station.use-case';
import type { StationRepository, RegionRepository } from './ports';
import type { StationRecord, OperationRegionRecord } from '../domain';
import { StationNotFoundError } from '../domain';

describe('GetStationUseCase', () => {
  it('finds station by id', async () => {
    const byId = new Map<string, StationRecord>();
    byId.set('st-1', { id: 'st-1', code: 'PKG-01', name: 'Test', latitude: 1, longitude: 1, timezone: 'UTC', regionId: null, status: 'ACTIVE', metadata: null, createdAt: new Date(), updatedAt: new Date() });

    const sRepo: StationRepository = {
      findById: async (id) => byId.get(id) ?? null,
      findByIdAdmin: async (id) => byId.get(id) ?? null,
      findByCode: async () => null,
      findAllPublic: async () => ({ stations: [], total: 0, page: 1, pageSize: 20 }),
      findAllAdmin: async () => ({ stations: [], total: 0, page: 1, pageSize: 20 }),
      create: async () => { throw new Error('not used'); },
      update: async () => { throw new Error('not used'); },
      archive: async () => { throw new Error('not used'); },
    };

    const rRepo: RegionRepository = {
      findById: async () => null,
      findByCode: async () => null,
      findAllActive: async (): Promise<OperationRegionRecord[]> => [],
      create: async () => { throw new Error('not used'); },
    };

    const useCase = new GetStationUseCase(sRepo, rRepo);
    const result = await useCase.findById('st-1');
    expect(result.code).toBe('PKG-01');
  });

  it('throws when station not found', async () => {
    const sRepo: StationRepository = {
      findById: async () => null,
      findByIdAdmin: async () => null,
      findByCode: async () => null,
      findAllPublic: async () => ({ stations: [], total: 0, page: 1, pageSize: 20 }),
      findAllAdmin: async () => ({ stations: [], total: 0, page: 1, pageSize: 20 }),
      create: async () => { throw new Error('not used'); },
      update: async () => { throw new Error('not used'); },
      archive: async () => { throw new Error('not used'); },
    };
    const rRepo: RegionRepository = {
      findById: async () => null,
      findByCode: async () => null,
      findAllActive: async () => [],
      create: async () => { throw new Error('not used'); },
    };
    const useCase = new GetStationUseCase(sRepo, rRepo);
    await expect(useCase.findById('nonexistent')).rejects.toBeInstanceOf(StationNotFoundError);
  });
});
