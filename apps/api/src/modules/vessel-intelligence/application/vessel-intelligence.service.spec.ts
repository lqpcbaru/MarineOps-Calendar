import { describe, expect, it } from 'vitest';
import { VesselIntelligenceService } from './vessel-intelligence.service';
import type { AisService } from '../../ais/application/ais.service';

describe('VesselIntelligenceService', () => {
  function createService() {
    const aisService = {
      async searchVessels() {
        return {
          vessels: [{ id: 'v-1', name: 'Test Vessel', mmsi: '123', imo: 'IMO1', flag: 'MY', vesselType: 'fishing', source: 'gfw', lastKnownPosition: { latitude: 3, longitude: 101, speed: 5, course: 90, heading: 85, timestamp: '2026-08-07T00:00:00Z' }, lastPositionAt: '2026-08-07T00:00:00Z' }],
          total: 1, page: 1, pageSize: 20,
          freshness: { status: 'fresh' as const, fetchedAt: '', source: 'gfw' },
        };
      },
      async getVesselProfile() {
        return {
          profile: { identity: { id: 'v-1', name: 'Test Vessel', mmsi: '123', imo: 'IMO1', flag: 'MY', callsign: 'ABC', vesselType: 'fishing', length: 30, width: 8, grossTonnage: 200 }, position: { latitude: 3, longitude: 101, speed: 5, course: 90, heading: 85, timestamp: '2026-08-07T00:00:00Z' }, activity: { fishingHours: 100, encounterCount: 2, portVisitCount: 5 } },
          freshness: { status: 'fresh' as const, fetchedAt: '', source: 'gfw' },
        };
      },
      async getVesselEvents() {
        return {
          vesselId: 'v-1',
          events: [{ id: 'ev-1', vesselId: 'v-1', type: 'FISHING' as const, startAt: '2026-08-07T00:00:00Z', endAt: null, latitude: 3, longitude: 101, metadata: null }],
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
});
