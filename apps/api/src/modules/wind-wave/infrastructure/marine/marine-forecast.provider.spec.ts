import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { MarineForecastProvider } from './marine-forecast.provider';
import type { StationProviderMappingPort } from '../../../stations/application/ports';
import type { ProviderMappingRecord } from '../../../stations/domain';
import type { MarineRawForecastResponse } from './marine-raw-dto';
import { errorResponse, jsonResponse } from '../../../../shared/provider/test-responses';

function makeMapping(): ProviderMappingRecord {
  return {
    id: 'm-1',
    stationId: 'st-001',
    dataType: 'wind',
    providerName: 'MarineForecast',
    providerStationId: 'Selangor',
    config: { marineArea: 'Selangor' },
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

const MOCK_RESPONSE: MarineRawForecastResponse = {
  status: 'success',
  kawasan: 'Selangor',
  data: [
    {
      tarikh: '06/08/2026',
      hari: 'Khamis',
      cuaca: 'Ribut petir',
      arahAngin: 'BD',
      kelajuanAngin: '10-20km/h',
      ketinggianOmbak: '0.5-1.0 m',
      tempohOmbak: 6,
      amaran: null,
    },
    {
      tarikh: '07/08/2026',
      hari: 'Jumaat',
      cuaca: 'Tiada hujan',
      arahAngin: 'SBD',
      kelajuanAngin: '10-20km/h',
      ketinggianOmbak: '0.5-1.0 m',
      tempohOmbak: 5,
      amaran: null,
    },
  ],
};

describe('MarineForecastProvider — HTTP mocked', () => {
  let originalFetch: typeof globalThis.fetch;
  beforeEach(() => {
    originalFetch = globalThis.fetch;
    process.env['METMALAYSIA_API_KEY'] = 'test-token';
  });
  afterEach(() => {
    globalThis.fetch = originalFetch;
    delete process.env['METMALAYSIA_API_KEY'];
  });

  function createProvider(): MarineForecastProvider {
    const mappingPort: StationProviderMappingPort = {
      getByStation: async () => [makeMapping()],
      getByStationAndType: async () => makeMapping(),
    };
    return new MarineForecastProvider(mappingPort);
  }

  it('returns mapped data on 200', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(jsonResponse(MOCK_RESPONSE, 200));
    const provider = createProvider();
    const result = await provider.getWindWave('st-001', '2026-08-06', '2026-08-07');
    expect(result).toHaveLength(2);
    expect(result[0]!.windDirection).toBe('SW');
    expect(result[0]!.waveHeight).toBe(0.75);
  });

  it('throws on 401', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(errorResponse(401, 'Unauthorized'));
    await expect(
      createProvider().getWindWave('st-001', '2026-08-06', '2026-08-06'),
    ).rejects.toThrow(/401/);
  });

  it('throws on 429', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(errorResponse(429, 'Rate limited'));
    await expect(
      createProvider().getWindWave('st-001', '2026-08-06', '2026-08-06'),
    ).rejects.toThrow(/had kadar/);
  });

  it('throws on 500', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(errorResponse(500, 'error'));
    await expect(
      createProvider().getWindWave('st-001', '2026-08-06', '2026-08-06'),
    ).rejects.toThrow(/500/);
  });

  it('tracks metrics on success', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(jsonResponse(MOCK_RESPONSE, 200));
    const provider = createProvider();
    await provider.getWindWave('st-001', '2026-08-06', '2026-08-07');
    expect(provider.getMetrics().getState().successfulRequests).toBeGreaterThanOrEqual(1);
  });

  it('tracks metrics on failure', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(errorResponse(500, 'error'));
    const provider = createProvider();
    await expect(provider.getWindWave('st-001', '2026-08-06', '2026-08-06')).rejects.toThrow();
    expect(provider.getMetrics().getState().failedRequests).toBeGreaterThanOrEqual(1);
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
        dataType: 'wind',
        providerName: 'MarineForecast',
        providerStationId: null,
        config: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    };
    const provider = new MarineForecastProvider(mappingPort);
    globalThis.fetch = vi.fn();

    await expect(provider.getWindWave('st-001', '2026-08-06', '2026-08-06')).rejects.toThrow(
      /kod kawasan/,
    );
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });
});
