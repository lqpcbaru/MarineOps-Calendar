import { Module } from '@nestjs/common';
import { DashboardService } from '../application/dashboard.service';
import { WeatherModule } from '../../weather/api/weather.module';
import { TideModule } from '../../tide/api/tide.module';
import { WindWaveModule } from '../../wind-wave/api/wind-wave.module';
import { MoonModule } from '../../moon/api/moon.module';
import { SunModule } from '../../sun/api/sun.module';

@Module({
  imports: [WeatherModule, TideModule, WindWaveModule, MoonModule, SunModule],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
