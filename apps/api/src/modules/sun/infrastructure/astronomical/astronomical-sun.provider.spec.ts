import { describe, expect, it } from 'vitest';
import { AstronomicalSunProvider } from './astronomical-sun.provider';
import type { StationsQueryPort } from '../../../stations/application/ports/stations-query.port';
import type { StationRecord } from '../../../stations/domain';
import { NotFoundError } from '../../../../shared-kernel';

function makeStation(overrides: Partial<StationRecord> = {}): StationRecord {
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
    ...overrides,
  };
}

function makeStationsQuery(station: StationRecord | null): StationsQueryPort {
  return {
    findById: async () => station,
    findPublicById: async () => station,
    list: async () => ({ stations: [], total: 0, page: 1, pageSize: 20 }),
    listPublic: async () => ({ stations: [], total: 0, page: 1, pageSize: 20 }),
    listRegions: async () => [],
  };
}

describe('AstronomicalSunProvider', () => {
  it('returns SunDataPoint for a station and date', async () => {
    const provider = new AstronomicalSunProvider(makeStationsQuery(makeStation()));
    const result = await provider.getSunData('st-001', '2026-08-06');
    expect(result.date).toBe('2026-08-06');
    expect(result.sunrise).toBeDefined();
    expect(result.sunset).toBeDefined();
    expect(result.solarNoon).toBeDefined();
    expect(result.daylightDuration).toBeDefined();
  });

  it('sunrise is before sunset', async () => {
    const provider = new AstronomicalSunProvider(makeStationsQuery(makeStation()));
    const result = await provider.getSunData('st-001', '2026-08-06');
    expect(new Date(result.sunrise).getTime()).toBeLessThan(new Date(result.sunset).getTime());
  });

  it("uses the station's own coordinates, not a hardcoded location", async () => {
    // Kudat (WBS, ~6.9°N 116.8°E) vs Kuching (SSW, ~1.6°N 110.4°E) — far
    // enough apart across Malaysia that identical coordinates would be a bug.
    const kudat = makeStation({ id: 'st-kudat', latitude: 6.8833, longitude: 116.8333 });
    const kuching = makeStation({ id: 'st-kuching', latitude: 1.5535, longitude: 110.3593 });

    const kudatResult = await new AstronomicalSunProvider(makeStationsQuery(kudat)).getSunData(
      'st-kudat',
      '2026-08-06',
    );
    const kuchingResult = await new AstronomicalSunProvider(makeStationsQuery(kuching)).getSunData(
      'st-kuching',
      '2026-08-06',
    );

    expect(kudatResult.sunrise).not.toBe(kuchingResult.sunrise);
  });

  // NotFoundError (404), not a provider error (502). Sunrise/sunset is
  // computed in-process from the station's coordinates: no upstream is
  // called, so there is no response that could be invalid. Reporting it as
  // a provider fault made every /api/public/sun request for an unknown
  // station answer 502.
  it('reports an unknown or archived station as not found, not a provider fault', async () => {
    const provider = new AstronomicalSunProvider(makeStationsQuery(null));
    await expect(provider.getSunData('unknown', '2026-08-06')).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it('tracks metrics on success', async () => {
    const provider = new AstronomicalSunProvider(makeStationsQuery(makeStation()));
    await provider.getSunData('st-001', '2026-08-06');
    expect(provider.getMetrics().getState().successfulRequests).toBeGreaterThanOrEqual(1);
  });

  it('health starts online', () => {
    const provider = new AstronomicalSunProvider(makeStationsQuery(makeStation()));
    expect(provider.getHealth().isOnline()).toBe(true);
  });
});
