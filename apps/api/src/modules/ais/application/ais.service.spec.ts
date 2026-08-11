import { describe, expect, it } from 'vitest';
import { AisService } from './ais.service';
import type { AISProviderPort, AisVesselSummary, AisVesselProfile, AisVesselEvent } from '../domain';
import { CacheService } from '../../../shared/cache/cache.service';
import { InMemoryCacheStore } from '../../../shared/cache/in-memory-cache.store';
import { createCachePolicy } from '../../../shared/cache/cache-policy';

function createCache(): CacheService<AisVesselSummary[]> {
  return new CacheService(new InMemoryCacheStore(), createCachePolicy({ ttlMs: 30 * 60 * 1000, staleTtlMs: 120 * 60 * 1000 })) as unknown as CacheService<AisVesselSummary[]>;
}

class StubAisProvider implements AISProviderPort {
  async searchVessels() { return { vessels: [{ id: 'v-1', name: 'Test', mmsi: null, imo: null, flag: null, vesselType: null, source: 'gfw', lastKnownPosition: null, lastPositionAt: null }], total: 1 }; }
  async getVesselProfile(): Promise<AisVesselProfile> { return { identity: { id: 'v-1', name: 'Test', mmsi: null, imo: null, flag: null, callsign: null, vesselType: null, length: null, width: null, grossTonnage: null }, position: null, activity: { fishingHours: null, encounterCount: null, portVisitCount: null } }; }
  async getVesselEvents(): Promise<AisVesselEvent[]> { return [{ id: 'ev-1', vesselId: 'v-1', type: 'FISHING', startAt: '', endAt: null, latitude: null, longitude: null, metadata: null }]; }
}

describe('AisService', () => {
  it('returns search results with freshness', async () => {
    const svc = new AisService(new StubAisProvider(), createCache());
    const result = await svc.searchVessels('test');
    expect(result.vessels).toHaveLength(1);
    expect(result.freshness.status).toBe('fresh');
  });

  it('returns vessel profile', async () => {
    const svc = new AisService(new StubAisProvider(), createCache());
    const result = await svc.getVesselProfile('v-1');
    expect(result.profile.identity.name).toBe('Test');
  });

  it('returns vessel events', async () => {
    const svc = new AisService(new StubAisProvider(), createCache());
    const result = await svc.getVesselEvents('v-1');
    expect(result.events).toHaveLength(1);
    expect(result.events[0]!.type).toBe('FISHING');
  });

  it('cache is reused on second call', async () => {
    let calls = 0;
    const counting: AISProviderPort = {
      async searchVessels() { calls++; return { vessels: [], total: 0 }; },
      async getVesselProfile() { calls++; return { identity: { id: '', name: null, mmsi: null, imo: null, flag: null, callsign: null, vesselType: null, length: null, width: null, grossTonnage: null }, position: null, activity: { fishingHours: null, encounterCount: null, portVisitCount: null } }; },
      async getVesselEvents() { calls++; return []; },
    };
    const svc = new AisService(counting, createCache());
    await svc.searchVessels('test');
    await svc.searchVessels('test');
    expect(calls).toBe(1);
  });
});
