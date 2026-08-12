import { describe, expect, it } from 'vitest';
import {
  mapPosition,
  mapVesselSummary,
  mapVesselProfile,
  mapEventType,
  mapVesselEvent,
} from './gfw-mapper';
import type {
  GfwVesselSearchItem,
  GfwVesselProfileResponse,
  GfwVesselEventItem,
} from './gfw-raw-dto';

describe('GfwMapper', () => {
  describe('mapPosition', () => {
    it('maps valid position', () => {
      const result = mapPosition({
        lat: 3.0,
        lon: 101.0,
        speed: 10,
        course: 180,
        heading: 175,
        timestamp: '2026-08-07T00:00:00Z',
      });
      expect(result!.latitude).toBe(3.0);
      expect(result!.longitude).toBe(101.0);
      expect(result!.speed).toBe(10);
    });
    it('returns null for null position', () => {
      expect(mapPosition(null)).toBeNull();
    });
    it('returns null for invalid coordinates', () => {
      expect(
        mapPosition({
          lat: 200,
          lon: 101,
          speed: null,
          course: null,
          heading: null,
          timestamp: '',
        }),
      ).toBeNull();
    });
  });

  describe('mapVesselSummary', () => {
    it('maps search item with all fields', () => {
      const raw: GfwVesselSearchItem = {
        id: 'v-1',
        shipname: 'Test Vessel',
        mmsi: '123456789',
        imo: 'IMO123',
        flag: 'MY',
        vesselType: 'fishing',
        callsign: 'ABC',
        lastPosition: {
          lat: 3.0,
          lon: 101.0,
          speed: 5,
          course: 90,
          heading: 85,
          timestamp: '2026-08-07T00:00:00Z',
        },
      };
      const result = mapVesselSummary(raw);
      expect(result.id).toBe('v-1');
      expect(result.name).toBe('Test Vessel');
      expect(result.source).toBe('gfw');
      expect(result.lastKnownPosition!.latitude).toBe(3.0);
    });
    it('handles missing fields', () => {
      const raw: GfwVesselSearchItem = {
        id: 'v-2',
        shipname: null,
        mmsi: null,
        imo: null,
        flag: null,
        vesselType: null,
        callsign: null,
        lastPosition: null,
      };
      const result = mapVesselSummary(raw);
      expect(result.name).toBeNull();
      expect(result.lastKnownPosition).toBeNull();
    });
  });

  describe('mapVesselProfile', () => {
    it('maps full profile', () => {
      const raw: GfwVesselProfileResponse = {
        id: 'v-1',
        shipname: 'Fishing Vessel',
        mmsi: '123',
        imo: 'IMO1',
        flag: 'MY',
        callsign: 'XYZ',
        vesselType: 'fishing',
        length: 30,
        width: 8,
        grossTonnage: 200,
        lastPosition: {
          lat: 3.0,
          lon: 101.0,
          speed: null,
          course: null,
          heading: null,
          timestamp: '',
        },
        activitySummary: { fishingHours: 500, encounterCount: 3, portVisitCount: 10 },
      };
      const result = mapVesselProfile(raw);
      expect(result.identity.name).toBe('Fishing Vessel');
      expect(result.activity.fishingHours).toBe(500);
      expect(result.position!.latitude).toBe(3.0);
    });
  });

  describe('mapEventType', () => {
    it('maps known types', () => {
      expect(mapEventType('FISHING')).toBe('FISHING');
      expect(mapEventType('fishing')).toBe('FISHING');
      expect(mapEventType('ENCOUNTER')).toBe('ENCOUNTER');
      expect(mapEventType('PORT_VISIT')).toBe('PORT_VISIT');
      expect(mapEventType('LOITERING')).toBe('LOITERING');
      expect(mapEventType('GAP')).toBe('AIS_GAP');
    });
    it('returns UNKNOWN for unknown', () => {
      expect(mapEventType('UNKNOWN_TYPE')).toBe('UNKNOWN');
    });
  });

  describe('mapVesselEvent', () => {
    it('maps event', () => {
      const raw: GfwVesselEventItem = {
        id: 'ev-1',
        vesselId: 'v-1',
        type: 'FISHING',
        start: '2026-08-07T00:00:00Z',
        end: '2026-08-07T04:00:00Z',
        lat: 3.0,
        lon: 101.0,
      };
      const result = mapVesselEvent(raw);
      expect(result.id).toBe('ev-1');
      expect(result.type).toBe('FISHING');
      expect(result.latitude).toBe(3.0);
    });
  });
});
