import { Inject, Injectable } from '@nestjs/common';
import type { WindWaveResponse, Freshness } from '../domain';
import type { WindWaveProviderPort } from '../domain';

export const WIND_WAVE_PROVIDER = 'WIND_WAVE_PROVIDER';

@Injectable()
export class WindWaveService {
  constructor(
    @Inject(WIND_WAVE_PROVIDER) private readonly provider: WindWaveProviderPort,
  ) {}

  async getWindWave(
    stationId: string,
    dateFrom?: string,
    dateTo?: string,
  ): Promise<WindWaveResponse> {
    const now = new Date();
    const from = dateFrom || now.toISOString().slice(0, 10);
    const to = dateTo || from;

    const data = await this.provider.getWindWave(stationId, from, to);

    const freshness: Freshness = {
      status: 'fresh',
      fetchedAt: now.toISOString(),
      validUntil: new Date(now.getTime() + 3_600_000).toISOString(),
      source: 'placeholder',
    };

    return { data, freshness };
  }
}
