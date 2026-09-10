import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { MetMalaysiaWeatherProvider } from './met-malaysia-weather.provider';
import type { StationProviderMappingPort } from '../../../stations/application/ports';
import type { ProviderMappingRecord } from '../../../stations/domain';
import type { MetRawForecastResponse } from './met-raw-dto';
import { errorResponse, jsonResponse } from '../../../../shared/provider/test-responses';

function makeMapping(overrides: Partial<ProviderMappingRecord> = {}): ProviderMappingRecord {
  return {
    id: 'm-1',
    stationId: 'st-001',
    dataType: 'weather',
    providerName: 'MetMalaysia',
    providerStationId: 'Selangor',
    config: { marineArea: 'Selangor' },
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

const MOCK_FORECAST: MetRawForecastResponse = {
  status: 'success',
  data: [
    {
      date: '06/08/2026',
      day: 'Khamis',
      weatherCode: 'T',
      weatherCondition: 'Ribut petir di beberapa tempat',
      morningForecast: 'Ribut petir di beberapa tempat',
      afternoonForecast: 'Tiada hujan',
      nightForecast: 'Tiada hujan',
      minTemperature: 25,
      maxTemperature: 32,
      windDirection: 'BD',
      windSpeed: '10-20km/h',
      waveHeight: '0.5-1.0 m',
      humidity: 80,
    },
    {
      date: '07/08/2026',
      day: 'Jumaat',
      weatherCode: 'F',
      weatherCondition: 'Tiada hujan',
      morningForecast: 'Tiada hujan',
      afternoonForecast: 'Tiada hujan',
      nightForecast: 'Tiada hujan',
      minTemperature: 24,
      maxTemperature: 33,
      windDirection: 'SBD',
      windSpeed: '10-20km/h',
      waveHeight: '0.5-1.0 m',
      humidity: 75,
    },
  ],
};

describe('MetMalaysiaWeatherProvider — HTTP mocked', () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    process.env['METMALAYSIA_API_KEY'] = 'test-token';
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    delete process.env['METMALAYSIA_API_KEY'];
  });

  function createProvider(): MetMalaysiaWeatherProvider {
    const mappingPort: StationProviderMappingPort = {
      getByStation: async () => [makeMapping()],
      getByStationAndType: async () => makeMapping(),
    };
    return new MetMalaysiaWeatherProvider(mappingPort);
  }

  it('returns mapped forecast data on 200', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(jsonResponse(MOCK_FORECAST, 200));

    const provider = createProvider();
    const result = await provider.getForecast('st-001', '2026-08-06', '2026-08-07');

    expect(result).toHaveLength(2);
    expect(result[0]!.conditions).toBe('THUNDERSTORM');
    expect(result[0]!.temperature).toBe(32);
    expect(result[1]!.conditions).toBe('CLEAR');
  });

  it('throws ProviderAuthenticationError on 401', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(errorResponse(401, 'Unauthorized'));

    const provider = createProvider();
    await expect(provider.getCurrentWeather('st-001')).rejects.toThrow(/401/);
  });

  it('throws ProviderAuthenticationError on 403', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(errorResponse(403, 'Forbidden'));

    const provider = createProvider();
    await expect(provider.getCurrentWeather('st-001')).rejects.toThrow(/403/);
  });

  it('throws ProviderRateLimitError on 429', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(errorResponse(429, 'Too many requests'));

    const provider = createProvider();
    await expect(provider.getCurrentWeather('st-001')).rejects.toThrow(/had kadar/);
  });

  it('throws ProviderServerError on 500', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(errorResponse(500, 'Server error'));

    const provider = createProvider();
    await expect(provider.getCurrentWeather('st-001')).rejects.toThrow(/500/);
  });

  it('throws ProviderTimeoutError on timeout', async () => {
    const abortError = new DOMException('The operation was aborted', 'AbortError');
    globalThis.fetch = vi.fn().mockRejectedValue(abortError);

    const provider = createProvider();
    await expect(provider.getCurrentWeather('st-001')).rejects.toThrow(/had masa/);
  });

  it('retries on 500 then succeeds', async () => {
    let calls = 0;
    globalThis.fetch = vi.fn().mockImplementation(() => {
      calls++;
      if (calls < 3) {
        return Promise.resolve(errorResponse(500, 'error'));
      }
      return Promise.resolve(jsonResponse(MOCK_FORECAST, 200));
    });

    const provider = createProvider();
    const result = await provider.getForecast('st-001', '2026-08-06', '2026-08-07');
    expect(calls).toBe(3);
    expect(result).toHaveLength(2);
  });

  it('tracks metrics after success', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(jsonResponse(MOCK_FORECAST, 200));

    const provider = createProvider();
    await provider.getForecast('st-001', '2026-08-06', '2026-08-07');

    const state = provider.getMetrics().getState();
    expect(state.successfulRequests).toBeGreaterThanOrEqual(1);
    expect(state.lastSuccessAt).toBeDefined();
  });

  it('tracks metrics after failure', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(errorResponse(500, 'error'));

    const provider = createProvider();
    await expect(provider.getCurrentWeather('st-001')).rejects.toThrow();

    const state = provider.getMetrics().getState();
    expect(state.failedRequests).toBeGreaterThanOrEqual(1);
    expect(state.lastFailureAt).toBeDefined();
  });

  it('refuses to fall back to the internal stationId when a mapping is active but has no real area code', async () => {
    // Regression: an isActive:true mapping with no marineArea/providerStationId
    // (exactly what the seed script produces before real codes are supplied)
    // must never silently send our internal UUID to the real MET Malaysia API.
    const mappingPort: StationProviderMappingPort = {
      getByStation: async () => [],
      getByStationAndType: async () => ({
        id: 'm-1',
        stationId: 'st-001',
        dataType: 'weather',
        providerName: 'MetMalaysia',
        providerStationId: null,
        config: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    };
    const provider = new MetMalaysiaWeatherProvider(mappingPort);
    globalThis.fetch = vi.fn();

    await expect(provider.getCurrentWeather('st-001')).rejects.toThrow(/kod kawasan/);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });
});
