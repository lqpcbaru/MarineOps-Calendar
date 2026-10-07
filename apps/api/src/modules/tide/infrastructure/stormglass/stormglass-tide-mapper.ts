import type { TideDataPoint } from '../../domain';
import type { StormGlassTideExtreme } from './stormglass-raw-dto';

/**
 * Maps a StormGlass tide extreme into a MarineOps tide point.
 *
 * StormGlass returns an ISO `time` and a "high"/"low" `type`. The domain
 * model wants a YYYY-MM-DD date, an ISO time, a height in metres, and a
 * HIGH/LOW discriminator.
 */
export function mapExtreme(extreme: StormGlassTideExtreme): TideDataPoint {
  const iso = extreme.time;
  return {
    date: iso.slice(0, 10),
    time: iso,
    height: extreme.height,
    type: extreme.type === 'low' ? 'LOW' : 'HIGH',
  };
}

export function mapExtremes(extremes: StormGlassTideExtreme[]): TideDataPoint[] {
  return extremes.map(mapExtreme);
}
