import type { WeatherDataPoint } from '../../domain';

/**
 * Open-Meteo WMO weather code → MarineOps condition.
 *
 * Open-Meteo returns numeric WMO weather codes (0–99). Only the values that
 * matter for a marine operations calendar are mapped; everything else falls
 * through to UNKNOWN rather than being silently mis-labelled.
 */
const WMO_CONDITION_MAP: Record<number, string> = {
  0: 'CLEAR',
  1: 'CLEAR',
  2: 'CLOUDY',
  3: 'CLOUDY',
  45: 'CLOUDY',
  48: 'CLOUDY',
  51: 'RAIN',
  53: 'RAIN',
  55: 'RAIN',
  61: 'RAIN',
  63: 'RAIN',
  65: 'HEAVY_RAIN',
  80: 'RAIN',
  81: 'RAIN',
  82: 'HEAVY_RAIN',
  95: 'THUNDERSTORM',
  96: 'THUNDERSTORM',
  99: 'THUNDERSTORM',
};

export function mapWmoCondition(code: number | undefined | null): string {
  if (code == null) return 'UNKNOWN';
  return WMO_CONDITION_MAP[code] ?? 'UNKNOWN';
}

/**
 * Maps an Open-Meteo daily response into MarineOps weather points.
 *
 * The arrays are index-aligned; a missing index yields a safe fallback
 * rather than throwing, so a partial upstream payload degrades to empty
 * values instead of taking the request down.
 */
export function mapOpenMeteoWeather(raw: {
  daily?: {
    time: string[];
    temperature_2m_max?: number[];
    temperature_2m_min?: number[];
    weather_code?: number[];
    precipitation_sum?: number[];
  };
}): WeatherDataPoint[] {
  const daily = raw.daily;
  if (!daily || !Array.isArray(daily.time) || daily.time.length === 0) {
    return [];
  }

  return daily.time.map((date, index) => ({
    date,
    temperature:
      Math.round(
        (daily.temperature_2m_max?.[index] ?? daily.temperature_2m_min?.[index] ?? 0) * 10,
      ) / 10,
    conditions: mapWmoCondition(daily.weather_code?.[index]),
    visibility: null,
    precipitation: daily.precipitation_sum?.[index] ?? null,
  }));
}
