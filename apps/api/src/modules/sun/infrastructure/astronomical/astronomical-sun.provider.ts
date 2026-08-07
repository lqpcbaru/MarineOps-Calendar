import { Injectable } from '@nestjs/common';
import type { SunProviderPort, SunDataPoint } from '../../domain';
import { computeSunData } from './sun-engine';
import { mapSunData } from './astronomical-sun-mapper';
import { ProviderLogger, ProviderMetrics, ProviderHealth } from '../../../../shared/provider';

@Injectable()
export class AstronomicalSunProvider implements SunProviderPort {
  private readonly logger: ProviderLogger;
  private readonly metrics: ProviderMetrics;
  private readonly health: ProviderHealth;

  constructor() {
    this.logger = new ProviderLogger('AstronomicalSun');
    this.metrics = new ProviderMetrics();
    this.health = new ProviderHealth(this.metrics);
  }

  async getSunData(stationId: string, date: string): Promise<SunDataPoint> {
    const start = Date.now();
    this.logger.requestStart('getSunData', { stationId, date });

    try {
      const parsedDate = new Date(date);
      const raw = computeSunData(3.0, 101.0, parsedDate);
      const result = mapSunData(raw);

      this.metrics.recordSuccess(Date.now() - start);
      this.logger.requestSuccess('getSunData', Date.now() - start, 1);
      return result;
    } catch (error) {
      this.metrics.recordFailure(error instanceof Error ? error.message : 'unknown');
      this.logger.requestFailed('getSunData', error instanceof Error ? error.message : 'unknown', 1);
      throw error;
    }
  }

  getMetrics() { return this.metrics; }
  getHealth() { return this.health; }
}
