import type { WeatherDataPoint } from '../../domain';
import type { MetRawForecastItem } from './met-raw-dto';

const CONDITION_MAP: Record<string, string> = {
  'Tiada hujan': 'CLEAR',
  Cerah: 'CLEAR',
  Mendung: 'CLOUDY',
  'Hujan di beberapa tempat': 'RAIN',
  Hujan: 'RAIN',
  'Hujan lebat': 'HEAVY_RAIN',
  'Ribut petir di beberapa tempat': 'THUNDERSTORM',
  'Ribut petir': 'THUNDERSTORM',
  'Hujan dan ribut petir': 'THUNDERSTORM',
};

const WIND_MAP: Record<string, string> = {
  U: 'N',
  TL: 'NE',
  T: 'E',
  TG: 'SE',
  S: 'S',
  BD: 'SW',
  B: 'W',
  BL: 'NW',
};

export function mapCondition(bmCondition: string): string {
  const exact = CONDITION_MAP[bmCondition];
  if (exact) return exact;

  const lower = bmCondition.toLowerCase();
  if (lower.includes('ribut petir')) return 'THUNDERSTORM';
  if (lower.includes('hujan lebat')) return 'HEAVY_RAIN';
  if (lower.includes('hujan')) return 'RAIN';
  if (lower.includes('mendung')) return 'CLOUDY';
  if (lower.includes('cerah') || lower.includes('tiada hujan')) return 'CLEAR';

  return 'UNKNOWN';
}

export function mapWindDirection(bmCode: string): string {
  const upper = bmCode.toUpperCase();
  return WIND_MAP[upper] || upper;
}

export function parseWindSpeedKnots(rangeStr: string): number {
  const match = rangeStr.match(/(\d+)-(\d+)\s*km\/h/);
  if (match && match[1] && match[2]) {
    const midpoint = (Number(match[1]) + Number(match[2])) / 2;
    return Math.round(midpoint * 0.539957 * 10) / 10;
  }
  const single = rangeStr.match(/(\d+)\s*km\/h/);
  if (single && single[1]) {
    return Math.round(Number(single[1]) * 0.539957 * 10) / 10;
  }
  return 0;
}

export function parseWindGustsKnots(rangeStr: string): number {
  const match = rangeStr.match(/(\d+)-(\d+)\s*km\/h/);
  if (match && match[2]) {
    return Math.round(Number(match[2]) * 0.539957 * 10) / 10;
  }
  return parseWindSpeedKnots(rangeStr);
}

export function parseWaveHeight(rangeStr: string): number {
  const match = rangeStr.match(/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)\s*m/);
  if (match && match[1] && match[2]) {
    return (Number(match[1]) + Number(match[2])) / 2;
  }
  const single = rangeStr.match(/(\d+(?:\.\d+)?)\s*m/);
  if (single && single[1]) {
    return Number(single[1]);
  }
  return 0;
}

export function parseMetDate(metDate: string): string {
  const parts = metDate.split('/');
  if (parts.length === 3 && parts[2] && parts[1] && parts[0]) {
    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
  }
  return metDate;
}

export function mapForecastItem(raw: MetRawForecastItem): WeatherDataPoint {
  return {
    date: parseMetDate(raw.date),
    temperature: raw.maxTemperature ?? raw.minTemperature ?? 0,
    conditions: mapCondition(raw.weatherCondition || raw.morningForecast),
    visibility: null,
    precipitation: null,
  };
}

export function mapForecastItems(rawItems: MetRawForecastItem[]): WeatherDataPoint[] {
  return rawItems.map(mapForecastItem);
}
