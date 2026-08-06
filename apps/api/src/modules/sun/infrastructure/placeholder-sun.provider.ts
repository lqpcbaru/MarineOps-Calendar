import { Injectable } from '@nestjs/common';
import type { SunProviderPort, SunDataPoint } from '../domain';

@Injectable()
export class PlaceholderSunProvider implements SunProviderPort {
  async getSunData(_stationId: string, date: string): Promise<SunDataPoint> {
    return {
      date,
      sunrise: '—',
      sunset: '—',
      solarNoon: '—',
      daylightDuration: '—',
    };
  }
}
