import type { TideDataPoint } from '../../domain';
import type { JupemRawTidePoint, JupemRawTideDay } from './jupem-raw-dto';

const TYPE_MAP: Record<string, 'HIGH' | 'LOW'> = {
  'air pasang': 'HIGH',
  'air surut': 'LOW',
  'pasang': 'HIGH',
  'surut': 'LOW',
  'Air Pasang': 'HIGH',
  'Air Surut': 'LOW',
};

export function mapTideType(jenis: string): 'HIGH' | 'LOW' {
  const lower = jenis.toLowerCase();
  for (const [key, value] of Object.entries(TYPE_MAP)) {
    if (lower.includes(key.toLowerCase())) return value;
  }
  return 'HIGH';
}

export function parseJupemDateTime(tarikh: string, masa: string): string {
  const parts = tarikh.split('-');
  if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
    const [h, m] = masa.split(':');
    const hour = h?.padStart(2, '0') ?? '00';
    const min = m?.padStart(2, '0') ?? '00';
    return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}T${hour}:${min}:00Z`;
  }
  return `${tarikh}T${masa}:00Z`;
}

export function mapTidePoint(raw: JupemRawTidePoint): TideDataPoint {
  const timeStr = parseJupemDateTime(raw.tarikh, raw.masa);
  return {
    date: raw.tarikh,
    time: timeStr,
    height: raw.ketinggian,
    type: mapTideType(raw.jenis),
  };
}

export function mapTideDay(raw: JupemRawTideDay): TideDataPoint[] {
  return raw.pasangSurut.map(mapTidePoint);
}

export function mapTideResponse(days: JupemRawTideDay[]): TideDataPoint[] {
  return days.flatMap(mapTideDay);
}
