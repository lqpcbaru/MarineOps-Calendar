import type { WindWaveDataPoint } from './wind-wave-dto';

export interface WindWaveProviderPort {
  getWindWave(stationId: string, dateFrom: string, dateTo: string): Promise<WindWaveDataPoint[]>;
}
