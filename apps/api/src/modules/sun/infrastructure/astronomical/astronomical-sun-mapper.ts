import type { SunDataPoint } from '../../domain';
import type { AstronomicalSunRawData } from './astronomical-sun-raw-dto';

export function mapSunData(raw: AstronomicalSunRawData): SunDataPoint {
  return {
    date: raw.date,
    sunrise: raw.sunrise,
    sunset: raw.sunset,
    solarNoon: raw.solarNoon,
    daylightDuration: raw.daylightDuration,
  };
}
