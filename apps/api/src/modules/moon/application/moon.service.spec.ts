import { describe, expect, it } from 'vitest';
import { MoonService } from './moon.service';
import type { MoonProviderPort, MoonDataPoint } from '../domain';
import { CacheService } from '../../../shared/cache/cache.service';
import { InMemoryCacheStore } from '../../../shared/cache/in-memory-cache.store';
import { createCachePolicy } from '../../../shared/cache/cache-policy';
import { localToday } from '../../../shared-kernel/date-validation';
import type { StationsQueryPort } from '../../stations/application/ports/stations-query.port';

function createCache(): CacheService<MoonDataPoint> {
  return new CacheService(
    new InMemoryCacheStore(),
    createCachePolicy({ ttlMs: 24 * 60 * 60 * 1000, staleTtlMs: 7 * 24 * 60 * 60 * 1000 }),
  );
}
function createStationPort(): StationsQueryPort {
  return {
    findById: async () => null,
    findPublicById: async () => null,
    list: async () => ({ stations: [], total: 0, page: 1, pageSize: 20 }),
    listPublic: async () => ({ stations: [], total: 0, page: 1, pageSize: 20 }),
    listRegions: async () => [],
  };
}

class StubMoonProvider implements MoonProviderPort {
  async getMoonPhase(): Promise<MoonDataPoint> {
    return {
      date: '2026-08-05',
      phaseName: 'Bulan Penuh',
      illumination: 100,
      ageDays: 14,
      moonrise: '2026-08-05T18:30:00Z',
      moonset: '2026-08-06T06:00:00Z',
    };
  }
}

describe('MoonService', () => {
  it('returns MoonResponse', async () => {
    const service = new MoonService(new StubMoonProvider(), createCache(), createStationPort());
    const result = await service.getMoonPhase('st-001', '2026-08-06');
    expect(result.data.phaseName).toBe('Bulan Penuh');
    expect(result.data.illumination).toBe(100);
  });

  it('refreshStation updates cache', async () => {
    const cache = createCache();
    const service = new MoonService(new StubMoonProvider(), cache, createStationPort());
    const result = await service.refreshStation('st-001');
    expect(result.status).toBe('SUCCESS');
    expect(result.cacheUpdated).toBe(true);
  });

  it('refreshStation uses Malaysia operational date (localToday) not UTC', async () => {
    let capturedDate: string | undefined;
    const spy: MoonProviderPort = {
      async getMoonPhase(_stationId, date) {
        capturedDate = date;
        return {
          date: '2026-08-05',
          phaseName: 'Bulan Penuh',
          illumination: 100,
          ageDays: 14,
          moonrise: '2026-08-05T18:30:00Z',
          moonset: '2026-08-06T06:00:00Z',
        };
      },
    };
    const service = new MoonService(spy, createCache(), createStationPort());
    await service.refreshStation('st-001');
    expect(capturedDate).toBe(localToday());
  });

  it('refreshStation returns FAILURE on error', async () => {
    const failing: MoonProviderPort = {
      async getMoonPhase() {
        throw new Error('down');
      },
    };
    const service = new MoonService(failing, createCache(), createStationPort());
    expect((await service.refreshStation('st-001')).status).toBe('FAILURE');
  });

  it('refreshAllStations skips archived', async () => {
    const stationPort: StationsQueryPort = {
      findById: async () => null,
      findPublicById: async () => null,
      list: async () => ({ stations: [], total: 0, page: 1, pageSize: 20 }),
      listPublic: async () => ({
        stations: [
          {
            id: 'st-1',
            code: 'A',
            name: 'Active',
            latitude: 1,
            longitude: 1,
            timezone: 'UTC',
            regionId: null,
            status: 'ACTIVE',
            metadata: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: 'st-2',
            code: 'B',
            name: 'Archived',
            latitude: 1,
            longitude: 1,
            timezone: 'UTC',
            regionId: null,
            status: 'ARCHIVED',
            metadata: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        total: 2,
        page: 1,
        pageSize: 20,
      }),
      listRegions: async () => [],
    };
    const service = new MoonService(new StubMoonProvider(), createCache(), stationPort);
    const results = await service.refreshAllStations();
    expect(results).toHaveLength(1);
    expect(results[0]!.stationId).toBe('st-1');
  });

  it('cache is reused on second call', async () => {
    let calls = 0;
    const counting: MoonProviderPort = {
      async getMoonPhase() {
        calls++;
        return {
          date: '',
          phaseName: '',
          illumination: 0,
          ageDays: 0,
          moonrise: null,
          moonset: null,
        };
      },
    };
    const service = new MoonService(counting, createCache(), createStationPort());
    await service.getMoonPhase('st-001', '2026-08-06');
    await service.getMoonPhase('st-001', '2026-08-06');
    expect(calls).toBe(1);
  });
});
