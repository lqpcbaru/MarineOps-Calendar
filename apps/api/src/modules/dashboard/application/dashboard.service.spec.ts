import { describe, expect, it } from 'vitest';
import { DashboardService } from './dashboard.service';
import type { WeatherService } from '../../weather/application/weather.service';
import type { TideService } from '../../tide/application/tide.service';
import type { WindWaveService } from '../../wind-wave/application/wind-wave.service';
import type { MoonService } from '../../moon/application/moon.service';
import type { SunService } from '../../sun/application/sun.service';

function createMockWeather(): WeatherService {
  return {
    getWeather: async () => ({
      data: [{ date: '2026-08-05', temperature: 0, conditions: '—', visibility: 0, precipitation: 0 }],
      freshness: { status: 'fresh', fetchedAt: '', validUntil: '', source: 'mock' },
    }),
  } as unknown as WeatherService;
}

function createMockTide(): TideService {
  return {
    getTide: async () => ({
      data: [{ date: '2026-08-05', time: '2026-08-05T06:00:00Z', height: 0, type: 'HIGH' }],
      freshness: { status: 'fresh', fetchedAt: '', validUntil: '', source: 'mock' },
    }),
  } as unknown as TideService;
}

function createMockWindWave(): WindWaveService {
  return {
    getWindWave: async () => ({
      data: [{ date: '2026-08-05', windSpeed: 0, windDirection: '—', windGusts: 0, waveHeight: 0, wavePeriod: 0 }],
      freshness: { status: 'fresh', fetchedAt: '', validUntil: '', source: 'mock' },
    }),
  } as unknown as WindWaveService;
}

function createMockMoon(): MoonService {
  return {
    getMoonPhase: async () => ({
      data: { date: '2026-08-05', phaseName: '—', illumination: 0, ageDays: 0, moonrise: null, moonset: null },
    }),
  } as unknown as MoonService;
}

function createMockSun(): SunService {
  return {
    getSunData: async () => ({
      data: { date: '2026-08-05', sunrise: '—', sunset: '—', solarNoon: '—', daylightDuration: '—' },
    }),
  } as unknown as SunService;
}

describe('DashboardService', () => {
  it('orchestrates data from all dependent services', async () => {
    const service = new DashboardService(
      createMockWeather(),
      createMockTide(),
      createMockWindWave(),
      createMockMoon(),
      createMockSun(),
    );

    const result = await service.getPublicDashboard();

    expect(result.operationalStatus).toBe('UNKNOWN');
    expect(result.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(result.tide.next).toBeDefined();
    expect(result.weather.current).toBeDefined();
    expect(result.windWave.current).toBeDefined();
    expect(result.moon.phaseName).toBe('—');
    expect(result.sun.sunrise).toBe('—');
    expect(result.activeAlerts.count).toBe(0);
  });

  it('passes optional stationId to all services', async () => {
    let capturedStationId = '';
    const service = new DashboardService(
      createMockWeather(),
      createMockTide(),
      createMockWindWave(),
      createMockMoon(),
      {
        getSunData: async (stationId: string) => {
          capturedStationId = stationId;
          return { data: { date: '', sunrise: '', sunset: '', solarNoon: '', daylightDuration: '' } };
        },
      } as unknown as SunService,
    );

    await service.getPublicDashboard('st-001');
    expect(capturedStationId).toBe('st-001');
  });

  it('defaults stationId to — when omitted', async () => {
    let capturedStationId = '';
    const service = new DashboardService(
      createMockWeather(),
      createMockTide(),
      createMockWindWave(),
      createMockMoon(),
      {
        getSunData: async (stationId: string) => {
          capturedStationId = stationId;
          return { data: { date: '', sunrise: '', sunset: '', solarNoon: '', daylightDuration: '' } };
        },
      } as unknown as SunService,
    );

    await service.getPublicDashboard();
    expect(capturedStationId).toBe('—');
  });

  it('calls all five services in parallel', async () => {
    const calls: string[] = [];

    const mockWeather = {
      getWeather: async () => { calls.push('weather'); return { data: [], freshness: { status: 'fresh' as const, fetchedAt: '', validUntil: '', source: '' } }; },
    } as unknown as WeatherService;
    const mockTide = {
      getTide: async () => { calls.push('tide'); return { data: [], freshness: { status: 'fresh' as const, fetchedAt: '', validUntil: '', source: '' } }; },
    } as unknown as TideService;
    const mockWindWave = {
      getWindWave: async () => { calls.push('windWave'); return { data: [], freshness: { status: 'fresh' as const, fetchedAt: '', validUntil: '', source: '' } }; },
    } as unknown as WindWaveService;
    const mockMoon = {
      getMoonPhase: async () => { calls.push('moon'); return { data: { date: '', phaseName: '', illumination: 0, ageDays: 0, moonrise: null, moonset: null } }; },
    } as unknown as MoonService;
    const mockSun = {
      getSunData: async () => { calls.push('sun'); return { data: { date: '', sunrise: '', sunset: '', solarNoon: '', daylightDuration: '' } }; },
    } as unknown as SunService;

    const service = new DashboardService(mockWeather, mockTide, mockWindWave, mockMoon, mockSun);
    await service.getPublicDashboard();

    expect(calls).toHaveLength(5);
    expect(calls).toContain('weather');
    expect(calls).toContain('tide');
    expect(calls).toContain('windWave');
    expect(calls).toContain('moon');
    expect(calls).toContain('sun');
  });
});
