import { Injectable } from '@nestjs/common';
import type { WindWaveProviderPort, WindWaveDataPoint } from '../domain';

@Injectable()
export class PlaceholderWindWaveProvider implements WindWaveProviderPort {
  async getWindWave(
    _stationId: string,
    dateFrom: string,
    dateTo: string,
  ): Promise<WindWaveDataPoint[]> {
    const from = new Date(dateFrom);
    const to = new Date(dateTo);
    const days = Math.max(1, Math.ceil((to.getTime() - from.getTime()) / 86_400_000) + 1);

    return Array.from({ length: days }, (_, i) => {
      const d = new Date(from.getTime() + i * 86_400_000);
      return {
        date: d.toISOString().slice(0, 10),
        windSpeed: 0,
        windDirection: '—',
        windGusts: 0,
        waveHeight: 0,
        wavePeriod: 0,
      };
    });
  }
}
