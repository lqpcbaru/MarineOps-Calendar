import { Controller, Get, Query } from '@nestjs/common';
import { MoonService } from '../../modules/moon/application/moon.service';
import type { MoonResponse } from '../../modules/moon/domain';
import { Public } from '../../modules/authentication/api/public.decorator';

@Controller('public/moon')
@Public()
export class PublicMoonController {
  constructor(private readonly moonService: MoonService) {}

  @Get()
  async getMoonPhase(
    @Query('stationId') stationId?: string,
    @Query('date') date?: string,
  ): Promise<MoonResponse> {
    return this.moonService.getMoonPhase(stationId || '—', date);
  }
}
