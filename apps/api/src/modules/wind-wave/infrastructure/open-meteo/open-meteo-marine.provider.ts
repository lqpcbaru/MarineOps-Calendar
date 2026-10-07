import { Injectable, Inject } from '@nestjs/common';
import type { WindWaveProviderPort, WindWaveDataPoint } from '../../domain';
import type { OpenMeteoMarineResponse } from './open-meteo-marine-raw-dto';
import { mapOpenMeteoMarine } from './open-meteo-marine-mapper';
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

const OPEN_METEO_FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const OPEN_METEO_MARINE_URL = 'https://marine-api.open-meteo.com/v1/marine';

/**
 * Open-Meteo marine (wind + wave) provider.
 *
 * Key-less and coordinate-driven, exactly like the weather provider. Wind
 * data comes from the standard forecast API (which returns wind_speed,
 * wind_gusts and wind_direction), while wave data comes from the marine API
 * (wave_height and wave_period). The two responses are merged by date.
 */
@Injectable()
export class OpenMeteoMarineProvider implements WindWaveProviderPort {
  private readonly retry: RetryPolicy;
  private readonly logger: ProviderLogger;
  private readonly metrics: ProviderMetrics;
  private readonly health: ProviderHealth;

  constructor(@Inject(STATIONS_QUERY_PORT) private readonly stationPort: StationsQueryPort) {
    this.retry = new RetryPolicy({ maxRetries: 3, baseDelayMs: 1_000 });
    this.logger = new ProviderLogger('OpenMeteoMarine');
    this.metrics = new ProviderMetrics();
    this.health = new ProviderHealth(this.metrics);
  }

  async getWindWave(
    stationId: string,
    dateFrom: string,
    dateTo: string,
  ): Promise<WindWaveDataPoint[]> {
    const start = Date.now();
    this.logger.requestStart('getWindWave', { stationId, dateFrom, dateTo });

    try {
      const { latitude, longitude } = await this.resolveCoordinates(stationId);

      const [windResponse, waveResponse] = await Promise.all([
        this.retry.execute(
          () =>
            this.fetchJson<OpenMeteoMarineResponse>(
              `${OPEN_METEO_FORECAST_URL}?latitude=${latitude}&longitude=${longitude}` +
                '&daily=wind_speed_10m_max,wind_gusts_10m_max,wind_direction_10m_dominant' +
                `&timezone=auto&start_date=${dateFrom}&end_date=${dateTo}`,
            ),
          'OpenMeteoMarine',
          this.logger,
          this.metrics,
        ),
        this.retry.execute(
          () =>
            this.fetchJson<OpenMeteoMarineResponse>(
              `${OPEN_METEO_MARINE_URL}?latitude=${latitude}&longitude=${longitude}` +
                '&daily=wave_height_max,wave_period_max' +
                `&timezone=auto&start_date=${dateFrom}&end_date=${dateTo}`,
            ),
          'OpenMeteoMarine',
          this.logger,
          this.metrics,
        ),
      ]);

      const points = this.mergeResponses(windResponse, waveResponse);
      this.metrics.recordSuccess(Date.now() - start);
      this.logger.requestSuccess('getWindWave', Date.now() - start, points.length);
      return points;
    } catch (error) {
      this.metrics.recordFailure(error instanceof Error ? error.message : 'unknown');
      this.logger.requestFailed(
        'getWindWave',
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

  /**
   * Merges the wind (forecast API) and wave (marine API) responses by date,
   * because Open-Meteo exposes them from two different endpoints.
   */
  private mergeResponses(
    windResponse: OpenMeteoMarineResponse,
    waveResponse: OpenMeteoMarineResponse,
  ): WindWaveDataPoint[] {
    const windPoints = mapOpenMeteoMarine(windResponse);
    const wavePoints = mapOpenMeteoMarine(waveResponse);

    const waveByDate = new Map(wavePoints.map((p) => [p.date, p]));

    return windPoints.map((wind) => {
      const wave = waveByDate.get(wind.date);
      return {
        date: wind.date,
        windSpeed: wind.windSpeed,
        windDirection: wind.windDirection,
        windGusts: wind.windGusts,
        waveHeight: wave?.waveHeight ?? 0,
        wavePeriod: wave?.wavePeriod ?? 0,
      };
    });
  }

  private async resolveCoordinates(
    stationId: string,
  ): Promise<{ latitude: number; longitude: number }> {
    const station = await this.stationPort.findPublicById(stationId);
    if (!station) {
      throw new ProviderConfigurationError('OpenMeteoMarine', `stesen ${stationId} tidak dijumpai`);
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
        throw new ProviderServerError('OpenMeteoMarine', 429);
      }
      throw new ProviderServerError('OpenMeteoMarine', response.status);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new ProviderTimeoutError('OpenMeteoMarine', 10_000);
      }
      if (
        error instanceof Error &&
        (error.message.includes('fetch') || error.message.includes('network'))
      ) {
        throw new ProviderUnavailableError('OpenMeteoMarine', error);
      }
      if (error instanceof Error && error.message.includes('JSON')) {
        throw new ProviderInvalidResponseError('OpenMeteoMarine', 'malformed JSON response');
      }
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }
}
