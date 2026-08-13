import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { getRecommendation, type RecommendationResponse } from './amaran-marin.api';

const MOCK_RECOMMENDATION: RecommendationResponse = {
  data: [
    {
      stationId: 'st-001',
      stationName: 'Pelabuhan Klang',
      date: '2026-08-07',
      overallStatus: 'WARNING',
      overallScore: 45,
      recommendation: 'Keadaan tidak menentu. Pertimbangkan untuk menangguh operasi.',
      warnings: ['Angin kencang', 'Ombak tinggi'],
      advisories: ['Angin sederhana'],
      ruleResults: [
        {
          ruleId: 'wind-rule',
          ruleName: 'Penilaian Angin',
          status: 'WARNING',
          scoreContribution: 0,
          message: 'Angin kencang',
          recommendation: 'Pertimbangkan untuk menangguh operasi.',
        },
      ],
      generatedAt: '2026-08-07T00:00:00Z',
    },
  ],
  generatedAt: '2026-08-07T00:00:00Z',
};

describe('getRecommendation', () => {
  let originalFetch: typeof globalThis.fetch;
  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });
  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('returns RecommendationResponse on 200', async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => MOCK_RECOMMENDATION,
      } as Response);
    const result = await getRecommendation();
    expect(result.data).toHaveLength(1);
    expect(result.data[0]!.overallStatus).toBe('WARNING');
  });

  it('calls endpoint without query params when none supplied', async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => MOCK_RECOMMENDATION,
      } as Response);
    await getRecommendation();
    expect(globalThis.fetch).toHaveBeenCalledWith('/api/public/recommendation');
  });

  it('appends stationId only when supplied', async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => MOCK_RECOMMENDATION,
      } as Response);
    await getRecommendation('st-001');
    const url = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]![0] as string;
    expect(url).toContain('stationId=st-001');
  });

  it('appends dateFrom when supplied', async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => MOCK_RECOMMENDATION,
      } as Response);
    await getRecommendation(undefined, '2026-08-07');
    const url = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]![0] as string;
    expect(url).toContain('dateFrom=2026-08-07');
  });

  it('appends dateTo when supplied', async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => MOCK_RECOMMENDATION,
      } as Response);
    await getRecommendation(undefined, undefined, '2026-08-07');
    const url = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]![0] as string;
    expect(url).toContain('dateTo=2026-08-07');
  });

  it('appends all supplied query params correctly', async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => MOCK_RECOMMENDATION,
      } as Response);
    await getRecommendation('st-001', '2026-08-07', '2026-08-08');
    const url = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]![0] as string;
    expect(url).toContain('stationId=st-001');
    expect(url).toContain('dateFrom=2026-08-07');
    expect(url).toContain('dateTo=2026-08-08');
  });

  it('does not append undefined params', async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => MOCK_RECOMMENDATION,
      } as Response);
    await getRecommendation(undefined, undefined, undefined);
    expect(globalThis.fetch).toHaveBeenCalledWith('/api/public/recommendation');
  });

  it('throws on non-2xx', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 } as unknown as Response);
    await expect(getRecommendation()).rejects.toThrow('500');
  });

  it('preserves BM error message', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 404 } as unknown as Response);
    await expect(getRecommendation()).rejects.toThrow(/Gagal mendapatkan/);
  });

  it('throws on malformed JSON', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => {
        throw new Error('Invalid JSON');
      },
    } as unknown as Response);
    await expect(getRecommendation()).rejects.toThrow('Invalid JSON');
  });

  it('handles empty data array', async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ data: [], generatedAt: '' }),
      } as Response);
    const result = await getRecommendation();
    expect(result.data).toHaveLength(0);
  });

  it('handles warnings/advisories arrays', async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => MOCK_RECOMMENDATION,
      } as Response);
    const result = await getRecommendation();
    expect(result.data[0]!.warnings).toHaveLength(2);
    expect(result.data[0]!.advisories).toHaveLength(1);
  });

  it('handles UNKNOWN status', async () => {
    const unknownRec = {
      ...MOCK_RECOMMENDATION,
      data: [
        { ...MOCK_RECOMMENDATION.data[0]!, overallStatus: 'UNKNOWN', warnings: [], advisories: [] },
      ],
    };
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue({ ok: true, status: 200, json: async () => unknownRec } as Response);
    const result = await getRecommendation();
    expect(result.data[0]!.overallStatus).toBe('UNKNOWN');
  });
});
