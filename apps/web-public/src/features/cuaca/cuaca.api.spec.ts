import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getWeather, type WeatherResponse } from './cuaca.api';

const MOCK_RESPONSE: WeatherResponse = {
  data: [
    { date: '2026-08-27', temperature: 31, conditions: 'CLOUDY', visibility: 8, precipitation: 0 },
  ],
  freshness: {
    status: 'fresh',
    fetchedAt: '2026-08-27T00:00:00Z',
    validUntil: '2026-08-27T03:00:00Z',
    source: 'metmalaysia',
  },
};

describe('cuaca API', () => {
  let originalFetch: typeof globalThis.fetch;
  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });
  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('calls /api/public/weather with no params when none supplied', async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue({ ok: true, status: 200, json: async () => MOCK_RESPONSE } as Response);
    await getWeather();
    expect(globalThis.fetch).toHaveBeenCalledWith('/api/public/weather');
  });

  it('includes stationId, dateFrom, dateTo when supplied', async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue({ ok: true, status: 200, json: async () => MOCK_RESPONSE } as Response);
    await getWeather('st-1', '2026-08-27', '2026-08-28');
    const url = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]![0] as string;
    expect(url).toContain('stationId=st-1');
    expect(url).toContain('dateFrom=2026-08-27');
    expect(url).toContain('dateTo=2026-08-28');
  });

  it('returns the parsed response on 200', async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue({ ok: true, status: 200, json: async () => MOCK_RESPONSE } as Response);
    const result = await getWeather();
    expect(result.data[0]!.temperature).toBe(31);
  });

  it('throws a BM error message on non-2xx', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 503 } as unknown as Response);
    await expect(getWeather()).rejects.toThrow(/Gagal mendapatkan data cuaca/);
  });
});
