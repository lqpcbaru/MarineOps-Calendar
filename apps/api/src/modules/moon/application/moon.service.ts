import { Inject, Injectable } from '@nestjs/common';
import type { MoonResponse } from '../domain';
import type { MoonProviderPort } from '../domain';
import { validateDateString } from '../../../shared-kernel/date-validation';

export const MOON_PROVIDER = 'MOON_PROVIDER';

@Injectable()
export class MoonService {
  constructor(
    @Inject(MOON_PROVIDER) private readonly provider: MoonProviderPort,
  ) {}

  async getMoonPhase(stationId: string, date?: string): Promise<MoonResponse> {
    const targetDate = validateDateString(date, 'date');
    const data = await this.provider.getMoonPhase(stationId, targetDate);
    return { data };
  }
}
