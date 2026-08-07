import { describe, expect, it } from 'vitest';
import { WindWaveService } from './wind-wave.service';
import type { WindWaveProviderPort, WindWaveDataPoint } from '../domain';
import { CacheService } from '../../../shared/cache/cache.service';
import { InMemoryCacheStore } from '../../../shared/cache/in-memory-cache.store';
import { createCachePolicy } from '../../../shared/cache/cache-policy';
import type { StationsQueryPort } from '../../stations/application/ports/stations-query.port';

function createCache(): CacheService<WindWaveDataPoint[]> {
  return new CacheService(new InMemoryCacheStore(), createCachePolicy({ ttlMs: 60 * 60 * 1000, staleTtlMs: 240 * 60 * 1000 }));
}
function createStationPort(): StationsQueryPort {
  return { findById: async () => null, findPublicById: async () => null, list: async () => ({ stations: [], total: 0, page: 1, pageSize: 20 }), listPublic: async () => ({ stations: [], total: 0, page: 1, pageSize: 20 }), listRegions: async () => [] };
}

class StubWindWaveProvider implements WindWaveProviderPort {
  async getWindWave(): Promise<WindWaveDataPoint[]> {
    return [{ date: '2026-08-05', windSpeed: 12, windDirection: 'NE', windGusts: 18, waveHeight: 1.2, wavePeriod: 6 }];
  }
}

describe('WindWaveService', () => {
  it('returns WindWaveResponse with data and freshness', async () => {
    const service = new WindWaveService(new StubWindWaveProvider(), createCache(), createStationPort());
    const result = await service.getWindWave('st-001');
    expect(result.data).toHaveLength(1);
    expect(result.data[0]!.windSpeed).toBe(12);
    expect(result.freshness.status).toBe('fresh');
  });

  it('refreshStation fetches and updates cache', async () => {
    const cache = createCache();
    const service = new WindWaveService(new StubWindWaveProvider(), cache, createStationPort());
    const result = await service.refreshStation('st-001');
    expect(result.status).toBe('SUCCESS');
    expect(result.cacheUpdated).toBe(true);
  });

  it('refreshStation returns FAILURE on error', async () => {
    const failing: WindWaveProviderPort = { async getWindWave() { throw new Error('down'); } };
    const service = new WindWaveService(failing, createCache(), createStationPort());
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
    const service = new WindWaveService(new StubWindWaveProvider(), createCache(), stationPort);
    const results = await service.refreshAllStations();
    expect(results).toHaveLength(1);
    expect(results[0]!.stationId).toBe('st-1');
  });

  it('cache is reused on second call', async () => {
    let calls = 0;
    const counting: WindWaveProviderPort = { async getWindWave() { calls++; return [{ date: '', windSpeed: 0, windDirection: '', windGusts: 0, waveHeight: 0, wavePeriod: 0 }]; } };
    const service = new WindWaveService(counting, createCache(), createStationPort());
    await service.getWindWave('st-001');
    await service.getWindWave('st-001');
    expect(calls).toBe(1);
  });
});
