import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  searchVessels,
  getVesselProfile,
  getVesselEvents,
  type VesselSearchResult,
  type VesselProfile,
  type VesselEventsResult,
} from './vessels.api';

const MOCK_SEARCH_RESULT: VesselSearchResult = {
  vessels: [
    {
      id: 'v-1',
      name: 'Kuala Laut',
      mmsi: '533000001',
      imo: '9000001',
      callsign: null,
      flag: 'Malaysia',
      vesselType: 'Fishing',
      length: null,
      tonnage: null,
      source: 'GFW',
      dataStatus: 'KNOWN',
      lastKnownPosition: {
        latitude: 3.1234,
        longitude: 101.5678,
        speed: 5.2,
        course: 120,
        heading: null,
        timestamp: '2026-08-14T00:00:00Z',
      },
      lastPositionAt: '2026-08-14T00:00:00Z',
      observedAt: '2026-08-14T00:00:00Z',
      retrievedAt: '2026-08-14T01:00:00Z',
    },
  ],
  total: 1,
  page: 1,
  pageSize: 20,
  retrievedAt: '2026-08-14T01:00:00Z',
  source: 'GFW',
};

const MOCK_PROFILE: VesselProfile = {
  identity: {
    id: 'v-1',
    name: 'Kuala Laut',
    mmsi: '533000001',
    imo: '9000001',
    callsign: '9MABC',
    flag: 'Malaysia',
    vesselType: 'Fishing',
    length: 30.5,
    tonnage: 150,
    source: 'GFW',
    dataStatus: 'KNOWN',
    lastKnownPosition: {
      latitude: 3.1234,
      longitude: 101.5678,
      speed: 5.2,
      course: 120,
      heading: null,
      timestamp: '2026-08-14T00:00:00Z',
    },
    lastPositionAt: '2026-08-14T00:00:00Z',
    observedAt: '2026-08-14T00:00:00Z',
    retrievedAt: '2026-08-14T01:00:00Z',
  },
  position: {
    latitude: 3.1234,
    longitude: 101.5678,
    speed: 5.2,
    course: 120,
    heading: null,
    timestamp: '2026-08-14T00:00:00Z',
  },
  events: [
    {
      id: 'ev-1',
      vesselId: 'v-1',
      type: 'AIS_GAP',
      startAt: '2026-08-13T00:00:00Z',
      endAt: '2026-08-13T02:00:00Z',
      latitude: 3.1,
      longitude: 101.5,
      source: 'GFW',
      freshness: 'fresh',
      retrievedAt: '2026-08-14T01:00:00Z',
    },
    {
      id: 'ev-2',
      vesselId: 'v-1',
      type: 'LOITERING',
      startAt: '2026-08-12T00:00:00Z',
      endAt: null,
      latitude: null,
      longitude: null,
      source: 'GFW',
      freshness: 'stale',
      retrievedAt: '2026-08-14T01:00:00Z',
    },
  ],
  source: 'GFW',
  retrievedAt: '2026-08-14T01:00:00Z',
};

const MOCK_EVENTS_RESULT: VesselEventsResult = {
  vesselId: 'v-1',
  events: MOCK_PROFILE.events,
  retrievedAt: '2026-08-14T01:00:00Z',
  source: 'GFW',
};

describe('vessels API', () => {
  let originalFetch: typeof globalThis.fetch;
  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });
  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe('searchVessels', () => {
    it('returns VesselSearchResult on 200', async () => {
      globalThis.fetch = vi
        .fn()
        .mockResolvedValue({
          ok: true,
          status: 200,
          json: async () => MOCK_SEARCH_RESULT,
        } as Response);
      const result = await searchVessels('Kuala');
      expect(result.vessels).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(20);
    });

    it('sends q', async () => {
      globalThis.fetch = vi
        .fn()
        .mockResolvedValue({
          ok: true,
          status: 200,
          json: async () => MOCK_SEARCH_RESULT,
        } as Response);
      await searchVessels('Kuala');
      const url = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]![0] as string;
      expect(url).toContain('q=Kuala');
    });

    it('sends page', async () => {
      globalThis.fetch = vi
        .fn()
        .mockResolvedValue({
          ok: true,
          status: 200,
          json: async () => MOCK_SEARCH_RESULT,
        } as Response);
      await searchVessels('Kuala', 2);
      const url = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]![0] as string;
      expect(url).toContain('page=2');
    });

    it('sends pageSize', async () => {
      globalThis.fetch = vi
        .fn()
        .mockResolvedValue({
          ok: true,
          status: 200,
          json: async () => MOCK_SEARCH_RESULT,
        } as Response);
      await searchVessels('Kuala', 1, 50);
      const url = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]![0] as string;
      expect(url).toContain('pageSize=50');
    });

    it('encodes special characters', async () => {
      globalThis.fetch = vi
        .fn()
        .mockResolvedValue({
          ok: true,
          status: 200,
          json: async () => MOCK_SEARCH_RESULT,
        } as Response);
      await searchVessels('kapal & nelayan');
      const url = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]![0] as string;
      expect(url).toContain('kapal+%26+nelayan');
    });

    it('throws on non-2xx', async () => {
      globalThis.fetch = vi
        .fn()
        .mockResolvedValue({ ok: false, status: 500 } as unknown as Response);
      await expect(searchVessels('Kuala')).rejects.toThrow('500');
    });

    it('preserves backend BM error message', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ message: 'Kapal tidak dijumpai' }),
      } as unknown as Response);
      await expect(searchVessels('Kuala')).rejects.toThrow('Kapal tidak dijumpai');
    });

    it('preserves backend BM error message from nested error body', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 422,
        json: async () => ({ message: 'Parameter carian tidak sah' }),
      } as unknown as Response);
      await expect(searchVessels('Kuala')).rejects.toThrow('Parameter carian tidak sah');
    });

    it('falls back to generic BM message on non-JSON error body', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      } as unknown as Response);
      await expect(searchVessels('Kuala')).rejects.toThrow(/Gagal mendapatkan maklumat kapal/);
    });

    it('falls back to generic BM message when error body has no message', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({}),
      } as unknown as Response);
      await expect(searchVessels('Kuala')).rejects.toThrow(/Gagal mendapatkan maklumat kapal/);
    });

    it('throws on malformed JSON', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      } as unknown as Response);
      await expect(searchVessels('Kuala')).rejects.toThrow('Invalid JSON');
    });
  });

  describe('getVesselProfile', () => {
    it('calls correct endpoint', async () => {
      globalThis.fetch = vi
        .fn()
        .mockResolvedValue({ ok: true, status: 200, json: async () => MOCK_PROFILE } as Response);
      const result = await getVesselProfile('v-1');
      expect(globalThis.fetch).toHaveBeenCalledWith('/api/public/vessels/v-1');
      expect(result.identity.name).toBe('Kuala Laut');
    });

    it('throws on non-2xx', async () => {
      globalThis.fetch = vi
        .fn()
        .mockResolvedValue({ ok: false, status: 404 } as unknown as Response);
      await expect(getVesselProfile('nope')).rejects.toThrow(/Gagal mendapatkan profil kapal/);
    });

    it('preserves backend BM error message', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ message: 'Kapal tidak dijumpai' }),
      } as unknown as Response);
      await expect(getVesselProfile('nope')).rejects.toThrow('Kapal tidak dijumpai');
    });

    it('encodes vessel ID path segment', async () => {
      globalThis.fetch = vi
        .fn()
        .mockResolvedValue({ ok: true, status: 200, json: async () => MOCK_PROFILE } as Response);
      await getVesselProfile('abc/123?x=y');
      expect(globalThis.fetch).toHaveBeenCalledWith('/api/public/vessels/abc%2F123%3Fx%3Dy');
    });
  });

  describe('getVesselEvents', () => {
    it('calls correct endpoint', async () => {
      globalThis.fetch = vi
        .fn()
        .mockResolvedValue({
          ok: true,
          status: 200,
          json: async () => MOCK_EVENTS_RESULT,
        } as Response);
      const result = await getVesselEvents('v-1');
      expect(globalThis.fetch).toHaveBeenCalledWith('/api/public/vessels/v-1/events');
      expect(result.events).toHaveLength(2);
    });

    it('appends dateFrom/dateTo only when supplied', async () => {
      globalThis.fetch = vi
        .fn()
        .mockResolvedValue({
          ok: true,
          status: 200,
          json: async () => MOCK_EVENTS_RESULT,
        } as Response);
      await getVesselEvents('v-1', '2026-08-01', '2026-08-14');
      const url = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]![0] as string;
      expect(url).toContain('dateFrom=2026-08-01');
      expect(url).toContain('dateTo=2026-08-14');
    });

    it('does not append params when not supplied', async () => {
      globalThis.fetch = vi
        .fn()
        .mockResolvedValue({
          ok: true,
          status: 200,
          json: async () => MOCK_EVENTS_RESULT,
        } as Response);
      await getVesselEvents('v-1');
      expect(globalThis.fetch).toHaveBeenCalledWith('/api/public/vessels/v-1/events');
    });

    it('handles empty events', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          vesselId: 'v-1',
          events: [],
          retrievedAt: '2026-08-14T01:00:00Z',
          source: 'GFW',
        }),
      } as Response);
      const result = await getVesselEvents('v-1');
      expect(result.events).toHaveLength(0);
    });

    it('preserves backend BM error message', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ message: 'Kapal tidak dijumpai' }),
      } as unknown as Response);
      await expect(getVesselEvents('nope')).rejects.toThrow('Kapal tidak dijumpai');
    });

    it('encodes vessel ID path segment', async () => {
      globalThis.fetch = vi
        .fn()
        .mockResolvedValue({
          ok: true,
          status: 200,
          json: async () => MOCK_EVENTS_RESULT,
        } as Response);
      await getVesselEvents('abc/123?x=y');
      expect(globalThis.fetch).toHaveBeenCalledWith('/api/public/vessels/abc%2F123%3Fx%3Dy/events');
    });
  });

  describe('data preservation', () => {
    it('handles null vessel fields correctly', async () => {
      globalThis.fetch = vi
        .fn()
        .mockResolvedValue({
          ok: true,
          status: 200,
          json: async () => MOCK_SEARCH_RESULT,
        } as Response);
      const result = await searchVessels('Kuala');
      const vessel = result.vessels[0]!;
      expect(vessel.callsign).toBeNull();
      expect(vessel.length).toBeNull();
      expect(vessel.tonnage).toBeNull();
      expect(vessel.lastKnownPosition?.heading).toBeNull();
    });

    it('preserves AIS_GAP / LOITERING event types', async () => {
      globalThis.fetch = vi
        .fn()
        .mockResolvedValue({ ok: true, status: 200, json: async () => MOCK_PROFILE } as Response);
      const result = await getVesselProfile('v-1');
      expect(result.events[0]!.type).toBe('AIS_GAP');
      expect(result.events[1]!.type).toBe('LOITERING');
    });

    it('preserves provenance fields', async () => {
      globalThis.fetch = vi
        .fn()
        .mockResolvedValue({ ok: true, status: 200, json: async () => MOCK_PROFILE } as Response);
      const result = await getVesselProfile('v-1');
      expect(result.source).toBe('GFW');
      expect(result.retrievedAt).toBe('2026-08-14T01:00:00Z');
      expect(result.identity.dataStatus).toBe('KNOWN');
      expect(result.identity.lastPositionAt).toBe('2026-08-14T00:00:00Z');
      expect(result.events[0]!.freshness).toBe('fresh');
    });
  });
});
