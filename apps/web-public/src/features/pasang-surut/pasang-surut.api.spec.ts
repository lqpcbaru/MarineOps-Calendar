import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getTide, type TideResponse } from './pasang-surut.api';

const MOCK_RESPONSE: TideResponse = {
  data: [{ date: '2026-08-27', time: '06:12', height: 1.8, type: 'HIGH' }],
  freshness: {
    status: 'fresh',
    fetchedAt: '2026-08-27T00:00:00Z',
    validUntil: '2026-08-27T06:00:00Z',
    source: 'jupem',
  },
};

describe('pasang-surut API', () => {
  let originalFetch: typeof globalThis.fetch;
  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });
  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('calls /api/public/tide with no params when none supplied', async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue({ ok: true, status: 200, json: async () => MOCK_RESPONSE } as Response);
    await getTide();
    expect(globalThis.fetch).toHaveBeenCalledWith('/api/public/tide');
  });

  it('includes stationId, dateFrom, dateTo when supplied', async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue({ ok: true, status: 200, json: async () => MOCK_RESPONSE } as Response);
    await getTide('st-1', '2026-08-27', '2026-08-28');
    const url = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]![0] as string;
    expect(url).toContain('stationId=st-1');
    expect(url).toContain('dateFrom=2026-08-27');
    expect(url).toContain('dateTo=2026-08-28');
  });

  it('returns the parsed response on 200', async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue({ ok: true, status: 200, json: async () => MOCK_RESPONSE } as Response);
    const result = await getTide();
    expect(result.data).toHaveLength(1);
    expect(result.freshness.status).toBe('fresh');
  });

  it('throws a BM error message on non-2xx', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 503 } as unknown as Response);
    await expect(getTide()).rejects.toThrow(/Gagal mendapatkan data pasang surut/);
  });
});
