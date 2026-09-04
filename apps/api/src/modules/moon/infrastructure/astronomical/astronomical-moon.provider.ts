import { Inject, Injectable } from '@nestjs/common';
import type { MoonProviderPort, MoonDataPoint } from '../../domain';
import { computeMoonPhase } from './moon-engine';
import { mapMoonData } from './astronomical-moon-mapper';
import { ProviderLogger, ProviderMetrics, ProviderHealth } from '../../../../shared/provider';
import { STATIONS_QUERY_PORT } from '../../../stations/api/stations.module';
import type { StationsQueryPort } from '../../../stations/application/ports/stations-query.port';
import { NotFoundError } from '../../../../shared-kernel';

@Injectable()
export class AstronomicalMoonProvider implements MoonProviderPort {
  private readonly logger: ProviderLogger;
  private readonly metrics: ProviderMetrics;
  private readonly health: ProviderHealth;

  constructor(@Inject(STATIONS_QUERY_PORT) private readonly stationsQuery: StationsQueryPort) {
    this.logger = new ProviderLogger('AstronomicalMoon');
    this.metrics = new ProviderMetrics();
    this.health = new ProviderHealth(this.metrics);
  }

  async getMoonPhase(stationId: string, date: string): Promise<MoonDataPoint> {
    const start = Date.now();
    this.logger.requestStart('getMoonPhase', { stationId, date });

    try {
      // Moonrise and moonset depend on where the observer is standing —
      // they are not properties of the date. The previous engine took only
      // a date and invented them, so the stationId argument was accepted
      // and ignored.
      const station = await this.stationsQuery.findPublicById(stationId);
      if (!station) {
        throw new NotFoundError('Station', stationId);
      }

      const parsedDate = new Date(date);
      const raw = computeMoonPhase(parsedDate, station.latitude, station.longitude);
      const result = mapMoonData(raw, date);

      this.metrics.recordSuccess(Date.now() - start);
      this.logger.requestSuccess('getMoonPhase', Date.now() - start, 1);
      return result;
    } catch (error) {
      this.metrics.recordFailure(error instanceof Error ? error.message : 'unknown');
      this.logger.requestFailed(
        'getMoonPhase',
        error instanceof Error ? error.message : 'unknown',
        1,
      );
      throw error;
    }
  }

  getMetrics() {
    return this.metrics;
  }
  getHealth() {
    return this.health;
  }
}
