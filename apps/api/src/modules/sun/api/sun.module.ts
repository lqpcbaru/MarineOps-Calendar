import { Module } from '@nestjs/common';
import { SunService, SUN_PROVIDER } from '../application/sun.service';
import { PlaceholderSunProvider } from '../infrastructure/placeholder-sun.provider';
import { AstronomicalSunProvider } from '../infrastructure/astronomical/astronomical-sun.provider';
import { StationsModule } from '../../stations/api/stations.module';
import { CacheService } from '../../../shared/cache/cache.service';
import { InMemoryCacheStore } from '../../../shared/cache/in-memory-cache.store';
import { createCachePolicy } from '../../../shared/cache/cache-policy';

@Module({
  imports: [StationsModule],
  providers: [
    SunService,
    { provide: SUN_PROVIDER, useClass: AstronomicalSunProvider },
    PlaceholderSunProvider,
    {
      provide: 'CACHE_SERVICE',
      useFactory: () => new CacheService(
        new InMemoryCacheStore(),
        createCachePolicy({ ttlMs: 24 * 60 * 60 * 1000, staleTtlMs: 7 * 24 * 60 * 60 * 1000 }),
      ),
    },
  ],
  exports: [SunService, SUN_PROVIDER],
})
export class SunModule {}
