import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { MarineForecastProvider } from './marine-forecast.provider';
import type { StationProviderMappingPort } from '../../../stations/application/ports';
import type { ProviderMappingRecord } from '../../../stations/domain';
import type { MarineRawForecastResponse } from './marine-raw-dto';

function makeMapping(): ProviderMappingRecord {
  return { id: 'm-1', stationId: 'st-001', dataType: 'wind', providerName: 'MarineForecast', providerStationId: 'Selangor', config: { marineArea: 'Selangor' }, isActive: true, createdAt: new Date(), updatedAt: new Date() };
}

const MOCK_RESPONSE: MarineRawForecastResponse = {
  status: 'success', kawasan: 'Selangor',
  data: [
    { tarikh: '06/08/2026', hari: 'Khamis', cuaca: 'Ribut petir', arahAngin: 'BD', kelajuanAngin: '10-20km/h', ketinggianOmbak: '0.5-1.0 m', tempohOmbak: 6, amaran: null },
    { tarikh: '07/08/2026', hari: 'Jumaat', cuaca: 'Tiada hujan', arahAngin: 'SBD', kelajuanAngin: '10-20km/h', ketinggianOmbak: '0.5-1.0 m', tempohOmbak: 5, amaran: null },
  ],
};

describe('MarineForecastProvider — HTTP mocked', () => {
  let originalFetch: typeof globalThis.fetch;
  beforeEach(() => { originalFetch = globalThis.fetch; process.env['METMALAYSIA_API_KEY'] = 'test-token'; });
  afterEach(() => { globalThis.fetch = originalFetch; delete process.env['METMALAYSIA_API_KEY']; });

  function createProvider(): MarineForecastProvider {
    const mappingPort: StationProviderMappingPort = {
      getByStation: async () => [makeMapping()],
      getByStationAndType: async () => makeMapping(),
    };
    return new MarineForecastProvider(mappingPort);
  }

  it('returns mapped data on 200', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => MOCK_RESPONSE } as Response);
    const provider = createProvider();
    const result = await provider.getWindWave('st-001', '2026-08-06', '2026-08-07');
    expect(result).toHaveLength(2);
    expect(result[0]!.windDirection).toBe('SW');
    expect(result[0]!.waveHeight).toBe(0.75);
  });

  it('throws on 401', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 401, text: async () => 'Unauthorized' } as unknown as Response);
    await expect(createProvider().getWindWave('st-001', '2026-08-06', '2026-08-06')).rejects.toThrow(/401/);
  });

  it('throws on 429', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 429, text: async () => 'Rate limited' } as unknown as Response);
    await expect(createProvider().getWindWave('st-001', '2026-08-06', '2026-08-06')).rejects.toThrow(/had kadar/);
  });

  it('throws on 500', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500, text: async () => 'error' } as unknown as Response);
    await expect(createProvider().getWindWave('st-001', '2026-08-06', '2026-08-06')).rejects.toThrow(/500/);
  });

  it('tracks metrics on success', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => MOCK_RESPONSE } as Response);
    const provider = createProvider();
    await provider.getWindWave('st-001', '2026-08-06', '2026-08-07');
    expect(provider.getMetrics().getState().successfulRequests).toBeGreaterThanOrEqual(1);
  });

  it('tracks metrics on failure', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500, text: async () => 'error' } as unknown as Response);
    const provider = createProvider();
    await expect(provider.getWindWave('st-001', '2026-08-06', '2026-08-06')).rejects.toThrow();
    expect(provider.getMetrics().getState().failedRequests).toBeGreaterThanOrEqual(1);
  });
});
