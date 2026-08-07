import { Module } from '@nestjs/common';
import { WeatherService, WEATHER_PROVIDER } from '../application/weather.service';
import { PlaceholderWeatherProvider } from '../infrastructure/placeholder-weather.provider';
import { MetMalaysiaWeatherProvider } from '../infrastructure/met-malaysia/met-malaysia-weather.provider';
import { StationsModule } from '../../stations/api/stations.module';
import { CacheService } from '../../../shared/cache/cache.service';
import { InMemoryCacheStore } from '../../../shared/cache/in-memory-cache.store';
import { createCachePolicy } from '../../../shared/cache/cache-policy';

@Module({
  imports: [StationsModule],
  providers: [
    WeatherService,
    { provide: WEATHER_PROVIDER, useClass: MetMalaysiaWeatherProvider },
    PlaceholderWeatherProvider,
    {
      provide: 'CACHE_SERVICE',
      useFactory: () => new CacheService(
        new InMemoryCacheStore(),
        createCachePolicy({ ttlMs: 30 * 60 * 1000, staleTtlMs: 120 * 60 * 1000 }),
      ),
    },
  ],
  exports: [WeatherService, WEATHER_PROVIDER],
})
export class WeatherModule {}
