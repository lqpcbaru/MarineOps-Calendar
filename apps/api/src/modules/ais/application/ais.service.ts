import { Inject, Injectable } from '@nestjs/common';
import type { AisSearchResult, AisProfileResult, AisEventsResult, AisVesselSummary, AisVesselProfile, AisVesselEvent } from '../domain';
import type { AISProviderPort } from '../domain';
import { CacheService } from '../../../shared/cache/cache.service';
import { buildCacheKey } from '../../../shared/cache/cache-policy';

export const AIS_PROVIDER = 'AIS_PROVIDER';

@Injectable()
export class AisService {
  constructor(
    @Inject(AIS_PROVIDER) private readonly provider: AISProviderPort,
    @Inject('CACHE_SERVICE') private readonly cache: CacheService<AisVesselSummary[] | AisVesselProfile | AisVesselEvent[]>,
  ) {}

  async searchVessels(query: string, page = 1, pageSize = 20): Promise<AisSearchResult> {
    const now = new Date();
    const cacheKey = buildCacheKey('gfw', 'vessels-search', query, `${page}-${pageSize}`);

    const result = await this.cache.getOrFetch(
      cacheKey,
      async () => {
        const { vessels } = await this.provider.searchVessels(query, page, pageSize);
        return vessels;
      },
      'gfw',
      query,
    );

    return {
      vessels: result.data as AisVesselSummary[],
      total: (result.data as AisVesselSummary[]).length,
      page,
      pageSize,
      freshness: {
        status: result.status === 'FRESH' ? 'fresh' : 'stale',
        fetchedAt: now.toISOString(),
        source: result.source === 'cache' ? 'cache' : 'gfw',
      },
    };
  }

  async getVesselProfile(vesselId: string): Promise<AisProfileResult> {
    const now = new Date();
    const cacheKey = buildCacheKey('gfw', 'vessel-profile', vesselId, '');

    const result = await this.cache.getOrFetch(
      cacheKey,
      async () => this.provider.getVesselProfile(vesselId),
      'gfw',
      vesselId,
    );

    return {
      profile: result.data as AisVesselProfile,
      freshness: {
        status: result.status === 'FRESH' ? 'fresh' : 'stale',
        fetchedAt: now.toISOString(),
        source: result.source === 'cache' ? 'cache' : 'gfw',
      },
    };
  }

  async getVesselEvents(vesselId: string, dateFrom?: string, dateTo?: string): Promise<AisEventsResult> {
    const now = new Date();
    const cacheKey = buildCacheKey('gfw', 'vessel-events', vesselId, dateFrom || '');

    const result = await this.cache.getOrFetch(
      cacheKey,
      async () => this.provider.getVesselEvents(vesselId, dateFrom, dateTo),
      'gfw',
      vesselId,
    );

    return {
      vesselId,
      events: result.data as AisVesselEvent[],
      freshness: {
        status: result.status === 'FRESH' ? 'fresh' : 'stale',
        fetchedAt: now.toISOString(),
        source: result.source === 'cache' ? 'cache' : 'gfw',
      },
    };
  }
}
