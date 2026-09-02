import { describe, expect, it } from 'vitest';
import { VesselIntelligenceService } from './vessel-intelligence.service';
import type { AisService } from '../../ais/application/ais.service';

describe('VesselIntelligenceService', () => {
  function createService() {
    const aisService = {
      async searchVessels() {
        return {
          vessels: [
            {
              id: 'v-1',
              name: 'Test Vessel',
              mmsi: '123',
              imo: 'IMO1',
              flag: 'MY',
              vesselType: 'fishing',
              source: 'gfw',
              lastKnownPosition: {
                latitude: 3,
                longitude: 101,
                speed: 5,
                course: 90,
                heading: 85,
                timestamp: '2026-08-07T00:00:00Z',
              },
              lastPositionAt: '2026-08-07T00:00:00Z',
            },
          ],
          total: 1,
          page: 1,
          pageSize: 20,
          freshness: { status: 'fresh' as const, fetchedAt: '', source: 'gfw' },
        };
      },
      async getVesselProfile() {
        return {
          profile: {
            identity: {
              id: 'v-1',
              name: 'Test Vessel',
              mmsi: '123',
              imo: 'IMO1',
              flag: 'MY',
              callsign: 'ABC',
              vesselType: 'fishing',
              length: 30,
              width: 8,
              grossTonnage: 200,
            },
            position: {
              latitude: 3,
              longitude: 101,
              speed: 5,
              course: 90,
              heading: 85,
              timestamp: '2026-08-07T00:00:00Z',
            },
            activity: { fishingHours: 100, encounterCount: 2, portVisitCount: 5 },
          },
          freshness: { status: 'fresh' as const, fetchedAt: '', source: 'gfw' },
        };
      },
      async getVesselEvents() {
        return {
          vesselId: 'v-1',
          events: [
            {
              id: 'ev-1',
              vesselId: 'v-1',
              type: 'FISHING' as const,
              startAt: '2026-08-07T00:00:00Z',
              endAt: null,
              latitude: 3,
              longitude: 101,
              metadata: null,
            },
          ],
          freshness: { status: 'fresh' as const, fetchedAt: '', source: 'gfw' },
        };
      },
    } as unknown as AisService;
    return new VesselIntelligenceService(aisService);
  }

  it('returns normalized vessel search results', async () => {
    const svc = createService();
    const result = await svc.searchVessels('test');
    expect(result.vessels).toHaveLength(1);
    expect(result.vessels[0]!.name).toBe('Test Vessel');
    expect(result.vessels[0]!.dataStatus).toBe('KNOWN');
    expect(result.source).toBe('gfw');
    expect(result.retrievedAt).toBeDefined();
  });

  it('returns vessel profile with events', async () => {
    const svc = createService();
    const result = await svc.getVesselProfile('v-1');
    expect(result.identity.name).toBe('Test Vessel');
    expect(result.identity.length).toBe(30);
    expect(result.identity.tonnage).toBe(200);
    expect(result.events).toHaveLength(1);
    expect(result.source).toBe('gfw');
  });

  it('returns vessel events with source', async () => {
    const svc = createService();
    const result = await svc.getVesselEvents('v-1');
    expect(result.events).toHaveLength(1);
    expect(result.events[0]!.type).toBe('FISHING');
    expect(result.source).toBe('gfw');
  });

  it('preserves AIS_GAP event type through normalization', async () => {
    const aisService = {
      async searchVessels() {
        return {
          vessels: [],
          total: 0,
          page: 1,
          pageSize: 20,
          freshness: { status: 'fresh' as const, fetchedAt: '', source: 'gfw' },
        };
      },
      async getVesselProfile() {
        return {
          profile: {
            identity: {
              id: '',
              name: null,
              mmsi: null,
              imo: null,
              flag: null,
              callsign: null,
              vesselType: null,
              length: null,
              width: null,
              grossTonnage: null,
            },
            position: null,
            activity: { fishingHours: null, encounterCount: null, portVisitCount: null },
          },
          freshness: { status: 'fresh' as const, fetchedAt: '', source: 'gfw' },
        };
      },
      async getVesselEvents() {
        return {
          vesselId: 'v-1',
          events: [
            {
              id: 'ev-1',
              vesselId: 'v-1',
              type: 'FISHING' as const,
              startAt: '',
              endAt: null,
              latitude: null,
              longitude: null,
              metadata: null,
            },
            {
              id: 'ev-2',
              vesselId: 'v-1',
              type: 'AIS_GAP' as const,
              startAt: '',
              endAt: null,
              latitude: null,
              longitude: null,
              metadata: null,
            },
            {
              id: 'ev-3',
              vesselId: 'v-1',
              type: 'LOITERING' as const,
              startAt: '',
              endAt: null,
              latitude: null,
              longitude: null,
              metadata: null,
            },
          ],
          freshness: { status: 'fresh' as const, fetchedAt: '', source: 'gfw' },
        };
      },
    } as unknown as AisService;
    const svc = new VesselIntelligenceService(aisService);
    const result = await svc.getVesselEvents('v-1');
    expect(result.events).toHaveLength(3);
    expect(result.events[0]!.type).toBe('FISHING');
    expect(result.events[1]!.type).toBe('AIS_GAP');
    expect(result.events[2]!.type).toBe('LOITERING');
  });

  describe('public query validation', () => {
    /**
     * These endpoints are unauthenticated and forward their parameters to
     * Global Fishing Watch (as limit/offset) and into the cache key, so
     * unbounded values are both quota amplification and unbounded
     * cache-key growth.
     */
    function captureForwarded() {
      const calls: Array<{ q: string; page: number; pageSize: number }> = [];
      const aisService = {
        async searchVessels(q: string, page: number, pageSize: number) {
          calls.push({ q, page, pageSize });
          return {
            vessels: [],
            total: 0,
            page,
            pageSize,
            freshness: { status: 'fresh' as const, fetchedAt: '', source: 'gfw' },
          };
        },
      } as unknown as AisService;
      return { svc: new VesselIntelligenceService(aisService), calls };
    }

    it('rejects a pageSize above the 100 cap instead of forwarding it upstream', async () => {
      const { svc, calls } = captureForwarded();
      await expect(svc.searchVessels('x', 1, 100_000)).rejects.toThrow();
      expect(calls).toHaveLength(0);
    });

    it('rejects a non-numeric page instead of sending offset=NaN upstream', async () => {
      const { svc, calls } = captureForwarded();
      await expect(svc.searchVessels('x', 'abc' as unknown as number, 20)).rejects.toThrow();
      expect(calls).toHaveLength(0);
    });

    it('rejects page 0 (which would compute a negative offset)', async () => {
      const { svc } = captureForwarded();
      await expect(svc.searchVessels('x', 0, 20)).rejects.toThrow();
    });

    it('coerces numeric strings, as they arrive from the query string', async () => {
      const { svc, calls } = captureForwarded();
      await svc.searchVessels('x', '2' as unknown as number, '50' as unknown as number);
      expect(calls[0]).toEqual({ q: 'x', page: 2, pageSize: 50 });
    });

    it('caps an over-long search term rather than forwarding it', async () => {
      const { svc, calls } = captureForwarded();
      await expect(svc.searchVessels('a'.repeat(201))).rejects.toThrow();
      expect(calls).toHaveLength(0);
    });

    it('rejects a malformed date range on vessel events', async () => {
      const aisService = {
        async getVesselEvents() {
          throw new Error('must not be called');
        },
      } as unknown as AisService;
      const svc = new VesselIntelligenceService(aisService);
      await expect(svc.getVesselEvents('v-1', 'not-a-date')).rejects.toThrow();
    });

    it('still allows omitted dates (no filter), which is what the portal sends', async () => {
      const aisService = {
        async getVesselEvents(_id: string, dateFrom?: string, dateTo?: string) {
          expect(dateFrom).toBeUndefined();
          expect(dateTo).toBeUndefined();
          return {
            vesselId: 'v-1',
            events: [],
            freshness: { status: 'fresh' as const, fetchedAt: '', source: 'gfw' },
          };
        },
      } as unknown as AisService;
      const svc = new VesselIntelligenceService(aisService);
      await expect(svc.getVesselEvents('v-1')).resolves.toBeDefined();
    });
  });
});
