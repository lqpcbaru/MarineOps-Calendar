import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { getCalendar, type CalendarResponse } from './kalendar-operasi.api';

const MOCK_CALENDAR: CalendarResponse = {
  data: [
    {
      stationId: 'st-001',
      stationName: 'Pelabuhan Klang',
      stationCode: 'PKG-01',
      regionName: 'Selangor',
      date: '2026-08-07',
      hijriDate: '—',
      weather: { conditions: 'Cerah', temperature: 30, visibility: 10, precipitation: 0 },
      tide: {
        nextHigh: { time: '06:30', height: 2.5 },
        nextLow: { time: '12:45', height: 0.8 },
        type: 'HIGH',
      },
      windWave: {
        windSpeed: 10,
        windDirection: 'SW',
        windGusts: 15,
        waveHeight: 1.0,
        wavePeriod: 6,
      },
      moon: { phaseName: 'Bulan Penuh', illumination: 100, moonrise: '18:30', moonset: '06:00' },
      sun: { sunrise: '06:30', sunset: '18:45', dayLength: 'PT12H15M' },
      freshness: {
        status: 'fresh',
        fetchedAt: '2026-08-07T00:00:00Z',
        validUntil: '2026-08-08T00:00:00Z',
        source: 'operational',
      },
      generatedAt: '2026-08-07T00:00:00Z',
    },
    {
      stationId: 'st-001',
      stationName: 'Pelabuhan Klang',
      stationCode: 'PKG-01',
      regionName: 'Selangor',
      date: '2026-08-08',
      hijriDate: '—',
      weather: { conditions: 'Hujan', temperature: 28, visibility: 8, precipitation: 5 },
      tide: {
        nextHigh: { time: '07:00', height: 2.3 },
        nextLow: { time: '13:15', height: 0.7 },
        type: 'HIGH',
      },
      windWave: {
        windSpeed: 15,
        windDirection: 'NE',
        windGusts: 20,
        waveHeight: 1.5,
        wavePeriod: 5,
      },
      moon: { phaseName: 'Bulan Penuh', illumination: 98, moonrise: '19:00', moonset: '07:00' },
      sun: { sunrise: '06:31', sunset: '18:44', dayLength: 'PT12H13M' },
      freshness: {
        status: 'fresh',
        fetchedAt: '2026-08-07T00:00:00Z',
        validUntil: '2026-08-08T00:00:00Z',
        source: 'operational',
      },
      generatedAt: '2026-08-07T00:00:00Z',
    },
  ],
  freshness: {
    status: 'fresh',
    fetchedAt: '2026-08-07T00:00:00Z',
    validUntil: '2026-08-08T00:00:00Z',
    source: 'operational',
  },
};

describe('getCalendar', () => {
  let originalFetch: typeof globalThis.fetch;
  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });
  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('returns CalendarResponse on 200', async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue({ ok: true, status: 200, json: async () => MOCK_CALENDAR } as Response);
    const result = await getCalendar(undefined, '2026-08-07', '2026-08-08');
    expect(result.data).toHaveLength(2);
    expect(result.data[0]!.date).toBe('2026-08-07');
    expect(result.data[0]!.weather!.conditions).toBe('Cerah');
    expect(result.freshness.status).toBe('fresh');
  });

  it('calls with dateFrom/dateTo', async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue({ ok: true, status: 200, json: async () => MOCK_CALENDAR } as Response);
    await getCalendar(undefined, '2026-08-07', '2026-08-13');
    const url = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]![0] as string;
    expect(url).toContain('dateFrom=2026-08-07');
    expect(url).toContain('dateTo=2026-08-13');
  });

  it('does not append stationId when undefined', async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue({ ok: true, status: 200, json: async () => MOCK_CALENDAR } as Response);
    await getCalendar(undefined, '2026-08-07', '2026-08-08');
    const url = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]![0] as string;
    expect(url).not.toContain('stationId');
  });

  it('appends stationId when explicitly supplied', async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue({ ok: true, status: 200, json: async () => MOCK_CALENDAR } as Response);
    await getCalendar('st-001', '2026-08-07', '2026-08-08');
    const url = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]![0] as string;
    expect(url).toContain('stationId=st-001');
  });

  it('handles multi-day response', async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue({ ok: true, status: 200, json: async () => MOCK_CALENDAR } as Response);
    const result = await getCalendar(undefined, '2026-08-07', '2026-08-08');
    expect(result.data).toHaveLength(2);
  });

  it('throws on non-2xx', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 } as unknown as Response);
    await expect(getCalendar(undefined, '2026-08-07', '2026-08-08')).rejects.toThrow('500');
  });

  it('throws with BM error message', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 404 } as unknown as Response);
    await expect(getCalendar(undefined, '2026-08-07', '2026-08-08')).rejects.toThrow(
      /Gagal mendapatkan/,
    );
  });

  it('throws on malformed JSON', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => {
        throw new Error('Invalid JSON');
      },
    } as unknown as Response);
    await expect(getCalendar(undefined, '2026-08-07', '2026-08-08')).rejects.toThrow(
      'Invalid JSON',
    );
  });

  it('handles empty data array', async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ data: [], freshness: MOCK_CALENDAR.freshness }),
      } as Response);
    const result = await getCalendar(undefined, '2026-08-07', '2026-08-08');
    expect(result.data).toHaveLength(0);
  });

  it('handles null fields without crashing', async () => {
    const nullCalendar = {
      data: [
        {
          ...MOCK_CALENDAR.data[0]!,
          weather: null,
          tide: null,
          windWave: null,
          moon: null,
          sun: null,
        },
      ],
      freshness: MOCK_CALENDAR.freshness,
    };
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue({ ok: true, status: 200, json: async () => nullCalendar } as Response);
    const result = await getCalendar(undefined, '2026-08-07', '2026-08-08');
    expect(result.data[0]!.weather).toBeNull();
    expect(result.data[0]!.tide).toBeNull();
  });
});
