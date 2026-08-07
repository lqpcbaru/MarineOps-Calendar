import type { MoonDataPoint } from '../../domain';
import type { AstronomicalMoonRawData } from './astronomical-moon-raw-dto';

export function mapMoonData(raw: AstronomicalMoonRawData, date: string): MoonDataPoint {
  return {
    date,
    phaseName: raw.phaseName,
    illumination: raw.illumination,
    ageDays: raw.ageDays,
    moonrise: raw.moonrise,
    moonset: raw.moonset,
  };
}
