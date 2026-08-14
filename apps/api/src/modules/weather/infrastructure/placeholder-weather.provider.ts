import { Injectable } from '@nestjs/common';
import type { WeatherProviderPort, WeatherDataPoint } from '../domain';

@Injectable()
export class PlaceholderWeatherProvider implements WeatherProviderPort {
  async getCurrentWeather(stationId: string): Promise<WeatherDataPoint> {
    return this.makeDataPoint(stationId);
  }

  async getForecast(
    stationId: string,
    dateFrom: string,
    dateTo: string,
  ): Promise<WeatherDataPoint[]> {
    const from = new Date(dateFrom);
    const to = new Date(dateTo);
    const days = Math.max(1, Math.ceil((to.getTime() - from.getTime()) / 86_400_000) + 1);

    return Array.from({ length: days }, (_, i) => {
      const d = new Date(from.getTime() + i * 86_400_000);
      return this.makeDataPoint(stationId, d.toISOString().slice(0, 10));
    });
  }

  private makeDataPoint(_stationId: string, date?: string): WeatherDataPoint {
    return {
      date: date || new Date().toISOString().slice(0, 10),
      temperature: 0,
      conditions: '—',
      visibility: null,
      precipitation: null,
    };
  }
}
