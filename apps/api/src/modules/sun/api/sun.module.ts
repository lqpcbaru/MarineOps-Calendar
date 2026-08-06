import { Module } from '@nestjs/common';
import { SunService, SUN_PROVIDER } from '../application/sun.service';
import { PlaceholderSunProvider } from '../infrastructure/placeholder-sun.provider';

@Module({
  providers: [
    SunService,
    { provide: SUN_PROVIDER, useClass: PlaceholderSunProvider },
  ],
  exports: [SunService, SUN_PROVIDER],
})
export class SunModule {}
