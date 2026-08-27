import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getSunData, type SunResponse } from './matahari.api';

const MOCK_RESPONSE: SunResponse = {
  data: {
    date: '2026-08-27',
    sunrise: '07:05',
    sunset: '19:22',
    solarNoon: '13:13',
    daylightDuration: '12h17m',
  },
};

describe('matahari API', () => {
  let originalFetch: typeof globalThis.fetch;
  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });
  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('calls /api/public/sun with no params when none supplied', async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue({ ok: true, status: 200, json: async () => MOCK_RESPONSE } as Response);
    await getSunData();
    expect(globalThis.fetch).toHaveBeenCalledWith('/api/public/sun');
  });

  it('includes stationId and date when supplied', async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue({ ok: true, status: 200, json: async () => MOCK_RESPONSE } as Response);
    await getSunData('st-1', '2026-08-27');
    const url = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]![0] as string;
    expect(url).toContain('stationId=st-1');
    expect(url).toContain('date=2026-08-27');
  });

  it('returns the parsed response on 200', async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue({ ok: true, status: 200, json: async () => MOCK_RESPONSE } as Response);
    const result = await getSunData();
    expect(result.data.sunrise).toBe('07:05');
  });

  it('throws a BM error message on non-2xx', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 503 } as unknown as Response);
    await expect(getSunData()).rejects.toThrow(/Gagal mendapatkan data matahari/);
  });
});
