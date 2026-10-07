import { Injectable, Inject } from '@nestjs/common';
import type { TideProviderPort, TideDataPoint } from '../../domain';
import type { WorldTidesResponse } from './worldtides-raw-dto';
import { mapExtremes } from './worldtides-tide-mapper';
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
  ProviderAuthenticationError,
  ProviderRateLimitError,
} from '../../../../shared/provider';
import { STATIONS_QUERY_PORT } from '../../../stations/api/stations.module';
import type { StationsQueryPort } from '../../../stations/application/ports/stations-query.port';

const WORLDTIDES_BASE_URL = 'https://www.worldtides.info/api/v3';

/**
 * WorldTides tide provider.
 *
 * Coordinate-driven like Open-Meteo, but tide requires an API key. The key is
 * read from `WORLDTIDES_API_KEY`. The `extremes` endpoint returns high/low
 * tide events for the requested window.
 */
@Injectable()
export class WorldTidesProvider implements TideProviderPort {
  private readonly retry: RetryPolicy;
  private readonly logger: ProviderLogger;
  private readonly metrics: ProviderMetrics;
  private readonly health: ProviderHealth;

  constructor(@Inject(STATIONS_QUERY_PORT) private readonly stationPort: StationsQueryPort) {
    this.retry = new RetryPolicy({ maxRetries: 3, baseDelayMs: 1_000 });
    this.logger = new ProviderLogger('WorldTides');
    this.metrics = new ProviderMetrics();
    this.health = new ProviderHealth(this.metrics);
  }

  async getTide(stationId: string, dateFrom: string, dateTo: string): Promise<TideDataPoint[]> {
    const start = Date.now();
    this.logger.requestStart('getTide', { stationId, dateFrom, dateTo });

    try {
      const { latitude, longitude } = await this.resolveCoordinates(stationId);
      const key = this.resolveApiKey();
      const startTimestamp = Math.floor(Date.parse(`${dateFrom}T00:00:00Z`) / 1000);
      const endTimestamp = Math.floor(Date.parse(`${dateTo}T23:59:59Z`) / 1000);
      const lengthSeconds = Math.max(endTimestamp - startTimestamp, 86_400);

      const response = await this.retry.execute(
        () =>
          this.fetchJson<WorldTidesResponse>(
            `${WORLDTIDES_BASE_URL}?extremes&lat=${latitude}&lon=${longitude}` +
              `&start=${startTimestamp}&length=${lengthSeconds}&key=${key}`,
          ),
        'WorldTides',
        this.logger,
        this.metrics,
      );

      const points = mapExtremes(response.extremes ?? []);
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
      throw new ProviderConfigurationError('WorldTides', `stesen ${stationId} tidak dijumpai`);
    }
    return { latitude: station.latitude, longitude: station.longitude };
  }

  private resolveApiKey(): string {
    const key = process.env['WORLDTIDES_API_KEY'];
    if (!key) {
      throw new ProviderConfigurationError(
        'WorldTides',
        'API key WORLDTIDES_API_KEY tidak dijumpai dalam environment',
      );
    }
    return key;
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
      if (response.status === 401 || response.status === 403) {
        throw new ProviderAuthenticationError('WorldTides', response.status);
      }
      if (response.status === 429) {
        throw new ProviderRateLimitError('WorldTides');
      }
      throw new ProviderServerError('WorldTides', response.status);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new ProviderTimeoutError('WorldTides', 10_000);
      }
      if (
        error instanceof Error &&
        (error.message.includes('fetch') || error.message.includes('network'))
      ) {
        throw new ProviderUnavailableError('WorldTides', error);
      }
      if (error instanceof Error && error.message.includes('JSON')) {
        throw new ProviderInvalidResponseError('WorldTides', 'malformed JSON response');
      }
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }
}
