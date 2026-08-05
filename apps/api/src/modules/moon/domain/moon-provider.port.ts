import type { MoonDataPoint } from './moon-dto';

export interface MoonProviderPort {
  getMoonPhase(stationId: string, date: string): Promise<MoonDataPoint>;
}
