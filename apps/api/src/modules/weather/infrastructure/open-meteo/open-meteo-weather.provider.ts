import { Injectable, Inject } from '@nestjs/common';
import type { WeatherProviderPort, WeatherDataPoint } from '../../domain';
import type { OpenMeteoWeatherResponse } from './open-meteo-weather-raw-dto';
import { mapOpenMeteoWeather } from './open-meteo-weather-mapper';
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

const OPEN_METEO_BASE_URL = 'https://api.open-meteo.com/v1/forecast';

/**
 * Open-Meteo weather provider.
 *
 * Open-Meteo is a free, key-less global forecast API queried by latitude and
 * longitude. Unlike the MET Malaysia provider it needs no API key and no
 * operator-supplied area mapping — the station's own coordinates (already
 * stored on `stations`) are the query. This makes it immediately usable
 * without any external registration.
 */
@Injectable()
export class OpenMeteoWeatherProvider implements WeatherProviderPort {
  private readonly retry: RetryPolicy;
  private readonly logger: ProviderLogger;
  private readonly metrics: ProviderMetrics;
  private readonly health: ProviderHealth;

  constructor(@Inject(STATIONS_QUERY_PORT) private readonly stationPort: StationsQueryPort) {
    this.retry = new RetryPolicy({ maxRetries: 3, baseDelayMs: 1_000 });
    this.logger = new ProviderLogger('OpenMeteo');
    this.metrics = new ProviderMetrics();
    this.health = new ProviderHealth(this.metrics);
  }

  async getCurrentWeather(stationId: string): Promise<WeatherDataPoint> {
    const start = Date.now();
    this.logger.requestStart('getCurrentWeather', { stationId });

    try {
      const { latitude, longitude } = await this.resolveCoordinates(stationId);
      const response = await this.retry.execute(
        () =>
          this.fetchJson<OpenMeteoWeatherResponse>(
            `${OPEN_METEO_BASE_URL}?latitude=${latitude}&longitude=${longitude}` +
              '&current_weather=true&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_sum' +
              '&timezone=auto&forecast_days=1',
          ),
        'OpenMeteo',
        this.logger,
        this.metrics,
      );

      const points = mapOpenMeteoWeather(response);
      const point =
        points[0] ?? this.fromCurrentWeather(response, new Date().toISOString().slice(0, 10));

      this.metrics.recordSuccess(Date.now() - start);
      this.logger.requestSuccess('getCurrentWeather', Date.now() - start, 1);
      return point;
    } catch (error) {
      this.metrics.recordFailure(error instanceof Error ? error.message : 'unknown');
      this.logger.requestFailed(
        'getCurrentWeather',
        error instanceof Error ? error.message : 'unknown',
        1,
      );
      throw error;
    }
  }

  async getForecast(
    stationId: string,
    dateFrom: string,
    dateTo: string,
  ): Promise<WeatherDataPoint[]> {
    const start = Date.now();
    this.logger.requestStart('getForecast', { stationId, dateFrom, dateTo });

    try {
      const { latitude, longitude } = await this.resolveCoordinates(stationId);
      const response = await this.retry.execute(
        () =>
          this.fetchJson<OpenMeteoWeatherResponse>(
            `${OPEN_METEO_BASE_URL}?latitude=${latitude}&longitude=${longitude}` +
              '&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_sum' +
              `&timezone=auto&start_date=${dateFrom}&end_date=${dateTo}`,
          ),
        'OpenMeteo',
        this.logger,
        this.metrics,
      );

      const points = mapOpenMeteoWeather(response);
      this.metrics.recordSuccess(Date.now() - start);
      this.logger.requestSuccess('getForecast', Date.now() - start, points.length);
      return points;
    } catch (error) {
      this.metrics.recordFailure(error instanceof Error ? error.message : 'unknown');
      this.logger.requestFailed(
        'getForecast',
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

  private async resolveCoordinates(
    stationId: string,
  ): Promise<{ latitude: number; longitude: number }> {
    const station = await this.stationPort.findPublicById(stationId);
    if (!station) {
      throw new ProviderConfigurationError('OpenMeteo', `stesen ${stationId} tidak dijumpai`);
    }
    return { latitude: station.latitude, longitude: station.longitude };
  }

  private fromCurrentWeather(response: OpenMeteoWeatherResponse, date: string): WeatherDataPoint {
    const cw = response.current_weather;
    return {
      date,
      temperature: cw?.temperature ?? 0,
      conditions: this.mapWmoInline(cw?.weathercode),
      visibility: null,
      precipitation: null,
    };
  }

  private mapWmoInline(code: number | undefined): string {
    if (code == null) return 'UNKNOWN';
    const map: Record<number, string> = {
      0: 'CLEAR',
      1: 'CLEAR',
      2: 'CLOUDY',
      3: 'CLOUDY',
      45: 'CLOUDY',
      48: 'CLOUDY',
      51: 'RAIN',
      53: 'RAIN',
      55: 'RAIN',
      61: 'RAIN',
      63: 'RAIN',
      65: 'HEAVY_RAIN',
      80: 'RAIN',
      81: 'RAIN',
      82: 'HEAVY_RAIN',
      95: 'THUNDERSTORM',
      96: 'THUNDERSTORM',
      99: 'THUNDERSTORM',
    };
    return map[code] ?? 'UNKNOWN';
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
        throw new ProviderServerError('OpenMeteo', 429);
      }
      throw new ProviderServerError('OpenMeteo', response.status);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new ProviderTimeoutError('OpenMeteo', 10_000);
      }
      if (
        error instanceof Error &&
        (error.message.includes('fetch') || error.message.includes('network'))
      ) {
        throw new ProviderUnavailableError('OpenMeteo', error);
      }
      if (error instanceof Error && error.message.includes('JSON')) {
        throw new ProviderInvalidResponseError('OpenMeteo', 'malformed JSON response');
      }
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }
}
