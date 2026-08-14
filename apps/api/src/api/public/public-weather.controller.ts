import { Controller, Get, Query } from '@nestjs/common';
import { WeatherService } from '../../modules/weather/application/weather.service';
import type { WeatherResponse } from '../../modules/weather/domain';
import { Public } from '../../modules/authentication/api/public.decorator';

@Controller('public/weather')
@Public()
export class PublicWeatherController {
  constructor(private readonly weatherService: WeatherService) {}

  @Get()
  async getWeather(
    @Query('stationId') stationId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ): Promise<WeatherResponse> {
    return this.weatherService.getWeather(stationId || '—', dateFrom, dateTo);
  }
}
