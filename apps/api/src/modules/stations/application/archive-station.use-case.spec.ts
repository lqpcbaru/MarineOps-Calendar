import { describe, expect, it } from 'vitest';
import { ArchiveStationUseCase } from './archive-station.use-case';
import type { StationRepository } from './ports';
import type { StationRecord } from '../domain';
import { StationNotFoundError } from '../domain';

describe('ArchiveStationUseCase', () => {
  it('archives a station', async () => {
    const byId = new Map<string, StationRecord>();
    byId.set('st-1', { id: 'st-1', code: 'PKG-01', name: 'Test', latitude: 1, longitude: 1, timezone: 'UTC', regionId: null, status: 'ACTIVE', metadata: null, createdAt: new Date(), updatedAt: new Date() });

    const repo: StationRepository = {
      findById: async (id) => byId.get(id) ?? null,
      findByIdAdmin: async (id) => byId.get(id) ?? null,
      findByCode: async () => null,
      findAllPublic: async () => ({ stations: [], total: 0, page: 1, pageSize: 20 }),
      findAllAdmin: async () => ({ stations: [], total: 0, page: 1, pageSize: 20 }),
      create: async () => { throw new Error('not used'); },
      update: async () => { throw new Error('not used'); },
      archive: async (id) => { const r = byId.get(id)!; r.status = 'ARCHIVED'; return r; },
    };

    const useCase = new ArchiveStationUseCase(repo);
    const result = await useCase.execute('st-1');
    expect(result.status).toBe('ARCHIVED');
  });

  it('throws when station not found', async () => {
    const repo: StationRepository = {
      findById: async () => null,
      findByIdAdmin: async () => null,
      findByCode: async () => null,
      findAllPublic: async () => ({ stations: [], total: 0, page: 1, pageSize: 20 }),
      findAllAdmin: async () => ({ stations: [], total: 0, page: 1, pageSize: 20 }),
      create: async () => { throw new Error('not used'); },
      update: async () => { throw new Error('not used'); },
      archive: async () => { throw new Error('not used'); },
    };
    const useCase = new ArchiveStationUseCase(repo);
    await expect(useCase.execute('nonexistent')).rejects.toBeInstanceOf(StationNotFoundError);
  });
});
