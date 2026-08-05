import { Module } from '@nestjs/common';
import { TideService, TIDE_PROVIDER } from '../application/tide.service';
import { PlaceholderTideProvider } from '../infrastructure/placeholder-tide.provider';

@Module({
  providers: [
    TideService,
    { provide: TIDE_PROVIDER, useClass: PlaceholderTideProvider },
  ],
  exports: [TideService, TIDE_PROVIDER],
})
export class TideModule {}
