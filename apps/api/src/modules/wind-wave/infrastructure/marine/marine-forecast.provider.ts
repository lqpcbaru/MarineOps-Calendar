import { Injectable, Inject } from '@nestjs/common';
import type { WindWaveProviderPort, WindWaveDataPoint } from '../../domain';
import type { MarineRawForecastResponse } from './marine-raw-dto';
import { mapForecastItems } from './marine-windwave-mapper';
import {
  ProviderHttpClient, RetryPolicy, ProviderLogger, ProviderMetrics, ProviderHealth,
  createProviderConfig, ProviderInvalidResponseError,
} from '../../../../shared/provider';
import { PROVIDER_MAPPING_PORT } from '../../../stations/api/stations.module';
import type { StationProviderMappingPort } from '../../../stations/application/ports';

@Injectable()
export class MarineForecastProvider implements WindWaveProviderPort {
  private readonly httpClient: ProviderHttpClient;
  private readonly retry: RetryPolicy;
  private readonly logger: ProviderLogger;
  private readonly metrics: ProviderMetrics;
  private readonly health: ProviderHealth;

  constructor(
    @Inject(PROVIDER_MAPPING_PORT) private readonly mappingPort: StationProviderMappingPort,
  ) {
    const config = createProviderConfig({
      providerName: 'MarineForecast',
      baseUrl: 'https://api.met.gov.my',
      apiKeyEnvVar: 'METMALAYSIA_API_KEY',
      timeoutMs: 10_000, maxRetries: 3, retryDelayMs: 1_000,
    });
    this.httpClient = new ProviderHttpClient(config);
    this.retry = new RetryPolicy({ maxRetries: config.maxRetries, baseDelayMs: config.retryDelayMs });
    this.logger = new ProviderLogger('MarineForecast');
    this.metrics = new ProviderMetrics();
    this.health = new ProviderHealth(this.metrics);
  }

  async getWindWave(stationId: string, dateFrom: string, dateTo: string): Promise<WindWaveDataPoint[]> {
    const start = Date.now();
    this.logger.requestStart('getWindWave', { stationId, dateFrom, dateTo });

    try {
      const area = await this.resolveArea(stationId, 'wind');
      const data = await this.retry.execute(async () => {
        const response = await this.httpClient.get<MarineRawForecastResponse>(
          '/v2/marine',
          { kawasan: area, tarikhMula: dateFrom, tarikhTamat: dateTo },
        );
        if (!response.data || !Array.isArray(response.data)) {
          throw new ProviderInvalidResponseError('MarineForecast', 'missing data array');
        }
        return response;
      }, 'MarineForecast', this.logger, this.metrics);

      const points = mapForecastItems(data.data);
      this.metrics.recordSuccess(Date.now() - start);
      this.logger.requestSuccess('getWindWave', Date.now() - start, points.length);
      return points;
    } catch (error) {
      this.metrics.recordFailure(error instanceof Error ? error.message : 'unknown');
      this.logger.requestFailed('getWindWave', error instanceof Error ? error.message : 'unknown', 1);
      throw this.classifyError(error);
    }
  }

  getMetrics() { return this.metrics; }
  getHealth() { return this.health; }

  private async resolveArea(stationId: string, dataType: string): Promise<string> {
    const mapping = await this.mappingPort.getByStationAndType(stationId, dataType);
    if (!mapping || !mapping.isActive) {
      throw new ProviderInvalidResponseError('MarineForecast', `tiada pemetaan untuk stesen ${stationId}`);
    }
    return (mapping.config as Record<string, unknown> | null)?.marineArea as string
      || mapping.providerStationId || stationId;
  }

  private classifyError(error: unknown): Error {
    if (error instanceof Error) return error;
    return new Error(String(error));
  }
}
