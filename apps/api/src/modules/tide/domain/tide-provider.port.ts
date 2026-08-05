import type { TideDataPoint } from './tide-dto';

export interface TideProviderPort {
  getTide(stationId: string, dateFrom: string, dateTo: string): Promise<TideDataPoint[]>;
}
