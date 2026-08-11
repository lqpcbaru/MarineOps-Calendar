import { Module } from '@nestjs/common';
import { AisService, AIS_PROVIDER } from '../application/ais.service';
import { GfwAisProvider } from '../infrastructure/global-fishing-watch/gfw.provider';
import { CacheService } from '../../../shared/cache/cache.service';
import { InMemoryCacheStore } from '../../../shared/cache/in-memory-cache.store';
import { createCachePolicy } from '../../../shared/cache/cache-policy';

@Module({
  providers: [
    AisService,
    { provide: AIS_PROVIDER, useClass: GfwAisProvider },
    {
      provide: 'CACHE_SERVICE',
      useFactory: () => new CacheService(
        new InMemoryCacheStore(),
        createCachePolicy({ ttlMs: 30 * 60 * 1000, staleTtlMs: 120 * 60 * 1000 }),
      ),
    },
  ],
  exports: [AisService, AIS_PROVIDER],
})
export class AisModule {}
