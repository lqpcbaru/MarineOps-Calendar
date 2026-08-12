import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { getPublicDashboard, type DashboardResponse } from './dashboard.api';

const MOCK_DASHBOARD: DashboardResponse = {
  date: '2026-08-07',
  station: { id: 'st-001', name: 'Pelabuhan Klang', code: 'PKG-01', regionName: 'Selangor' },
  operationalStatus: 'SAFE',
  overallScore: 85,
  recommendation: 'Keadaan sesuai untuk operasi laut.',
  weather: { conditions: 'Cerah', temperature: 30 },
  wind: { speed: 10, direction: 'SW' },
  wave: { height: 1.0 },
  tide: {
    type: 'HIGH',
    nextHigh: { time: '06:30', height: 2.5 },
    nextLow: { time: '12:45', height: 0.8 },
  },
  moon: { phaseName: 'Bulan Penuh', illumination: 100 },
  sun: { sunrise: '06:30', sunset: '18:45' },
  warnings: [],
  advisories: [],
  generatedAt: '2026-08-07T00:00:00Z',
};

describe('getPublicDashboard', () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('returns DashboardResponse on 200', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => MOCK_DASHBOARD,
    } as Response);

    const result = await getPublicDashboard();

    expect(result.date).toBe('2026-08-07');
    expect(result.station.name).toBe('Pelabuhan Klang');
    expect(result.operationalStatus).toBe('SAFE');
    expect(result.overallScore).toBe(85);
    expect(result.weather).not.toBeNull();
    expect(result.weather!.temperature).toBe(30);
    expect(result.wind!.speed).toBe(10);
    expect(result.wave!.height).toBe(1.0);
    expect(result.tide!.type).toBe('HIGH');
    expect(result.moon!.phaseName).toBe('Bulan Penuh');
    expect(result.sun!.sunrise).toBe('06:30');
  });

  it('calls without stationId when not provided', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => MOCK_DASHBOARD,
    } as Response);

    await getPublicDashboard();

    expect(globalThis.fetch).toHaveBeenCalledWith('/api/public/dashboard');
  });

  it('appends stationId only when explicitly supplied', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => MOCK_DASHBOARD,
    } as Response);

    await getPublicDashboard('st-001');

    expect(globalThis.fetch).toHaveBeenCalledWith('/api/public/dashboard?stationId=st-001');
  });

  it('does not append stationId when undefined', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => MOCK_DASHBOARD,
    } as Response);

    await getPublicDashboard();

    const callArg = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]![0] as string;
    expect(callArg).not.toContain('stationId');
  });

  it('throws on non-2xx response', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    } as unknown as Response);

    await expect(getPublicDashboard()).rejects.toThrow('500');
  });

  it('throws with BM error message', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
    } as unknown as Response);

    await expect(getPublicDashboard()).rejects.toThrow(/Gagal mendapatkan/);
  });

  it('throws on malformed JSON response', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => {
        throw new Error('Invalid JSON');
      },
    } as unknown as Response);

    await expect(getPublicDashboard()).rejects.toThrow('Invalid JSON');
  });

  it('handles null data fields correctly', async () => {
    const nullDashboard = {
      ...MOCK_DASHBOARD,
      weather: null,
      wind: null,
      wave: null,
      tide: null,
      moon: null,
      sun: null,
    };
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => nullDashboard,
    } as Response);

    const result = await getPublicDashboard();

    expect(result.weather).toBeNull();
    expect(result.wind).toBeNull();
    expect(result.wave).toBeNull();
    expect(result.tide).toBeNull();
    expect(result.moon).toBeNull();
    expect(result.sun).toBeNull();
  });
});
