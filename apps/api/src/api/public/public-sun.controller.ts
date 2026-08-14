import { Controller, Get, Query } from '@nestjs/common';
import { SunService } from '../../modules/sun/application/sun.service';
import type { SunResponse } from '../../modules/sun/domain';
import { Public } from '../../modules/authentication/api/public.decorator';

@Controller('public/sun')
@Public()
export class PublicSunController {
  constructor(private readonly sunService: SunService) {}

  @Get()
  async getSunData(
    @Query('stationId') stationId?: string,
    @Query('date') date?: string,
  ): Promise<SunResponse> {
    return this.sunService.getSunData(stationId || '—', date);
  }
}
