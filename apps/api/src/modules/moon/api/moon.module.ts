import { Module } from '@nestjs/common';
import { MoonService, MOON_PROVIDER } from '../application/moon.service';
import { PlaceholderMoonProvider } from '../infrastructure/placeholder-moon.provider';

@Module({
  providers: [
    MoonService,
    { provide: MOON_PROVIDER, useClass: PlaceholderMoonProvider },
  ],
  exports: [MoonService, MOON_PROVIDER],
})
export class MoonModule {}
