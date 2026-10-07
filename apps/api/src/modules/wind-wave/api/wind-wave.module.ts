import { Module } from '@nestjs/common';
import { WindWaveService, WIND_WAVE_PROVIDER } from '../application/wind-wave.service';
import { OpenMeteoMarineProvider } from '../infrastructure/open-meteo/open-meteo-marine.provider';
import { StationsModule } from '../../stations/api/stations.module';
import { CacheService } from '../../../shared/cache/cache.service';
import { createCacheStore } from '../../../shared/cache/create-cache-store';
import { createCachePolicy } from '../../../shared/cache/cache-policy';

@Module({
  imports: [StationsModule],
  providers: [
    WindWaveService,
    { provide: WIND_WAVE_PROVIDER, useClass: OpenMeteoMarineProvider },
    {
      provide: 'CACHE_SERVICE',
      useFactory: () =>
        new CacheService(
          createCacheStore(),
          createCachePolicy({ ttlMs: 60 * 60 * 1000, staleTtlMs: 240 * 60 * 1000 }),
        ),
    },
  ],
  exports: [WindWaveService, WIND_WAVE_PROVIDER],
})
export class WindWaveModule {}
