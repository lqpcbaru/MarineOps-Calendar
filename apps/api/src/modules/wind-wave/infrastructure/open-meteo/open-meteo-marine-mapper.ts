import type { WindWaveDataPoint } from '../../domain';

/**
 * Open-Meteo wind direction (degrees, meteorological convention: the
 * direction the wind is coming FROM) → 16-point compass name.
 */
const COMPASS: Array<[number, number, string]> = [
  [348.75, 360, 'N'],
  [0, 11.25, 'N'],
  [11.25, 33.75, 'NNE'],
  [33.75, 56.25, 'NE'],
  [56.25, 78.75, 'ENE'],
  [78.75, 101.25, 'E'],
  [101.25, 123.75, 'ESE'],
  [123.75, 146.25, 'SE'],
  [146.25, 168.75, 'SSE'],
  [168.75, 191.25, 'S'],
  [191.25, 213.75, 'SSW'],
  [213.75, 236.25, 'SW'],
  [236.25, 258.75, 'WSW'],
  [258.75, 281.25, 'W'],
  [281.25, 303.75, 'WNW'],
  [303.75, 326.25, 'NW'],
  [326.25, 348.75, 'NNW'],
];

export function mapWindDirection(degrees: number | undefined | null): string {
  if (degrees == null || Number.isNaN(degrees)) return 'UNKNOWN';
  const d = ((degrees % 360) + 360) % 360;
  for (const [from, to, name] of COMPASS) {
    if (d >= from && d < to) return name;
  }
  return 'N';
}

export function mapOpenMeteoMarine(raw: {
  daily?: {
    time: string[];
    wind_speed_10m_max?: number[];
    wind_gusts_10m_max?: number[];
    wind_direction_10m_dominant?: number[];
    wave_height_max?: number[];
    wave_period_max?: number[];
  };
}): WindWaveDataPoint[] {
  const daily = raw.daily;
  if (!daily || !Array.isArray(daily.time) || daily.time.length === 0) {
    return [];
  }

  return daily.time.map((date, index) => ({
    date,
    windSpeed: Math.round((daily.wind_speed_10m_max?.[index] ?? 0) * 10) / 10,
    windDirection: mapWindDirection(daily.wind_direction_10m_dominant?.[index]),
    windGusts: Math.round((daily.wind_gusts_10m_max?.[index] ?? 0) * 10) / 10,
    waveHeight: Math.round((daily.wave_height_max?.[index] ?? 0) * 100) / 100,
    wavePeriod: Math.round((daily.wave_period_max?.[index] ?? 0) * 10) / 10,
  }));
}
