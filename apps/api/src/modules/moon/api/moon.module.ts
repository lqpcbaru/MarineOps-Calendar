import { Module } from '@nestjs/common';
import { MoonService, MOON_PROVIDER } from '../application/moon.service';
import { PlaceholderMoonProvider } from '../infrastructure/placeholder-moon.provider';
import { AstronomicalMoonProvider } from '../infrastructure/astronomical/astronomical-moon.provider';
import { StationsModule } from '../../stations/api/stations.module';
import { CacheService } from '../../../shared/cache/cache.service';
import { InMemoryCacheStore } from '../../../shared/cache/in-memory-cache.store';
import { createCachePolicy } from '../../../shared/cache/cache-policy';

@Module({
  imports: [StationsModule],
  providers: [
    MoonService,
    { provide: MOON_PROVIDER, useClass: AstronomicalMoonProvider },
    PlaceholderMoonProvider,
    {
      provide: 'CACHE_SERVICE',
      useFactory: () => new CacheService(
        new InMemoryCacheStore(),
        createCachePolicy({ ttlMs: 24 * 60 * 60 * 1000, staleTtlMs: 7 * 24 * 60 * 60 * 1000 }),
      ),
    },
  ],
  exports: [MoonService, MOON_PROVIDER],
})
export class MoonModule {}
