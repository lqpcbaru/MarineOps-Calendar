import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { GfwAisProvider } from './gfw.provider';
import type {
  GfwVesselSearchResponse,
  GfwVesselProfileResponse,
  GfwVesselEventsResponse,
} from './gfw-raw-dto';

const MOCK_SEARCH: GfwVesselSearchResponse = {
  entries: [
    {
      id: 'v-1',
      shipname: 'Test',
      mmsi: '123',
      imo: null,
      flag: 'MY',
      vesselType: 'fishing',
      callsign: null,
      lastPosition: {
        lat: 3.0,
        lon: 101.0,
        speed: 5,
        course: 90,
        heading: 85,
        timestamp: '2026-08-07T00:00:00Z',
      },
    },
  ],
  total: 1,
  limit: 20,
  offset: 0,
};

const MOCK_PROFILE: GfwVesselProfileResponse = {
  id: 'v-1',
  shipname: 'Test Vessel',
  mmsi: '123',
  imo: null,
  flag: 'MY',
  callsign: null,
  vesselType: 'fishing',
  length: 30,
  width: 8,
  grossTonnage: null,
  lastPosition: {
    lat: 3.0,
    lon: 101.0,
    speed: 5,
    course: 90,
    heading: 85,
    timestamp: '2026-08-07T00:00:00Z',
  },
  activitySummary: { fishingHours: 100, encounterCount: 2, portVisitCount: 5 },
};

const MOCK_EVENTS: GfwVesselEventsResponse = {
  entries: [
    {
      id: 'ev-1',
      vesselId: 'v-1',
      type: 'FISHING',
      start: '2026-08-07T00:00:00Z',
      end: '2026-08-07T04:00:00Z',
      lat: 3.0,
      lon: 101.0,
    },
  ],
  total: 1,
  limit: 50,
  offset: 0,
};

describe('GfwAisProvider — HTTP mocked', () => {
  let originalFetch: typeof globalThis.fetch;
  beforeEach(() => {
    originalFetch = globalThis.fetch;
    process.env['GFW_API_TOKEN'] = 'test-token';
  });
  afterEach(() => {
    globalThis.fetch = originalFetch;
    delete process.env['GFW_API_TOKEN'];
  });

  it('returns search results on 200', async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue({ ok: true, status: 200, json: async () => MOCK_SEARCH } as Response);
    const result = await new GfwAisProvider().searchVessels('test');
    expect(result.vessels).toHaveLength(1);
    expect(result.vessels[0]!.name).toBe('Test');
  });

  it('returns vessel profile on 200', async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue({ ok: true, status: 200, json: async () => MOCK_PROFILE } as Response);
    const result = await new GfwAisProvider().getVesselProfile('v-1');
    expect(result.identity.name).toBe('Test Vessel');
    expect(result.activity.fishingHours).toBe(100);
  });

  it('returns events on 200', async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue({ ok: true, status: 200, json: async () => MOCK_EVENTS } as Response);
    const result = await new GfwAisProvider().getVesselEvents('v-1');
    expect(result).toHaveLength(1);
    expect(result[0]!.type).toBe('FISHING');
  });

  it('throws on 401', async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => 'Unauthorized',
      } as unknown as Response);
    await expect(new GfwAisProvider().searchVessels('test')).rejects.toThrow(/401/);
  });

  it('throws on 429', async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue({
        ok: false,
        status: 429,
        text: async () => 'Rate limited',
      } as unknown as Response);
    await expect(new GfwAisProvider().searchVessels('test')).rejects.toThrow(/had kadar/);
  });

  it('throws on 500', async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => 'Error',
      } as unknown as Response);
    await expect(new GfwAisProvider().searchVessels('test')).rejects.toThrow(/500/);
  });

  it('throws on 403', async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue({
        ok: false,
        status: 403,
        text: async () => 'Forbidden',
      } as unknown as Response);
    await expect(new GfwAisProvider().searchVessels('test')).rejects.toThrow(/403/);
  });

  it('throws on timeout', async () => {
    const abortError = new DOMException('The operation was aborted', 'AbortError');
    globalThis.fetch = vi.fn().mockRejectedValue(abortError);
    await expect(new GfwAisProvider().searchVessels('test')).rejects.toThrow(/had masa/);
  });

  it('throws on malformed response', async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ entries: null }),
      } as Response);
    await expect(new GfwAisProvider().searchVessels('test')).rejects.toThrow(/missing entries/);
  });

  it('throws on missing API token', async () => {
    delete process.env['GFW_API_TOKEN'];
    globalThis.fetch = vi.fn();
    await expect(new GfwAisProvider().searchVessels('test')).rejects.toThrow(/konfigurasi/);
  });

  it('retries on 500 then succeeds', async () => {
    let calls = 0;
    globalThis.fetch = vi.fn().mockImplementation(() => {
      calls++;
      if (calls < 3)
        return Promise.resolve({
          ok: false,
          status: 500,
          text: async () => 'error',
        } as unknown as Response);
      return Promise.resolve({ ok: true, status: 200, json: async () => MOCK_SEARCH } as Response);
    });
    const result = await new GfwAisProvider().searchVessels('test');
    expect(calls).toBe(3);
    expect(result.vessels).toHaveLength(1);
  });

  it('tracks metrics', async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue({ ok: true, status: 200, json: async () => MOCK_SEARCH } as Response);
    const provider = new GfwAisProvider();
    await provider.searchVessels('test');
    expect(provider.getMetrics().getState().successfulRequests).toBeGreaterThanOrEqual(1);
  });
});
