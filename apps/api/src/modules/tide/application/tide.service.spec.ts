import { describe, expect, it } from 'vitest';
import { TideService } from './tide.service';
import type { TideProviderPort, TideDataPoint } from '../domain';
import { CacheService } from '../../../shared/cache/cache.service';
import { InMemoryCacheStore } from '../../../shared/cache/in-memory-cache.store';
import { createCachePolicy } from '../../../shared/cache/cache-policy';
import type { StationsQueryPort } from '../../stations/application/ports/stations-query.port';

function createCache(): CacheService<TideDataPoint[]> {
  return new CacheService(new InMemoryCacheStore(), createCachePolicy({ ttlMs: 60 * 60 * 1000, staleTtlMs: 240 * 60 * 1000 }));
}

function createStationPort(): StationsQueryPort {
  return {
    findById: async () => null, findPublicById: async () => null,
    list: async () => ({ stations: [], total: 0, page: 1, pageSize: 20 }),
    listPublic: async () => ({ stations: [], total: 0, page: 1, pageSize: 20 }),
    listRegions: async () => [],
  };
}

class StubTideProvider implements TideProviderPort {
  async getTide(): Promise<TideDataPoint[]> {
    return [
      { date: '2026-08-05', time: '2026-08-05T06:30:00Z', height: 2.5, type: 'HIGH' },
      { date: '2026-08-05', time: '2026-08-05T12:45:00Z', height: 0.8, type: 'LOW' },
    ];
  }
}

describe('TideService', () => {
  it('returns TideResponse with data and freshness', async () => {
    const service = new TideService(new StubTideProvider(), createCache(), createStationPort());
    const result = await service.getTide('st-001');
    expect(result.data).toHaveLength(2);
    expect(result.data[0]!.type).toBe('HIGH');
    expect(result.freshness.status).toBe('fresh');
  });

  it('accepts optional dateFrom and dateTo', async () => {
    const service = new TideService(new StubTideProvider(), createCache(), createStationPort());
    const result = await service.getTide('st-001', '2026-08-05', '2026-08-10');
    expect(result.data).toHaveLength(2);
  });

  it('refreshStation fetches and updates cache', async () => {
    const cache = createCache();
    const service = new TideService(new StubTideProvider(), cache, createStationPort());
    const result = await service.refreshStation('st-001');
    expect(result.status).toBe('SUCCESS');
    expect(result.cacheUpdated).toBe(true);
  });

  it('refreshStation returns FAILURE on provider error', async () => {
    const failing: TideProviderPort = { async getTide() { throw new Error('down'); } };
    const service = new TideService(failing, createCache(), createStationPort());
    const result = await service.refreshStation('st-001');
    expect(result.status).toBe('FAILURE');
  });

  it('refreshAllStations skips archived', async () => {
    const stationPort: StationsQueryPort = {
      findById: async () => null, findPublicById: async () => null,
      list: async () => ({ stations: [], total: 0, page: 1, pageSize: 20 }),
      listPublic: async () => ({
        stations: [
          { id: 'st-1', code: 'A', name: 'Active', latitude: 1, longitude: 1, timezone: 'UTC', regionId: null, status: 'ACTIVE', metadata: null, createdAt: new Date(), updatedAt: new Date() },
          { id: 'st-2', code: 'B', name: 'Archived', latitude: 1, longitude: 1, timezone: 'UTC', regionId: null, status: 'ARCHIVED', metadata: null, createdAt: new Date(), updatedAt: new Date() },
        ],
        total: 2, page: 1, pageSize: 20,
      }),
      listRegions: async () => [],
    };
    const service = new TideService(new StubTideProvider(), createCache(), stationPort);
    const results = await service.refreshAllStations();
    expect(results).toHaveLength(1);
    expect(results[0]!.stationId).toBe('st-1');
  });

  it('cache is reused on second getTide call', async () => {
    let providerCalls = 0;
    const counting: TideProviderPort = {
      async getTide() { providerCalls++; return [{ date: '', time: '', height: 0, type: 'HIGH' }]; },
    };
    const service = new TideService(counting, createCache(), createStationPort());
    await service.getTide('st-001');
    await service.getTide('st-001');
    expect(providerCalls).toBe(1);
  });
});
