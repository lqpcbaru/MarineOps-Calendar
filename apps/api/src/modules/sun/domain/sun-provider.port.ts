import type { SunDataPoint } from './sun-dto';

export interface SunProviderPort {
  getSunData(stationId: string, date: string): Promise<SunDataPoint>;
}
