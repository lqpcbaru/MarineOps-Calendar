import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getMoonPhase, type MoonResponse } from './fasa-bulan.api';

const MOCK_RESPONSE: MoonResponse = {
  data: {
    date: '2026-08-27',
    phaseName: 'Waxing Gibbous',
    illumination: 0.72,
    ageDays: 12,
    moonrise: '14:32',
    moonset: '02:10',
  },
};

describe('fasa-bulan API', () => {
  let originalFetch: typeof globalThis.fetch;
  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });
  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('calls /api/public/moon with no params when none supplied', async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue({ ok: true, status: 200, json: async () => MOCK_RESPONSE } as Response);
    await getMoonPhase();
    expect(globalThis.fetch).toHaveBeenCalledWith('/api/public/moon');
  });

  it('includes stationId and date when supplied', async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue({ ok: true, status: 200, json: async () => MOCK_RESPONSE } as Response);
    await getMoonPhase('st-1', '2026-08-27');
    const url = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]![0] as string;
    expect(url).toContain('stationId=st-1');
    expect(url).toContain('date=2026-08-27');
  });

  it('returns the parsed response on 200', async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue({ ok: true, status: 200, json: async () => MOCK_RESPONSE } as Response);
    const result = await getMoonPhase();
    expect(result.data.phaseName).toBe('Waxing Gibbous');
  });

  it('throws a BM error message on non-2xx', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 503 } as unknown as Response);
    await expect(getMoonPhase()).rejects.toThrow(/Gagal mendapatkan data fasa bulan/);
  });
});
