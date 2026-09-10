import { Module } from '@nestjs/common';
import { OperationalCalendarService } from '../application/operational-calendar.service';
import { WeatherModule } from '../../weather/api/weather.module';
import { TideModule } from '../../tide/api/tide.module';
import { WindWaveModule } from '../../wind-wave/api/wind-wave.module';
import { MoonModule } from '../../moon/api/moon.module';
import { SunModule } from '../../sun/api/sun.module';
import { StationsModule } from '../../stations/api/stations.module';
import { CacheService } from '../../../shared/cache/cache.service';
import { createCacheStore } from '../../../shared/cache/create-cache-store';
import { createCachePolicy } from '../../../shared/cache/cache-policy';

@Module({
  imports: [WeatherModule, TideModule, WindWaveModule, MoonModule, SunModule, StationsModule],
  providers: [
    OperationalCalendarService,
    {
      provide: 'CACHE_SERVICE',
      useFactory: () =>
        new CacheService(
          createCacheStore(),
          createCachePolicy({ ttlMs: 24 * 60 * 60 * 1000, staleTtlMs: 48 * 60 * 60 * 1000 }),
        ),
    },
  ],
  exports: [OperationalCalendarService],
})
export class OperationalCalendarModule {}
