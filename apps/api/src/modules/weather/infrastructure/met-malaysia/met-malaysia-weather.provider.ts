import { Injectable, Inject } from '@nestjs/common';
import type { WeatherProviderPort, WeatherDataPoint } from '../../domain';
import type { MetRawForecastResponse } from './met-raw-dto';
import { mapForecastItems } from './met-weather-mapper';
import {
  ProviderHttpClient,
  RetryPolicy,
  ProviderLogger,
  ProviderMetrics,
  ProviderHealth,
  createProviderConfig,
  ProviderInvalidResponseError,
} from '../../../../shared/provider';
import { PROVIDER_MAPPING_PORT } from '../../../stations/api/stations.module';
import type { StationProviderMappingPort } from '../../../stations/application/ports';

@Injectable()
export class MetMalaysiaWeatherProvider implements WeatherProviderPort {
  private readonly httpClient: ProviderHttpClient;
  private readonly retry: RetryPolicy;
  private readonly logger: ProviderLogger;
  private readonly metrics: ProviderMetrics;
  private readonly health: ProviderHealth;

  constructor(
    @Inject(PROVIDER_MAPPING_PORT) private readonly mappingPort: StationProviderMappingPort,
  ) {
    const config = createProviderConfig({
      providerName: 'MetMalaysia',
      baseUrl: 'https://api.met.gov.my',
      apiKeyEnvVar: 'METMALAYSIA_API_KEY',
      timeoutMs: 10_000,
      maxRetries: 3,
      retryDelayMs: 1_000,
    });

    this.httpClient = new ProviderHttpClient(config);
    this.retry = new RetryPolicy({
      maxRetries: config.maxRetries,
      baseDelayMs: config.retryDelayMs,
    });
    this.logger = new ProviderLogger('MetMalaysia');
    this.metrics = new ProviderMetrics();
    this.health = new ProviderHealth(this.metrics);
  }

  async getCurrentWeather(stationId: string): Promise<WeatherDataPoint> {
    const start = Date.now();
    this.logger.requestStart('getCurrentWeather', { stationId });

    try {
      const area = await this.resolveArea(stationId, 'weather');
      const data = await this.retry.execute(
        async () => {
          const response = await this.httpClient.get<MetRawForecastResponse>('/v2/forecast', {
            area,
            type: 'current',
          });
          if (!response.data || !Array.isArray(response.data)) {
            throw new ProviderInvalidResponseError('MetMalaysia', 'missing data array');
          }
          return response;
        },
        'MetMalaysia',
        this.logger,
        this.metrics,
      );

      const points = mapForecastItems(data.data);
      const result = points[0] || this.emptyPoint();

      this.metrics.recordSuccess(Date.now() - start);
      this.logger.requestSuccess('getCurrentWeather', Date.now() - start, 1);
      return result;
    } catch (error) {
      this.metrics.recordFailure(error instanceof Error ? error.message : 'unknown');
      this.logger.requestFailed(
        'getCurrentWeather',
        error instanceof Error ? error.message : 'unknown',
        1,
      );
      throw this.classifyError(error);
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
      const area = await this.resolveArea(stationId, 'weather');
      const data = await this.retry.execute(
        async () => {
          const response = await this.httpClient.get<MetRawForecastResponse>('/v2/forecast', {
            area,
            dateFrom,
            dateTo,
          });
          if (!response.data || !Array.isArray(response.data)) {
            throw new ProviderInvalidResponseError('MetMalaysia', 'missing data array');
          }
          return response;
        },
        'MetMalaysia',
        this.logger,
        this.metrics,
      );

      const points = mapForecastItems(data.data);

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
      throw this.classifyError(error);
    }
  }

  getMetrics() {
    return this.metrics;
  }
  getHealth() {
    return this.health;
  }

  private async resolveArea(stationId: string, dataType: string): Promise<string> {
    const mapping = await this.mappingPort.getByStationAndType(stationId, dataType);
    if (!mapping || !mapping.isActive) {
      throw new ProviderInvalidResponseError(
        'MetMalaysia',
        `tiada pemetaan untuk stesen ${stationId}`,
      );
    }
    const area =
      ((mapping.config as Record<string, unknown> | null)?.marineArea as string) ||
      mapping.providerStationId ||
      stationId;
    return area;
  }

  private classifyError(error: unknown): Error {
    if (error instanceof Error) return error;
    return new Error(String(error));
  }

  private emptyPoint(): WeatherDataPoint {
    return {
      date: new Date().toISOString().slice(0, 10),
      temperature: 0,
      conditions: 'UNKNOWN',
      visibility: null,
      precipitation: null,
    };
  }
}
