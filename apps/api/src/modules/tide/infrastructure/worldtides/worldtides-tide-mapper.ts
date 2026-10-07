import type { TideDataPoint } from '../../domain';
import type { WorldTidesExtreme } from './worldtides-raw-dto';

/**
 * Maps a WorldTides extreme event into a MarineOps tide point.
 *
 * WorldTides returns `dt` (Unix timestamp in seconds) and `type` as
 * "High"/"Low". The domain model wants an ISO date, an ISO-ish time, a
 * height in metres, and a HIGH/LOW discriminator.
 */
export function mapExtreme(extreme: WorldTidesExtreme): TideDataPoint {
  const iso = new Date(extreme.dt * 1000).toISOString();
  return {
    date: iso.slice(0, 10),
    time: iso,
    height: extreme.height,
    type: extreme.type === 'Low' ? 'LOW' : 'HIGH',
  };
}

export function mapExtremes(extremes: WorldTidesExtreme[]): TideDataPoint[] {
  return extremes.map(mapExtreme);
}
