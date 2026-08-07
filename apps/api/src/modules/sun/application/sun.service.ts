import { Inject, Injectable } from '@nestjs/common';
import type { SunResponse, SunDataPoint } from '../domain';
import type { SunProviderPort } from '../domain';
import { validateDateString } from '../../../shared-kernel/date-validation';
import { CacheService } from '../../../shared/cache/cache.service';
import { buildCacheKey } from '../../../shared/cache/cache-policy';
import { STATIONS_QUERY_PORT } from '../../stations/api/stations.module';
import type { StationsQueryPort } from '../../stations/application/ports/stations-query.port';

export const SUN_PROVIDER = 'SUN_PROVIDER';

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
export class SunService {
  constructor(
    @Inject(SUN_PROVIDER) private readonly provider: SunProviderPort,
    @Inject('CACHE_SERVICE') private readonly cache: CacheService<SunDataPoint>,
    @Inject(STATIONS_QUERY_PORT) private readonly stationPort: StationsQueryPort,
  ) {}

  async getSunData(stationId: string, date?: string): Promise<SunResponse> {
    const targetDate = validateDateString(date, 'date');
    const cacheKey = buildCacheKey('astronomical', 'sun', stationId, targetDate);

    const result = await this.cache.getOrFetch(
      cacheKey,
      async () => this.provider.getSunData(stationId, targetDate),
      'astronomical',
      stationId,
    );

    return { data: result.data };
  }

  async refreshStation(stationId: string): Promise<RefreshResult> {
    const startedAt = new Date();
    const start = Date.now();
    try {
      const today = new Date().toISOString().slice(0, 10);
      const data = await this.provider.getSunData(stationId, today);
      const cacheKey = buildCacheKey('astronomical', 'sun', stationId, today);
      await this.cache.set(cacheKey, data, 'astronomical', stationId);
      return {
        stationId, provider: 'astronomical',
        startedAt: startedAt.toISOString(), completedAt: new Date().toISOString(),
        durationMs: Date.now() - start, status: 'SUCCESS',
        recordsUpdated: 1, cacheUpdated: true,
      };
    } catch (error) {
      return {
        stationId, provider: 'astronomical',
        startedAt: startedAt.toISOString(), completedAt: new Date().toISOString(),
        durationMs: Date.now() - start, status: 'FAILURE',
        recordsUpdated: 0, cacheUpdated: false,
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
