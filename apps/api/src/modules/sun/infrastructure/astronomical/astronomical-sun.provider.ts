import { Inject, Injectable } from '@nestjs/common';
import type { SunProviderPort, SunDataPoint } from '../../domain';
import { computeSunData } from './sun-engine';
import { mapSunData } from './astronomical-sun-mapper';
import { ProviderLogger, ProviderMetrics, ProviderHealth } from '../../../../shared/provider';
import { STATIONS_QUERY_PORT } from '../../../stations/api/stations.module';
import type { StationsQueryPort } from '../../../stations/application/ports/stations-query.port';
import { NotFoundError } from '../../../../shared-kernel';

@Injectable()
export class AstronomicalSunProvider implements SunProviderPort {
  private readonly logger: ProviderLogger;
  private readonly metrics: ProviderMetrics;
  private readonly health: ProviderHealth;

  constructor(@Inject(STATIONS_QUERY_PORT) private readonly stationsQuery: StationsQueryPort) {
    this.logger = new ProviderLogger('AstronomicalSun');
    this.metrics = new ProviderMetrics();
    this.health = new ProviderHealth(this.metrics);
  }

  async getSunData(stationId: string, date: string): Promise<SunDataPoint> {
    const start = Date.now();
    this.logger.requestStart('getSunData', { stationId, date });

    try {
      // Sunrise/sunset depend on the station's actual coordinates — Malaysia
      // spans ~7 degrees of latitude and ~19 of longitude (Langkawi to
      // Sandakan), enough to shift solar times by over an hour.
      const station = await this.stationsQuery.findPublicById(stationId);
      if (!station) {
        // NOT a provider error. Sunrise/sunset is computed in-process from
        // the station's coordinates — there is no upstream call and so no
        // response that could be invalid. Reporting this as one produced a
        // 502 for what is simply a station the caller asked for and we do
        // not have, which is a 404.
        throw new NotFoundError('Station', stationId);
      }

      const parsedDate = new Date(date);
      const raw = computeSunData(station.latitude, station.longitude, parsedDate);
      const result = mapSunData(raw);

      this.metrics.recordSuccess(Date.now() - start);
      this.logger.requestSuccess('getSunData', Date.now() - start, 1);
      return result;
    } catch (error) {
      this.metrics.recordFailure(error instanceof Error ? error.message : 'unknown');
      this.logger.requestFailed(
        'getSunData',
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
