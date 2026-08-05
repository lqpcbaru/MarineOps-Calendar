import { Module } from '@nestjs/common';
import { WeatherService, WEATHER_PROVIDER } from '../application/weather.service';
import { PlaceholderWeatherProvider } from '../infrastructure/placeholder-weather.provider';

@Module({
  providers: [
    WeatherService,
    { provide: WEATHER_PROVIDER, useClass: PlaceholderWeatherProvider },
  ],
  exports: [WeatherService, WEATHER_PROVIDER],
})
export class WeatherModule {}
