import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  getStations,
  getStationRegions,
  getStationById,
  type StationListResult,
} from './stesen.api';

const MOCK_STATION_LIST: StationListResult = {
  stations: [
    {
      id: 'st-1',
      code: 'PKG-01',
      name: 'Pelabuhan Klang',
      latitude: 3.0,
      longitude: 101.0,
      timezone: 'Asia/Kuala_Lumpur',
      regionId: 'reg-1',
      regionName: 'Selangor',
    },
    {
      id: 'st-2',
      code: 'KSL-01',
      name: 'Kuala Selangor',
      latitude: 3.34,
      longitude: 101.25,
      timezone: 'Asia/Kuala_Lumpur',
      regionId: 'reg-1',
      regionName: 'Selangor',
    },
  ],
  total: 2,
  page: 1,
  pageSize: 20,
};

const MOCK_REGIONS = [
  {
    id: 'reg-1',
    code: 'SEL',
    name: 'Selangor',
    description: null,
    parentRegionId: null,
    status: 'ACTIVE' as const,
    sortOrder: 1,
    stationCount: 2,
    children: [],
  },
];

const MOCK_STATION = {
  id: 'st-1',
  code: 'PKG-01',
  name: 'Pelabuhan Klang',
  latitude: 3.0,
  longitude: 101.0,
  timezone: 'Asia/Kuala_Lumpur',
  regionId: 'reg-1',
  regionName: 'Selangor',
};

describe('stesen API', () => {
  let originalFetch: typeof globalThis.fetch;
  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });
  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe('getStations', () => {
    it('returns StationListResult on 200', async () => {
      globalThis.fetch = vi
        .fn()
        .mockResolvedValue({
          ok: true,
          status: 200,
          json: async () => MOCK_STATION_LIST,
        } as Response);
      const result = await getStations();
      expect(result.stations).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it('calls /api/public/stations with default page/pageSize', async () => {
      globalThis.fetch = vi
        .fn()
        .mockResolvedValue({
          ok: true,
          status: 200,
          json: async () => MOCK_STATION_LIST,
        } as Response);
      await getStations();
      const url = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]![0] as string;
      expect(url).toContain('page=1');
      expect(url).toContain('pageSize=20');
    });

    it('sends page correctly', async () => {
      globalThis.fetch = vi
        .fn()
        .mockResolvedValue({
          ok: true,
          status: 200,
          json: async () => MOCK_STATION_LIST,
        } as Response);
      await getStations(2);
      const url = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]![0] as string;
      expect(url).toContain('page=2');
    });

    it('sends pageSize correctly', async () => {
      globalThis.fetch = vi
        .fn()
        .mockResolvedValue({
          ok: true,
          status: 200,
          json: async () => MOCK_STATION_LIST,
        } as Response);
      await getStations(1, 50);
      const url = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]![0] as string;
      expect(url).toContain('pageSize=50');
    });

    it('sends regionId when supplied', async () => {
      globalThis.fetch = vi
        .fn()
        .mockResolvedValue({
          ok: true,
          status: 200,
          json: async () => MOCK_STATION_LIST,
        } as Response);
      await getStations(1, 20, 'reg-1');
      const url = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]![0] as string;
      expect(url).toContain('regionId=reg-1');
    });

    it('does not send regionId when undefined', async () => {
      globalThis.fetch = vi
        .fn()
        .mockResolvedValue({
          ok: true,
          status: 200,
          json: async () => MOCK_STATION_LIST,
        } as Response);
      await getStations(1, 20);
      const url = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]![0] as string;
      expect(url).not.toContain('regionId');
    });

    it('throws on non-2xx', async () => {
      globalThis.fetch = vi
        .fn()
        .mockResolvedValue({ ok: false, status: 500 } as unknown as Response);
      await expect(getStations()).rejects.toThrow('500');
    });

    it('preserves BM error message', async () => {
      globalThis.fetch = vi
        .fn()
        .mockResolvedValue({ ok: false, status: 404 } as unknown as Response);
      await expect(getStations()).rejects.toThrow(/Gagal mendapatkan/);
    });

    it('throws on malformed JSON', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      } as unknown as Response);
      await expect(getStations()).rejects.toThrow('Invalid JSON');
    });

    it('handles empty station data', async () => {
      globalThis.fetch = vi
        .fn()
        .mockResolvedValue({
          ok: true,
          status: 200,
          json: async () => ({ stations: [], total: 0, page: 1, pageSize: 20 }),
        } as Response);
      const result = await getStations();
      expect(result.stations).toHaveLength(0);
    });
  });

  describe('getStationRegions', () => {
    it('calls /api/public/stations/regions', async () => {
      globalThis.fetch = vi
        .fn()
        .mockResolvedValue({
          ok: true,
          status: 200,
          json: async () => ({ data: MOCK_REGIONS }),
        } as Response);
      await getStationRegions();
      expect(globalThis.fetch).toHaveBeenCalledWith('/api/public/stations/regions');
    });

    it('handles region response', async () => {
      globalThis.fetch = vi
        .fn()
        .mockResolvedValue({
          ok: true,
          status: 200,
          json: async () => ({ data: MOCK_REGIONS }),
        } as Response);
      const result = await getStationRegions();
      expect(result).toHaveLength(1);
      expect(result[0]!.name).toBe('Selangor');
    });

    it('handles empty regions', async () => {
      globalThis.fetch = vi
        .fn()
        .mockResolvedValue({ ok: true, status: 200, json: async () => ({ data: [] }) } as Response);
      const result = await getStationRegions();
      expect(result).toHaveLength(0);
    });
  });

  describe('getStationById', () => {
    it('calls /api/public/stations/:id', async () => {
      globalThis.fetch = vi
        .fn()
        .mockResolvedValue({ ok: true, status: 200, json: async () => MOCK_STATION } as Response);
      const result = await getStationById('st-1');
      expect(result.name).toBe('Pelabuhan Klang');
      expect(globalThis.fetch).toHaveBeenCalledWith('/api/public/stations/st-1');
    });

    it('handles station detail error', async () => {
      globalThis.fetch = vi
        .fn()
        .mockResolvedValue({ ok: false, status: 404 } as unknown as Response);
      await expect(getStationById('nope')).rejects.toThrow(/Gagal mendapatkan/);
    });
  });
});
