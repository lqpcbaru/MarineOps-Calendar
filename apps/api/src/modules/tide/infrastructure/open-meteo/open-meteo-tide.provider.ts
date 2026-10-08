import { Injectable, Inject } from '@nestjs/common';
import type { TideProviderPort, TideDataPoint } from '../../domain';
import type { OpenMeteoSeaLevelResponse } from './open-meteo-sea-level-raw-dto';
import { mapSeaLevelToTide } from './open-meteo-tide-mapper';
import {
  RetryPolicy,
  ProviderLogger,
  ProviderMetrics,
  ProviderHealth,
  ProviderConfigurationError,
  ProviderInvalidResponseError,
  ProviderUnavailableError,
  ProviderServerError,
  ProviderTimeoutError,
} from '../../../../shared/provider';
import { STATIONS_QUERY_PORT } from '../../../stations/api/stations.module';
import type { StationsQueryPort } from '../../../stations/application/ports/stations-query.port';

const OPEN_METEO_MARINE_URL = 'https://marine-api.open-meteo.com/v1/marine';

/**
 * Open-Meteo tide provider.
 *
 * Uses the marine API's hourly `sea_level_height_msl` field — free, key-less
 * and coordinate-driven like the weather/wind providers — and derives the
 * day's high/low tide events from the hourly series. This removes the
 * dependency on a third-party tide API with restrictive free quotas.
 */
@Injectable()
export class OpenMeteoTideProvider implements TideProviderPort {
  private readonly retry: RetryPolicy;
  private readonly logger: ProviderLogger;
  private readonly metrics: ProviderMetrics;
  private readonly health: ProviderHealth;

  constructor(@Inject(STATIONS_QUERY_PORT) private readonly stationPort: StationsQueryPort) {
    this.retry = new RetryPolicy({ maxRetries: 3, baseDelayMs: 1_000 });
    this.logger = new ProviderLogger('OpenMeteoTide');
    this.metrics = new ProviderMetrics();
    this.health = new ProviderHealth(this.metrics);
  }

  async getTide(stationId: string, dateFrom: string, dateTo: string): Promise<TideDataPoint[]> {
    const start = Date.now();
    this.logger.requestStart('getTide', { stationId, dateFrom, dateTo });

    try {
      const { latitude, longitude } = await this.resolveCoordinates(stationId);

      const response = await this.retry.execute(
        () =>
          this.fetchJson<OpenMeteoSeaLevelResponse>(
            `${OPEN_METEO_MARINE_URL}?latitude=${latitude}&longitude=${longitude}` +
              '&hourly=sea_level_height_msl' +
              `&timezone=auto&start_date=${dateFrom}&end_date=${dateTo}`,
          ),
        'OpenMeteoTide',
        this.logger,
        this.metrics,
      );

      const points = mapSeaLevelToTide(response);
      this.metrics.recordSuccess(Date.now() - start);
      this.logger.requestSuccess('getTide', Date.now() - start, points.length);
      return points;
    } catch (error) {
      this.metrics.recordFailure(error instanceof Error ? error.message : 'unknown');
      this.logger.requestFailed('getTide', error instanceof Error ? error.message : 'unknown', 1);
      throw error;
    }
  }

  getMetrics() {
    return this.metrics;
  }
  getHealth() {
    return this.health;
  }

  private async resolveCoordinates(
    stationId: string,
  ): Promise<{ latitude: number; longitude: number }> {
    const station = await this.stationPort.findPublicById(stationId);
    if (!station) {
      throw new ProviderConfigurationError('OpenMeteoTide', `stesen ${stationId} tidak dijumpai`);
    }
    return { latitude: station.latitude, longitude: station.longitude };
  }

  private async fetchJson<T>(url: string): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10_000);
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: { Accept: 'application/json', 'User-Agent': 'MarineOps-Hub/2.1' },
        signal: controller.signal,
      });

      if (response.ok) {
        return (await response.json()) as T;
      }
      if (response.status === 429) {
        throw new ProviderServerError('OpenMeteoTide', 429);
      }
      throw new ProviderServerError('OpenMeteoTide', response.status);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new ProviderTimeoutError('OpenMeteoTide', 10_000);
      }
      if (
        error instanceof Error &&
        (error.message.includes('fetch') || error.message.includes('network'))
      ) {
        throw new ProviderUnavailableError('OpenMeteoTide', error);
      }
      if (error instanceof Error && error.message.includes('JSON')) {
        throw new ProviderInvalidResponseError('OpenMeteoTide', 'malformed JSON response');
      }
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }
}
