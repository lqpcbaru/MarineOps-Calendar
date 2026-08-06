import { Inject, Injectable } from '@nestjs/common';
import type { WeatherResponse, Freshness } from '../domain';
import type { WeatherProviderPort } from '../domain';
import { validateDateString } from '../../../shared-kernel/date-validation';

export const WEATHER_PROVIDER = 'WEATHER_PROVIDER';

@Injectable()
export class WeatherService {
  constructor(
    @Inject(WEATHER_PROVIDER) private readonly provider: WeatherProviderPort,
  ) {}

  async getWeather(
    stationId: string,
    dateFrom?: string,
    dateTo?: string,
  ): Promise<WeatherResponse> {
    const now = new Date();
    const from = validateDateString(dateFrom, 'dateFrom');
    const to = validateDateString(dateTo || from, 'dateTo');

    const data = await this.provider.getForecast(stationId, from, to);

    const freshness: Freshness = {
      status: 'fresh',
      fetchedAt: now.toISOString(),
      validUntil: new Date(now.getTime() + 10_800_000).toISOString(),
      source: 'placeholder',
    };

    return { data, freshness };
  }

  async refreshStation(stationId: string): Promise<void> {
    const today = new Date().toISOString().slice(0, 10);
    await this.getWeather(stationId, today, today);
  }
}
