import { Module } from '@nestjs/common';
import { WeatherService, WEATHER_PROVIDER } from '../application/weather.service';
import { OpenMeteoWeatherProvider } from '../infrastructure/open-meteo/open-meteo-weather.provider';
import { StationsModule } from '../../stations/api/stations.module';
import { CacheService } from '../../../shared/cache/cache.service';
import { createCacheStore } from '../../../shared/cache/create-cache-store';
import { createCachePolicy } from '../../../shared/cache/cache-policy';

@Module({
  imports: [StationsModule],
  providers: [
    WeatherService,
    { provide: WEATHER_PROVIDER, useClass: OpenMeteoWeatherProvider },
    {
      provide: 'CACHE_SERVICE',
      useFactory: () =>
        new CacheService(
          createCacheStore(),
          createCachePolicy({ ttlMs: 30 * 60 * 1000, staleTtlMs: 120 * 60 * 1000 }),
        ),
    },
  ],
  exports: [WeatherService, WEATHER_PROVIDER],
})
export class WeatherModule {}
