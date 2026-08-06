import { Module } from '@nestjs/common';
import { WeatherService, WEATHER_PROVIDER } from '../application/weather.service';
import { PlaceholderWeatherProvider } from '../infrastructure/placeholder-weather.provider';
import { MetMalaysiaWeatherProvider } from '../infrastructure/met-malaysia/met-malaysia-weather.provider';
import { StationsModule } from '../../stations/api/stations.module';

@Module({
  imports: [StationsModule],
  providers: [
    WeatherService,
    { provide: WEATHER_PROVIDER, useClass: MetMalaysiaWeatherProvider },
    PlaceholderWeatherProvider,
  ],
  exports: [WeatherService, WEATHER_PROVIDER],
})
export class WeatherModule {}
