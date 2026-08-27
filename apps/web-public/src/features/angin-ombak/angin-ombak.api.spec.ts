import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getWindWave, type WindWaveResponse } from './angin-ombak.api';

const MOCK_RESPONSE: WindWaveResponse = {
  data: [
    {
      date: '2026-08-27',
      windSpeed: 15,
      windDirection: 'SW',
      windGusts: 22,
      waveHeight: 1.2,
      wavePeriod: 6,
    },
  ],
  freshness: {
    status: 'fresh',
    fetchedAt: '2026-08-27T00:00:00Z',
    validUntil: '2026-08-27T06:00:00Z',
    source: 'metmalaysia',
  },
};

describe('angin-ombak API', () => {
  let originalFetch: typeof globalThis.fetch;
  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });
  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('calls /api/public/wind-wave with no params when none supplied', async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue({ ok: true, status: 200, json: async () => MOCK_RESPONSE } as Response);
    await getWindWave();
    expect(globalThis.fetch).toHaveBeenCalledWith('/api/public/wind-wave');
  });

  it('includes stationId, dateFrom, dateTo when supplied', async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue({ ok: true, status: 200, json: async () => MOCK_RESPONSE } as Response);
    await getWindWave('st-1', '2026-08-27', '2026-08-28');
    const url = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]![0] as string;
    expect(url).toContain('stationId=st-1');
    expect(url).toContain('dateFrom=2026-08-27');
    expect(url).toContain('dateTo=2026-08-28');
  });

  it('returns the parsed response on 200', async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue({ ok: true, status: 200, json: async () => MOCK_RESPONSE } as Response);
    const result = await getWindWave();
    expect(result.data[0]!.waveHeight).toBe(1.2);
  });

  it('throws a BM error message on non-2xx', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 503 } as unknown as Response);
    await expect(getWindWave()).rejects.toThrow(/Gagal mendapatkan data angin & ombak/);
  });
});
