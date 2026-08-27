import { Inject, Injectable } from '@nestjs/common';
import type { TideResponse, Freshness, TideDataPoint } from '../domain';
import type { TideProviderPort } from '../domain';
import { validateDateString, localToday } from '../../../shared-kernel/date-validation';
import { CacheService } from '../../../shared/cache/cache.service';
import { buildCacheKey } from '../../../shared/cache/cache-policy';
import { STATIONS_QUERY_PORT } from '../../stations/api/stations.module';
import type { StationsQueryPort } from '../../stations/application/ports/stations-query.port';

export const TIDE_PROVIDER = 'TIDE_PROVIDER';

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
export class TideService {
  constructor(
    @Inject(TIDE_PROVIDER) private readonly provider: TideProviderPort,
    @Inject('CACHE_SERVICE') private readonly cache: CacheService<TideDataPoint[]>,
    @Inject(STATIONS_QUERY_PORT) private readonly stationPort: StationsQueryPort,
  ) {}

  async getTide(stationId: string, dateFrom?: string, dateTo?: string): Promise<TideResponse> {
    const now = new Date();
    const from = validateDateString(dateFrom, 'dateFrom');
    const to = validateDateString(dateTo || from, 'dateTo');
    const cacheKey = buildCacheKey('jupem', 'tide', stationId, `${from}_${to}`);

    const result = await this.cache.getOrFetch(
      cacheKey,
      async () => this.provider.getTide(stationId, from, to),
      'jupem',
      stationId,
    );

    const freshness: Freshness = {
      status: result.status === 'FRESH' ? 'fresh' : 'stale',
      fetchedAt: now.toISOString(),
      validUntil: new Date(now.getTime() + 3_600_000).toISOString(),
      source: result.source === 'cache' ? 'cache' : 'jupem',
    };

    return { data: result.data, freshness };
  }

  async refreshStation(stationId: string): Promise<RefreshResult> {
    const startedAt = new Date();
    const start = Date.now();

    try {
      const today = localToday();
      const data = await this.provider.getTide(stationId, today, today);
      const cacheKey = buildCacheKey('jupem', 'tide', stationId, today);
      await this.cache.set(cacheKey, data, 'jupem', stationId);

      return {
        stationId,
        provider: 'jupem',
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
        provider: 'jupem',
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
      results.push(await this.refreshStation(station.id));
    }
    return results;
  }
}
