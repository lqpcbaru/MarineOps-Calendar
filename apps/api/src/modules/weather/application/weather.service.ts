import { Inject, Injectable } from '@nestjs/common';
import type { WeatherResponse, Freshness, WeatherDataPoint } from '../domain';
import type { WeatherProviderPort } from '../domain';
import { validateDateString } from '../../../shared-kernel/date-validation';
import { CacheService } from '../../../shared/cache/cache.service';
import { buildCacheKey } from '../../../shared/cache/cache-policy';
import { STATIONS_QUERY_PORT } from '../../stations/api/stations.module';
import type { StationsQueryPort } from '../../stations/application/ports/stations-query.port';

export const WEATHER_PROVIDER = 'WEATHER_PROVIDER';

export interface RefreshResult {
  stationId: string;
  provider: string;
  startedAt: string;
  completedAt: string;
  durationMs: number;
  status: 'SUCCESS' | 'FAILURE';
  recordsUpdated: number;
  cacheUpdated: boolean;
  error?: string;
}

@Injectable()
export class WeatherService {
  constructor(
    @Inject(WEATHER_PROVIDER) private readonly provider: WeatherProviderPort,
    @Inject('CACHE_SERVICE') private readonly cache: CacheService<WeatherDataPoint[]>,
    @Inject(STATIONS_QUERY_PORT) private readonly stationPort: StationsQueryPort,
  ) {}

  async getWeather(
    stationId: string,
    dateFrom?: string,
    dateTo?: string,
  ): Promise<WeatherResponse> {
    const now = new Date();
    const from = validateDateString(dateFrom, 'dateFrom');
    const to = validateDateString(dateTo || from, 'dateTo');
    const cacheKey = buildCacheKey('metmalaysia', 'weather', stationId, from);

    const result = await this.cache.getOrFetch(
      cacheKey,
      async () => this.provider.getForecast(stationId, from, to),
      'metmalaysia',
      stationId,
    );

    const freshness: Freshness = {
      status: result.status === 'FRESH' ? 'fresh' : 'stale',
      fetchedAt: now.toISOString(),
      validUntil: new Date(now.getTime() + 10_800_000).toISOString(),
      source: result.source === 'cache' ? 'cache' : 'metmalaysia',
    };

    return { data: result.data, freshness };
  }

  async refreshStation(stationId: string): Promise<RefreshResult> {
    const startedAt = new Date();
    const start = Date.now();

    try {
      const today = new Date().toISOString().slice(0, 10);
      const data = await this.provider.getForecast(stationId, today, today);
      const cacheKey = buildCacheKey('metmalaysia', 'weather', stationId, today);
      await this.cache.set(cacheKey, data, 'metmalaysia', stationId);

      return {
        stationId,
        provider: 'metmalaysia',
        startedAt: startedAt.toISOString(),
        completedAt: new Date().toISOString(),
        durationMs: Date.now() - start,
        status: 'SUCCESS',
        recordsUpdated: data.length,
        cacheUpdated: true,
      };
    } catch (error) {
      return {
        stationId,
        provider: 'metmalaysia',
        startedAt: startedAt.toISOString(),
        completedAt: new Date().toISOString(),
        durationMs: Date.now() - start,
        status: 'FAILURE',
        recordsUpdated: 0,
        cacheUpdated: false,
        error: error instanceof Error ? error.message : 'unknown',
      };
    }
  }

  async refreshAllStations(): Promise<RefreshResult[]> {
    const stations = await this.stationPort.listPublic({ page: 1, pageSize: 1000 });
    const results: RefreshResult[] = [];

    for (const station of stations.stations) {
      if (station.status === 'ARCHIVED') continue;
      const result = await this.refreshStation(station.id);
      results.push(result);
    }

    return results;
  }
}
