import { Injectable, Inject } from '@nestjs/common';
import type { TideProviderPort, TideDataPoint } from '../../domain';
import type { JupemRawTideResponse } from './jupem-raw-dto';
import { mapTideResponse } from './jupem-tide-mapper';
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
export class JupemTideProvider implements TideProviderPort {
  private readonly httpClient: ProviderHttpClient;
  private readonly retry: RetryPolicy;
  private readonly logger: ProviderLogger;
  private readonly metrics: ProviderMetrics;
  private readonly health: ProviderHealth;

  constructor(
    @Inject(PROVIDER_MAPPING_PORT) private readonly mappingPort: StationProviderMappingPort,
  ) {
    const config = createProviderConfig({
      providerName: 'JUPEM',
      baseUrl: 'https://api.jupem.gov.my',
      apiKeyEnvVar: 'JUPEM_API_KEY',
      timeoutMs: 10_000,
      maxRetries: 3,
      retryDelayMs: 1_000,
    });

    this.httpClient = new ProviderHttpClient(config);
    this.retry = new RetryPolicy({
      maxRetries: config.maxRetries,
      baseDelayMs: config.retryDelayMs,
    });
    this.logger = new ProviderLogger('JUPEM');
    this.metrics = new ProviderMetrics();
    this.health = new ProviderHealth(this.metrics);
  }

  async getTide(stationId: string, dateFrom: string, dateTo: string): Promise<TideDataPoint[]> {
    const start = Date.now();
    this.logger.requestStart('getTide', { stationId, dateFrom, dateTo });

    try {
      const area = await this.resolveArea(stationId, 'tide');
      const data = await this.retry.execute(
        async () => {
          const response = await this.httpClient.get<JupemRawTideResponse>('/v1/tide', {
            stesen: area,
            tarikhMula: dateFrom,
            tarikhTamat: dateTo,
          });
          if (!response.data || !Array.isArray(response.data)) {
            throw new ProviderInvalidResponseError('JUPEM', 'missing data array');
          }
          return response;
        },
        'JUPEM',
        this.logger,
        this.metrics,
      );

      const points = mapTideResponse(data.data);

      this.metrics.recordSuccess(Date.now() - start);
      this.logger.requestSuccess('getTide', Date.now() - start, points.length);
      return points;
    } catch (error) {
      this.metrics.recordFailure(error instanceof Error ? error.message : 'unknown');
      this.logger.requestFailed('getTide', error instanceof Error ? error.message : 'unknown', 1);
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
      throw new ProviderInvalidResponseError('JUPEM', `tiada pemetaan untuk stesen ${stationId}`);
    }
    // stationId is our internal UUID — it can never coincidentally be a real
    // JUPEM station code, so a mapping with no real code configured is
    // exactly as unusable as no mapping at all. Never fall back to it.
    const area =
      ((mapping.config as Record<string, unknown> | null)?.stationCode as string) ||
      mapping.providerStationId;
    if (!area) {
      throw new ProviderInvalidResponseError(
        'JUPEM',
        `pemetaan untuk stesen ${stationId} tidak mempunyai kod stesen`,
      );
    }
    return area;
  }

  private classifyError(error: unknown): Error {
    if (error instanceof Error) return error;
    return new Error(String(error));
  }
}
