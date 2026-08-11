import { Injectable } from '@nestjs/common';
import type { AISProviderPort, AisVesselSummary, AisVesselProfile, AisVesselEvent } from '../../domain';
import type { GfwVesselSearchResponse, GfwVesselProfileResponse, GfwVesselEventsResponse } from './gfw-raw-dto';
import { mapVesselSummaries, mapVesselProfile, mapVesselEvents } from './gfw-mapper';
import {
  ProviderHttpClient, RetryPolicy, ProviderLogger, ProviderMetrics, ProviderHealth,
  createProviderConfig, ProviderInvalidResponseError,
} from '../../../../shared/provider';

@Injectable()
export class GfwAisProvider implements AISProviderPort {
  private readonly httpClient: ProviderHttpClient;
  private readonly retry: RetryPolicy;
  private readonly logger: ProviderLogger;
  private readonly metrics: ProviderMetrics;
  private readonly health: ProviderHealth;

  constructor() {
    const config = createProviderConfig({
      providerName: 'GlobalFishingWatch',
      baseUrl: process.env['GFW_API_BASE_URL'] || 'https://gateway.api.globalfishingwatch.org',
      apiKeyEnvVar: 'GFW_API_TOKEN',
      timeoutMs: 15_000,
      maxRetries: 3,
      retryDelayMs: 1_000,
    });
    this.httpClient = new ProviderHttpClient(config);
    this.retry = new RetryPolicy({ maxRetries: config.maxRetries, baseDelayMs: config.retryDelayMs });
    this.logger = new ProviderLogger('GFW');
    this.metrics = new ProviderMetrics();
    this.health = new ProviderHealth(this.metrics);
  }

  async searchVessels(query: string, page = 1, pageSize = 20): Promise<{ vessels: AisVesselSummary[]; total: number }> {
    const start = Date.now();
    this.logger.requestStart('searchVessels', { query, page: String(page) });

    try {
      const offset = (page - 1) * pageSize;
      const data = await this.retry.execute(async () => {
        const response = await this.httpClient.get<GfwVesselSearchResponse>(
          '/v3/vessels/search',
          { query, limit: String(pageSize), offset: String(offset) },
        );
        if (!response.entries || !Array.isArray(response.entries)) {
          throw new ProviderInvalidResponseError('GFW', 'missing entries array');
        }
        return response;
      }, 'GFW', this.logger, this.metrics);

      const vessels = mapVesselSummaries(data.entries);
      this.metrics.recordSuccess(Date.now() - start);
      this.logger.requestSuccess('searchVessels', Date.now() - start, vessels.length);
      return { vessels, total: data.total };
    } catch (error) {
      this.metrics.recordFailure(error instanceof Error ? error.message : 'unknown');
      this.logger.requestFailed('searchVessels', error instanceof Error ? error.message : 'unknown', 1);
      throw error;
    }
  }

  async getVesselProfile(vesselId: string): Promise<AisVesselProfile> {
    const start = Date.now();
    this.logger.requestStart('getVesselProfile', { vesselId });

    try {
      const data = await this.retry.execute(async () => {
        const response = await this.httpClient.get<GfwVesselProfileResponse>(
          `/v3/vessels/${vesselId}`,
        );
        if (!response.id) throw new ProviderInvalidResponseError('GFW', 'missing vessel id');
        return response;
      }, 'GFW', this.logger, this.metrics);

      const profile = mapVesselProfile(data);
      this.metrics.recordSuccess(Date.now() - start);
      this.logger.requestSuccess('getVesselProfile', Date.now() - start, 1);
      return profile;
    } catch (error) {
      this.metrics.recordFailure(error instanceof Error ? error.message : 'unknown');
      this.logger.requestFailed('getVesselProfile', error instanceof Error ? error.message : 'unknown', 1);
      throw error;
    }
  }

  async getVesselEvents(vesselId: string, dateFrom?: string, dateTo?: string): Promise<AisVesselEvent[]> {
    const start = Date.now();
    this.logger.requestStart('getVesselEvents', { vesselId, dateFrom: dateFrom || '', dateTo: dateTo || '' });

    try {
      const query: Record<string, string> = { vessels: vesselId, limit: '50' };
      if (dateFrom) query['start-date'] = dateFrom;
      if (dateTo) query['end-date'] = dateTo;

      const data = await this.retry.execute(async () => {
        const response = await this.httpClient.get<GfwVesselEventsResponse>(
          '/v3/events',
          query,
        );
        if (!response.entries || !Array.isArray(response.entries)) {
          throw new ProviderInvalidResponseError('GFW', 'missing entries array');
        }
        return response;
      }, 'GFW', this.logger, this.metrics);

      const events = mapVesselEvents(data.entries);
      this.metrics.recordSuccess(Date.now() - start);
      this.logger.requestSuccess('getVesselEvents', Date.now() - start, events.length);
      return events;
    } catch (error) {
      this.metrics.recordFailure(error instanceof Error ? error.message : 'unknown');
      this.logger.requestFailed('getVesselEvents', error instanceof Error ? error.message : 'unknown', 1);
      throw error;
    }
  }

  getMetrics() { return this.metrics; }
  getHealth() { return this.health; }
}
