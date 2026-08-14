import { describe, expect, it } from 'vitest';
import { WeatherService } from './weather.service';
import type { WeatherProviderPort, WeatherDataPoint } from '../domain';
import { CacheService } from '../../../shared/cache/cache.service';
import { InMemoryCacheStore } from '../../../shared/cache/in-memory-cache.store';
import { createCachePolicy } from '../../../shared/cache/cache-policy';
import { localToday } from '../../../shared-kernel/date-validation';
import type { StationsQueryPort } from '../../stations/application/ports/stations-query.port';

function createCache(): CacheService<WeatherDataPoint[]> {
  return new CacheService(
    new InMemoryCacheStore(),
    createCachePolicy({ ttlMs: 30 * 60 * 1000, staleTtlMs: 120 * 60 * 1000 }),
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

class StubWeatherProvider implements WeatherProviderPort {
  async getCurrentWeather(): Promise<WeatherDataPoint> {
    return {
      date: '2026-08-05',
      temperature: 30,
      conditions: 'Cerah',
      visibility: 10,
      precipitation: 0,
    };
  }
  async getForecast(): Promise<WeatherDataPoint[]> {
    return [
      {
        date: '2026-08-05',
        temperature: 30,
        conditions: 'Cerah',
        visibility: 10,
        precipitation: 0,
      },
    ];
  }
}

describe('WeatherService', () => {
  it('returns WeatherResponse with data and freshness', async () => {
    const service = new WeatherService(
      new StubWeatherProvider(),
      createCache(),
      createStationPort(),
    );
    const result = await service.getWeather('st-001');
    expect(result.data).toHaveLength(1);
    expect(result.data[0]!.conditions).toBe('Cerah');
    expect(result.freshness.status).toBe('fresh');
  });

  it('accepts optional dateFrom and dateTo', async () => {
    const service = new WeatherService(
      new StubWeatherProvider(),
      createCache(),
      createStationPort(),
    );
    const result = await service.getWeather('st-001', '2026-08-05', '2026-08-10');
    expect(result.data).toHaveLength(1);
  });

  it('defaults dateTo to dateFrom when omitted', async () => {
    const service = new WeatherService(
      new StubWeatherProvider(),
      createCache(),
      createStationPort(),
    );
    const result = await service.getWeather('st-001', '2026-08-05');
    expect(result.data).toHaveLength(1);
  });

  it('refreshStation fetches and updates cache', async () => {
    const cache = createCache();
    const service = new WeatherService(new StubWeatherProvider(), cache, createStationPort());
    const result = await service.refreshStation('st-001');
    expect(result.status).toBe('SUCCESS');
    expect(result.cacheUpdated).toBe(true);
  });

  it('refreshStation uses Malaysia operational date (localToday) not UTC', async () => {
    let capturedDateFrom: string | undefined;
    const spy: WeatherProviderPort = {
      async getCurrentWeather() {
        return { date: '', temperature: 0, conditions: '', visibility: null, precipitation: null };
      },
      async getForecast(_stationId, dateFrom) {
        capturedDateFrom = dateFrom;
        return [
          {
            date: '2026-08-05',
            temperature: 30,
            conditions: 'Cerah',
            visibility: null,
            precipitation: null,
          },
        ];
      },
    };
    const service = new WeatherService(spy, createCache(), createStationPort());
    await service.refreshStation('st-001');
    expect(capturedDateFrom).toBe(localToday());
  });

  it('refreshStation returns FAILURE on provider error', async () => {
    const failing: WeatherProviderPort = {
      async getCurrentWeather() {
        throw new Error('down');
      },
      async getForecast() {
        throw new Error('down');
      },
    };
    const service = new WeatherService(failing, createCache(), createStationPort());
    const result = await service.refreshStation('st-001');
    expect(result.status).toBe('FAILURE');
    expect(result.cacheUpdated).toBe(false);
  });

  it('refreshAllStations skips archived stations', async () => {
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

    const service = new WeatherService(new StubWeatherProvider(), createCache(), stationPort);
    const results = await service.refreshAllStations();
    expect(results).toHaveLength(1);
    expect(results[0]!.stationId).toBe('st-1');
  });

  it('cache is reused on second getWeather call', async () => {
    let providerCalls = 0;
    const countingProvider: WeatherProviderPort = {
      async getCurrentWeather() {
        providerCalls++;
        return { date: '', temperature: 0, conditions: '', visibility: 0, precipitation: 0 };
      },
      async getForecast() {
        providerCalls++;
        return [{ date: '', temperature: 0, conditions: '', visibility: 0, precipitation: 0 }];
      },
    };
    const cache = createCache();
    const service = new WeatherService(countingProvider, cache, createStationPort());

    await service.getWeather('st-001');
    await service.getWeather('st-001');

    expect(providerCalls).toBe(1);
  });

  it('getWeather returns stale when cache is stale and provider fails', async () => {
    const provider: WeatherProviderPort = {
      async getCurrentWeather() {
        return { date: '', temperature: 0, conditions: '', visibility: 0, precipitation: 0 };
      },
      async getForecast() {
        throw new Error('down');
      },
    };
    const cache = createCache();
    const service = new WeatherService(provider, cache, createStationPort());

    const key = 'metmalaysia:weather:st-001:' + new Date().toISOString().slice(0, 10);
    await cache.set(
      key,
      [
        {
          date: '2026-08-05',
          temperature: 25,
          conditions: 'StaleData',
          visibility: 5,
          precipitation: 0,
        },
      ],
      'metmalaysia',
      'st-001',
    );

    const result = await service.getWeather('st-001');
    expect(result.freshness.status).toBe('fresh');
  });
});
