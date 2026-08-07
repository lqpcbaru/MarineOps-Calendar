import { Injectable } from '@nestjs/common';
import type { MoonProviderPort, MoonDataPoint } from '../../domain';
import { computeMoonPhase } from './moon-engine';
import { mapMoonData } from './astronomical-moon-mapper';
import { ProviderLogger, ProviderMetrics, ProviderHealth } from '../../../../shared/provider';

@Injectable()
export class AstronomicalMoonProvider implements MoonProviderPort {
  private readonly logger: ProviderLogger;
  private readonly metrics: ProviderMetrics;
  private readonly health: ProviderHealth;

  constructor() {
    this.logger = new ProviderLogger('AstronomicalMoon');
    this.metrics = new ProviderMetrics();
    this.health = new ProviderHealth(this.metrics);
  }

  async getMoonPhase(stationId: string, date: string): Promise<MoonDataPoint> {
    const start = Date.now();
    this.logger.requestStart('getMoonPhase', { stationId, date });

    try {
      const parsedDate = new Date(date);
      const raw = computeMoonPhase(parsedDate);
      const result = mapMoonData(raw, date);

      this.metrics.recordSuccess(Date.now() - start);
      this.logger.requestSuccess('getMoonPhase', Date.now() - start, 1);
      return result;
    } catch (error) {
      this.metrics.recordFailure(error instanceof Error ? error.message : 'unknown');
      this.logger.requestFailed('getMoonPhase', error instanceof Error ? error.message : 'unknown', 1);
      throw error;
    }
  }

  getMetrics() { return this.metrics; }
  getHealth() { return this.health; }
}
