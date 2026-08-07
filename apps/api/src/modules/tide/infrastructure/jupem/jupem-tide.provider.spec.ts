import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { JupemTideProvider } from './jupem-tide.provider';
import type { StationProviderMappingPort } from '../../../stations/application/ports';
import type { ProviderMappingRecord } from '../../../stations/domain';
import type { JupemRawTideResponse } from './jupem-raw-dto';

function makeMapping(): ProviderMappingRecord {
  return {
    id: 'm-1', stationId: 'st-001', dataType: 'tide',
    providerName: 'JUPEM', providerStationId: 'PKCP001',
    config: { stationCode: 'PKCP001' },
    isActive: true, createdAt: new Date(), updatedAt: new Date(),
  };
}

const MOCK_RESPONSE: JupemRawTideResponse = {
  status: 'success',
  stesen: 'PKCP001',
  kawasan: 'Pelabuhan Klang',
  data: [
    {
      tarikh: '2026-08-06',
      ramalan: 'baik',
      pasangSurut: [
        { tarikh: '2026-08-06', masa: '06:30', ketinggian: 2.5, jenis: 'Air Pasang' },
        { tarikh: '2026-08-06', masa: '12:45', ketinggian: 0.8, jenis: 'Air Surut' },
        { tarikh: '2026-08-06', masa: '18:30', ketinggian: 2.3, jenis: 'Air Pasang' },
        { tarikh: '2026-08-07', masa: '01:15', ketinggian: 0.5, jenis: 'Air Surut' },
      ],
    },
  ],
};

describe('JupemTideProvider — HTTP mocked', () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    process.env['JUPEM_API_KEY'] = 'test-token';
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    delete process.env['JUPEM_API_KEY'];
  });

  function createProvider(): JupemTideProvider {
    const mappingPort: StationProviderMappingPort = {
      getByStation: async () => [makeMapping()],
      getByStationAndType: async () => makeMapping(),
    };
    return new JupemTideProvider(mappingPort);
  }

  it('returns mapped tide data on 200', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true, status: 200, json: async () => MOCK_RESPONSE,
    } as Response);

    const provider = createProvider();
    const result = await provider.getTide('st-001', '2026-08-06', '2026-08-07');
    expect(result).toHaveLength(4);
    expect(result[0]!.type).toBe('HIGH');
    expect(result[0]!.height).toBe(2.5);
    expect(result[1]!.type).toBe('LOW');
  });

  it('throws on 401', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 401, text: async () => 'Unauthorized' } as unknown as Response);
    const provider = createProvider();
    await expect(provider.getTide('st-001', '2026-08-06', '2026-08-06')).rejects.toThrow(/401/);
  });

  it('throws on 429', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 429, text: async () => 'Rate limited' } as unknown as Response);
    const provider = createProvider();
    await expect(provider.getTide('st-001', '2026-08-06', '2026-08-06')).rejects.toThrow(/had kadar/);
  });

  it('throws on 500', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500, text: async () => 'error' } as unknown as Response);
    const provider = createProvider();
    await expect(provider.getTide('st-001', '2026-08-06', '2026-08-06')).rejects.toThrow(/500/);
  });

  it('tracks metrics on success', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => MOCK_RESPONSE } as Response);
    const provider = createProvider();
    await provider.getTide('st-001', '2026-08-06', '2026-08-07');
    expect(provider.getMetrics().getState().successfulRequests).toBeGreaterThanOrEqual(1);
  });

  it('tracks metrics on failure', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500, text: async () => 'error' } as unknown as Response);
    const provider = createProvider();
    await expect(provider.getTide('st-001', '2026-08-06', '2026-08-06')).rejects.toThrow();
    expect(provider.getMetrics().getState().failedRequests).toBeGreaterThanOrEqual(1);
  });
});
