import type { TideDataPoint } from '../../domain';
import type { OpenMeteoSeaLevelResponse } from './open-meteo-sea-level-raw-dto';

interface Sample {
  time: string;
  height: number;
}

/**
 * Detects high and low tide events from hourly sea-level samples by finding
 * local maxima (HIGH) and minima (LOW) in the height series.
 */
export function detectExtremes(samples: Sample[]): TideDataPoint[] {
  const points: TideDataPoint[] = [];

  for (let i = 1; i < samples.length - 1; i++) {
    const prev = samples[i - 1]!;
    const curr = samples[i]!;
    const next = samples[i + 1]!;

    if (curr.height > prev.height && curr.height > next.height) {
      points.push({
        date: curr.time.slice(0, 10),
        time: curr.time,
        height: Math.round(curr.height * 100) / 100,
        type: 'HIGH',
      });
    } else if (curr.height < prev.height && curr.height < next.height) {
      points.push({
        date: curr.time.slice(0, 10),
        time: curr.time,
        height: Math.round(curr.height * 100) / 100,
        type: 'LOW',
      });
    }
  }

  return points;
}

/**
 * Maps an Open-Meteo sea-level response into MarineOps tide points (high/low
 * events), derived from the hourly height series.
 */
export function mapSeaLevelToTide(raw: OpenMeteoSeaLevelResponse): TideDataPoint[] {
  const hourly = raw.hourly;
  if (!hourly || !Array.isArray(hourly.time) || hourly.time.length === 0) {
    return [];
  }

  const heights = hourly.sea_level_height_msl ?? [];
  const samples: Sample[] = hourly.time.map((time, i) => ({
    time,
    height: heights[i] ?? 0,
  }));

  return detectExtremes(samples);
}
