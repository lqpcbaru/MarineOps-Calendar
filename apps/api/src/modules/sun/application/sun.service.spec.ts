import { describe, expect, it } from 'vitest';
import { SunService } from './sun.service';
import type { SunProviderPort, SunDataPoint } from '../domain';
import { CacheService } from '../../../shared/cache/cache.service';
import { InMemoryCacheStore } from '../../../shared/cache/in-memory-cache.store';
import { createCachePolicy } from '../../../shared/cache/cache-policy';
import type { StationsQueryPort } from '../../stations/application/ports/stations-query.port';

function createCache(): CacheService<SunDataPoint> {
  return new CacheService(new InMemoryCacheStore(), createCachePolicy({ ttlMs: 24 * 60 * 60 * 1000, staleTtlMs: 7 * 24 * 60 * 60 * 1000 }));
}
function createStationPort(): StationsQueryPort {
  return { findById: async () => null, findPublicById: async () => null, list: async () => ({ stations: [], total: 0, page: 1, pageSize: 20 }), listPublic: async () => ({ stations: [], total: 0, page: 1, pageSize: 20 }), listRegions: async () => [] };
}

class StubSunProvider implements SunProviderPort {
  async getSunData(): Promise<SunDataPoint> {
    return { date: '2026-08-05', sunrise: '2026-08-05T06:30:00Z', sunset: '2026-08-05T18:45:00Z', solarNoon: '2026-08-05T12:37:30Z', daylightDuration: 'PT12H15M' };
  }
}

describe('SunService', () => {
  it('returns SunResponse', async () => {
    const service = new SunService(new StubSunProvider(), createCache(), createStationPort());
    const result = await service.getSunData('st-001', '2026-08-06');
    expect(result.data.sunrise).toBe('2026-08-05T06:30:00Z');
  });

  it('refreshStation updates cache', async () => {
    const cache = createCache();
    const service = new SunService(new StubSunProvider(), cache, createStationPort());
    const result = await service.refreshStation('st-001');
    expect(result.status).toBe('SUCCESS');
    expect(result.cacheUpdated).toBe(true);
  });

  it('refreshStation returns FAILURE on error', async () => {
    const failing: SunProviderPort = { async getSunData() { throw new Error('down'); } };
    const service = new SunService(failing, createCache(), createStationPort());
    expect((await service.refreshStation('st-001')).status).toBe('FAILURE');
  });

  it('refreshAllStations skips archived', async () => {
    const stationPort: StationsQueryPort = {
      findById: async () => null, findPublicById: async () => null,
      list: async () => ({ stations: [], total: 0, page: 1, pageSize: 20 }),
      listPublic: async () => ({
        stations: [
          { id: 'st-1', code: 'A', name: 'Active', latitude: 1, longitude: 1, timezone: 'UTC', regionId: null, status: 'ACTIVE', metadata: null, createdAt: new Date(), updatedAt: new Date() },
          { id: 'st-2', code: 'B', name: 'Archived', latitude: 1, longitude: 1, timezone: 'UTC', regionId: null, status: 'ARCHIVED', metadata: null, createdAt: new Date(), updatedAt: new Date() },
        ], total: 2, page: 1, pageSize: 20,
      }),
      listRegions: async () => [],
    };
    const service = new SunService(new StubSunProvider(), createCache(), stationPort);
    const results = await service.refreshAllStations();
    expect(results).toHaveLength(1);
    expect(results[0]!.stationId).toBe('st-1');
  });

  it('cache is reused on second call', async () => {
    let calls = 0;
    const counting: SunProviderPort = { async getSunData() { calls++; return { date: '', sunrise: '', sunset: '', solarNoon: '', daylightDuration: '' }; } };
    const service = new SunService(counting, createCache(), createStationPort());
    await service.getSunData('st-001', '2026-08-06');
    await service.getSunData('st-001', '2026-08-06');
    expect(calls).toBe(1);
  });
});
