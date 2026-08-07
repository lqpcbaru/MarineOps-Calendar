import type { WindWaveDataPoint } from '../../domain';
import type { MarineRawForecastItem } from './marine-raw-dto';

const WIND_MAP: Record<string, string> = {
  'U': 'N', 'TL': 'NE', 'T': 'E', 'TG': 'SE',
  'S': 'S', 'BD': 'SW', 'B': 'W', 'BL': 'NW',
};

export function mapWindDirection(bmCode: string): string {
  const upper = bmCode.toUpperCase();
  return WIND_MAP[upper] || upper;
}

export function parseWindSpeedKnots(rangeStr: string): number {
  const match = rangeStr.match(/(\d+)-(\d+)\s*km\/h/);
  if (match && match[1] && match[2]) {
    return Math.round((Number(match[1]) + Number(match[2])) / 2 * 0.539957 * 10) / 10;
  }
  const single = rangeStr.match(/(\d+)\s*km\/h/);
  if (single && single[1]) return Math.round(Number(single[1]) * 0.539957 * 10) / 10;
  return 0;
}

export function parseWindGustsKnots(rangeStr: string): number {
  const match = rangeStr.match(/(\d+)-(\d+)\s*km\/h/);
  if (match && match[2]) return Math.round(Number(match[2]) * 0.539957 * 10) / 10;
  return parseWindSpeedKnots(rangeStr);
}

export function parseWaveHeight(rangeStr: string): number {
  const match = rangeStr.match(/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)\s*m/);
  if (match && match[1] && match[2]) return (Number(match[1]) + Number(match[2])) / 2;
  const single = rangeStr.match(/(\d+(?:\.\d+)?)\s*m/);
  if (single && single[1]) return Number(single[1]);
  return 0;
}

export function parseMarineDate(metDate: string): string {
  const parts = metDate.split('/');
  if (parts.length === 3 && parts[2] && parts[1] && parts[0]) {
    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
  }
  return metDate;
}

export function mapForecastItem(raw: MarineRawForecastItem): WindWaveDataPoint {
  return {
    date: parseMarineDate(raw.tarikh),
    windSpeed: parseWindSpeedKnots(raw.kelajuanAngin),
    windDirection: mapWindDirection(raw.arahAngin),
    windGusts: parseWindGustsKnots(raw.kelajuanAngin),
    waveHeight: parseWaveHeight(raw.ketinggianOmbak),
    wavePeriod: raw.tempohOmbak ?? 0,
  };
}

export function mapForecastItems(rawItems: MarineRawForecastItem[]): WindWaveDataPoint[] {
  return rawItems.map(mapForecastItem);
}
