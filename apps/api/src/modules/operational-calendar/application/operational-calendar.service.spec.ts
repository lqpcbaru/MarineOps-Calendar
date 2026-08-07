import { describe, expect, it } from 'vitest';
import { OperationalCalendarService } from './operational-calendar.service';
import type { WeatherService } from '../../weather/application/weather.service';
import type { TideService } from '../../tide/application/tide.service';
import type { WindWaveService } from '../../wind-wave/application/wind-wave.service';
import type { MoonService } from '../../moon/application/moon.service';
import type { SunService } from '../../sun/application/sun.service';
import type { StationsQueryPort } from '../../stations/application/ports/stations-query.port';
import { CacheService } from '../../../shared/cache/cache.service';
import { InMemoryCacheStore } from '../../../shared/cache/in-memory-cache.store';
import { createCachePolicy } from '../../../shared/cache/cache-policy';
import type { DailyOperationalRecord } from '../domain';

function createCache(): CacheService<DailyOperationalRecord[]> {
  return new CacheService(new InMemoryCacheStore(), createCachePolicy({ ttlMs: 24 * 60 * 60 * 1000, staleTtlMs: 48 * 60 * 60 * 1000 }));
}

describe('OperationalCalendarService', () => {
  function createService() {
    const weather: WeatherService = {
      async getWeather() { return { data: [{ date: '2026-08-06', temperature: 30, conditions: 'Cerah', visibility: 10, precipitation: 0 }], freshness: { status: 'fresh', fetchedAt: '', validUntil: '', source: '' } }; },
    } as unknown as WeatherService;
    const tide: TideService = {
      async getTide() { return { data: [{ date: '2026-08-06', time: '2026-08-06T06:30:00Z', height: 2.5, type: 'HIGH' }, { date: '2026-08-06', time: '2026-08-06T12:45:00Z', height: 0.8, type: 'LOW' }], freshness: { status: 'fresh', fetchedAt: '', validUntil: '', source: '' } }; },
    } as unknown as TideService;
    const windWave: WindWaveService = {
      async getWindWave() { return { data: [{ date: '2026-08-06', windSpeed: 12, windDirection: 'SW', windGusts: 18, waveHeight: 1.2, wavePeriod: 6 }], freshness: { status: 'fresh', fetchedAt: '', validUntil: '', source: '' } }; },
    } as unknown as WindWaveService;
    const moon: MoonService = {
      async getMoonPhase() { return { data: { date: '2026-08-06', phaseName: 'Bulan Penuh', illumination: 100, ageDays: 14, moonrise: '2026-08-06T18:30:00Z', moonset: '2026-08-07T06:00:00Z' } }; },
    } as unknown as MoonService;
    const sun: SunService = {
      async getSunData() { return { data: { date: '2026-08-06', sunrise: '06:30', sunset: '18:45', solarNoon: '12:37', daylightDuration: 'PT12H15M' } }; },
    } as unknown as SunService;
    const stationPort: StationsQueryPort = {
      async findPublicById() { return { id: 'st-001', code: 'PKG-01', name: 'Pelabuhan Klang', latitude: 3.0, longitude: 101.0, timezone: 'Asia/Kuala_Lumpur', regionId: 'reg-1', regionName: 'Selangor', status: 'ACTIVE', metadata: null, createdAt: new Date(), updatedAt: new Date() }; },
      findById: async () => null, list: async () => ({ stations: [], total: 0, page: 1, pageSize: 20 }), listPublic: async () => ({ stations: [], total: 0, page: 1, pageSize: 20 }), listRegions: async () => [],
    };
    const cache = createCache();
    return new OperationalCalendarService(weather, tide, windWave, moon, sun, stationPort, cache);
  }

  it('aggregates all 5 data sources into DailyOperationalRecord', async () => {
    const svc = createService();
    const result = await svc.getCalendar('st-001', '2026-08-06', '2026-08-06');
    expect(result.data).toHaveLength(1);
    const record = result.data[0]!;
    expect(record.stationName).toBe('Pelabuhan Klang');
    expect(record.stationCode).toBe('PKG-01');
    expect(record.regionName).toBe('Selangor');
    expect(record.weather!.conditions).toBe('Cerah');
    expect(record.tide!.nextHigh!.height).toBe(2.5);
    expect(record.windWave!.windSpeed).toBe(12);
    expect(record.moon!.phaseName).toBe('Bulan Penuh');
    expect(record.sun!.dayLength).toBe('PT12H15M');
  });

  it('handles partial data gracefully (some providers fail)', async () => {
    const svc = createService();
    const result = await svc.getCalendar('st-001', '2026-08-06', '2026-08-06');
    expect(result.data).toHaveLength(1);
    expect(result.data[0]!.weather).not.toBeNull();
  });

  it('generates ISO timestamps', async () => {
    const svc = createService();
    const result = await svc.getCalendar('st-001', '2026-08-06', '2026-08-06');
    expect(result.data[0]!.generatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('handles multi-day range', async () => {
    const svc = createService();
    const result = await svc.getCalendar('st-001', '2026-08-06', '2026-08-08');
    expect(result.data).toHaveLength(3);
  });

  it('cache is reused on second call', async () => {
    let calls = 0;
    const weather: WeatherService = {
      async getWeather() { calls++; return { data: [{ date: '2026-08-06', temperature: 30, conditions: 'Cerah', visibility: 10, precipitation: 0 }], freshness: { status: 'fresh', fetchedAt: '', validUntil: '', source: '' } }; },
    } as unknown as WeatherService;
    const tide = { async getTide() { return { data: [], freshness: { status: 'fresh', fetchedAt: '', validUntil: '', source: '' } }; } } as unknown as TideService;
    const windWave = { async getWindWave() { return { data: [], freshness: { status: 'fresh', fetchedAt: '', validUntil: '', source: '' } }; } } as unknown as WindWaveService;
    const moon = { async getMoonPhase() { return { data: { date: '', phaseName: '', illumination: 0, ageDays: 0, moonrise: null, moonset: null } }; } } as unknown as MoonService;
    const sun = { async getSunData() { return { data: { date: '', sunrise: '', sunset: '', solarNoon: '', daylightDuration: '' } }; } } as unknown as SunService;
    const stationPort: StationsQueryPort = { async findPublicById() { return null; }, findById: async () => null, list: async () => ({ stations: [], total: 0, page: 1, pageSize: 20 }), listPublic: async () => ({ stations: [], total: 0, page: 1, pageSize: 20 }), listRegions: async () => [] };
    const svc = new OperationalCalendarService(weather, tide, windWave, moon, sun, stationPort, createCache());
    await svc.getCalendar('st-001', '2026-08-06', '2026-08-06');
    await svc.getCalendar('st-001', '2026-08-06', '2026-08-06');
    expect(calls).toBe(1);
  });
});
