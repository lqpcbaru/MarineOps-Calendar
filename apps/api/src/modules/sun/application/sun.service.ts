import { Inject, Injectable } from '@nestjs/common';
import type { SunResponse } from '../domain';
import type { SunProviderPort } from '../domain';

export const SUN_PROVIDER = 'SUN_PROVIDER';

@Injectable()
export class SunService {
  constructor(
    @Inject(SUN_PROVIDER) private readonly provider: SunProviderPort,
  ) {}

  async getSunData(stationId: string, date?: string): Promise<SunResponse> {
    const targetDate = date || new Date().toISOString().slice(0, 10);
    const data = await this.provider.getSunData(stationId, targetDate);
    return { data };
  }
}
