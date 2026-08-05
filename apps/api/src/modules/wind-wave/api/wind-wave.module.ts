import { Module } from '@nestjs/common';
import { WindWaveService, WIND_WAVE_PROVIDER } from '../application/wind-wave.service';
import { PlaceholderWindWaveProvider } from '../infrastructure/placeholder-wind-wave.provider';

@Module({
  providers: [
    WindWaveService,
    { provide: WIND_WAVE_PROVIDER, useClass: PlaceholderWindWaveProvider },
  ],
  exports: [WindWaveService, WIND_WAVE_PROVIDER],
})
export class WindWaveModule {}
