import { Inject, Injectable } from '@nestjs/common';
import type { TideResponse, Freshness } from '../domain';
import type { TideProviderPort } from '../domain';
import { validateDateString } from '../../../shared-kernel/date-validation';

export const TIDE_PROVIDER = 'TIDE_PROVIDER';

@Injectable()
export class TideService {
  constructor(
    @Inject(TIDE_PROVIDER) private readonly provider: TideProviderPort,
  ) {}

  async getTide(stationId: string, dateFrom?: string, dateTo?: string): Promise<TideResponse> {
    const now = new Date();
    const from = validateDateString(dateFrom, 'dateFrom');
    const to = validateDateString(dateTo || from, 'dateTo');

    const data = await this.provider.getTide(stationId, from, to);

    const freshness: Freshness = {
      status: 'fresh',
      fetchedAt: now.toISOString(),
      validUntil: new Date(now.getTime() + 3_600_000).toISOString(),
      source: 'placeholder',
    };

    return { data, freshness };
  }
}
