import { Module } from '@nestjs/common';
import { TideService, TIDE_PROVIDER } from '../application/tide.service';
import { JupemTideProvider } from '../infrastructure/jupem/jupem-tide.provider';
import { StationsModule } from '../../stations/api/stations.module';
import { CacheService } from '../../../shared/cache/cache.service';
import { InMemoryCacheStore } from '../../../shared/cache/in-memory-cache.store';
import { createCachePolicy } from '../../../shared/cache/cache-policy';

@Module({
  imports: [StationsModule],
  providers: [
    TideService,
    { provide: TIDE_PROVIDER, useClass: JupemTideProvider },
    {
      provide: 'CACHE_SERVICE',
      useFactory: () =>
        new CacheService(
          new InMemoryCacheStore(),
          createCachePolicy({ ttlMs: 60 * 60 * 1000, staleTtlMs: 240 * 60 * 1000 }),
        ),
    },
  ],
  exports: [TideService, TIDE_PROVIDER],
})
export class TideModule {}
