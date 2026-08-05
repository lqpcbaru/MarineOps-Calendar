import { Injectable } from '@nestjs/common';
import type { MoonProviderPort, MoonDataPoint } from '../domain';

@Injectable()
export class PlaceholderMoonProvider implements MoonProviderPort {
  async getMoonPhase(_stationId: string, date: string): Promise<MoonDataPoint> {
    return {
      date,
      phaseName: '—',
      illumination: 0,
      ageDays: 0,
      moonrise: null,
      moonset: null,
    };
  }
}
