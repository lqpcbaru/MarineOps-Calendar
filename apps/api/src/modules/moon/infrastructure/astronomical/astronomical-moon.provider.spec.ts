import { describe, expect, it } from 'vitest';
import { AstronomicalMoonProvider } from './astronomical-moon.provider';
import type { StationsQueryPort } from '../../../stations/application/ports/stations-query.port';
import type { StationRecord } from '../../../stations/domain';
import { NotFoundError } from '../../../../shared-kernel';

function makeStation(): StationRecord {
  return {
    id: 'st-001',
    code: 'PKG-01',
    name: 'Pelabuhan Klang',
    latitude: 3.0033,
    longitude: 101.3925,
    timezone: 'Asia/Kuala_Lumpur',
    regionId: null,
    status: 'ACTIVE',
    metadata: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

function makeStationsQuery(station: StationRecord | null = makeStation()): StationsQueryPort {
  return {
    findById: async () => station,
    findPublicById: async () => station,
    list: async () => ({ stations: [], total: 0, page: 1, pageSize: 20 }),
    listPublic: async () => ({ stations: [], total: 0, page: 1, pageSize: 20 }),
    listRegions: async () => [],
  };
}

describe('AstronomicalMoonProvider', () => {
  it('returns MoonDataPoint for a station and date', async () => {
    const provider = new AstronomicalMoonProvider(makeStationsQuery());
    const result = await provider.getMoonPhase('st-001', '2026-08-06');
    expect(result.date).toBe('2026-08-06');
    expect(result.phaseName).toBeDefined();
    expect(result.illumination).toBeGreaterThanOrEqual(0);
    expect(result.ageDays).toBeGreaterThan(0);
    expect(result.moonrise).toBeDefined();
    expect(result.moonset).toBeDefined();
  });

  it('returns different phases for different dates', async () => {
    const provider = new AstronomicalMoonProvider(makeStationsQuery());
    const a = await provider.getMoonPhase('st-001', '2026-08-01');
    const b = await provider.getMoonPhase('st-001', '2026-08-29');
    expect(a.phaseName).not.toBe(b.phaseName);
  });

  it('tracks metrics on success', async () => {
    const provider = new AstronomicalMoonProvider(makeStationsQuery());
    await provider.getMoonPhase('st-001', '2026-08-06');
    expect(provider.getMetrics().getState().successfulRequests).toBeGreaterThanOrEqual(1);
  });

  it('health starts online', () => {
    const provider = new AstronomicalMoonProvider(makeStationsQuery());
    expect(provider.getHealth().isOnline()).toBe(true);
  });

  // Moonrise and moonset are properties of a place, not just a date. The
  // previous engine invented them from the date alone, so the stationId
  // was accepted and ignored — an unknown station produced confident
  // numbers instead of an error.
  it('rejects an unknown station rather than inventing a location', async () => {
    const provider = new AstronomicalMoonProvider(makeStationsQuery(null));
    await expect(provider.getMoonPhase('nope', '2026-08-06')).rejects.toBeInstanceOf(NotFoundError);
  });
});
