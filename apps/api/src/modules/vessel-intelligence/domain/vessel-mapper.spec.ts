import { describe, expect, it } from 'vitest';
import { classifyVesselStatus, mapToVesselSummary, mapToVesselEvent } from './vessel-mapper';
import type { AisVesselSummary, AisVesselEvent } from '../../ais/domain';

describe('VesselMapper', () => {
  it('classifies KNOWN when vessel has name and fresh data', () => {
    const vessel: AisVesselSummary = { id: 'v-1', name: 'Test', mmsi: '123', imo: null, flag: 'MY', vesselType: null, source: 'gfw', lastKnownPosition: null, lastPositionAt: '2026-08-07T00:00:00Z' };
    expect(classifyVesselStatus(vessel, 'fresh')).toBe('KNOWN');
  });

  it('classifies UNKNOWN when no name or MMSI', () => {
    const vessel: AisVesselSummary = { id: 'v-1', name: null, mmsi: null, imo: null, flag: null, vesselType: null, source: 'gfw', lastKnownPosition: null, lastPositionAt: null };
    expect(classifyVesselStatus(vessel, 'fresh')).toBe('UNKNOWN');
  });

  it('classifies STALE when data is stale', () => {
    const vessel: AisVesselSummary = { id: 'v-1', name: 'Test', mmsi: '123', imo: null, flag: null, vesselType: null, source: 'gfw', lastKnownPosition: null, lastPositionAt: '2026-08-01T00:00:00Z' };
    expect(classifyVesselStatus(vessel, 'stale')).toBe('STALE');
  });

  it('classifies NO_RECENT_DATA when no position timestamp', () => {
    const vessel: AisVesselSummary = { id: 'v-1', name: 'Test', mmsi: '123', imo: null, flag: null, vesselType: null, source: 'gfw', lastKnownPosition: null, lastPositionAt: null };
    expect(classifyVesselStatus(vessel, 'fresh')).toBe('NO_RECENT_DATA');
  });

  it('maps AisVesselSummary to VesselSummary with provenance', () => {
    const raw: AisVesselSummary = { id: 'v-1', name: 'Test', mmsi: '123', imo: 'IMO1', flag: 'MY', vesselType: 'fishing', source: 'gfw', lastKnownPosition: { latitude: 3, longitude: 101, speed: 5, course: 90, heading: 85, timestamp: '2026-08-07T00:00:00Z' }, lastPositionAt: '2026-08-07T00:00:00Z' };
    const result = mapToVesselSummary(raw, 'fresh');
    expect(result.name).toBe('Test');
    expect(result.source).toBe('gfw');
    expect(result.dataStatus).toBe('KNOWN');
    expect(result.retrievedAt).toBeDefined();
  });

  it('maps AisVesselEvent to VesselEvent preserving LOITERING and AIS_GAP', () => {
    const raw: AisVesselEvent = { id: 'ev-1', vesselId: 'v-1', type: 'LOITERING', startAt: '2026-08-07T00:00:00Z', endAt: null, latitude: 3, longitude: 101, metadata: null };
    const result = mapToVesselEvent(raw, 'fresh');
    expect(result.type).toBe('LOITERING');
    expect(result.source).toBe('gfw');
  });
});
