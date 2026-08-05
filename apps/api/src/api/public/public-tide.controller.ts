import { Controller, Get, Query } from '@nestjs/common';
import { TideService } from '../../modules/tide/application/tide.service';
import type { TideResponse } from '../../modules/tide/domain';
import { Public } from '../../modules/authentication/api/public.decorator';

@Controller('tide')
@Public()
export class PublicTideController {
  constructor(private readonly tideService: TideService) {}

  @Get()
  async getTide(
    @Query('stationId') stationId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ): Promise<TideResponse> {
    return this.tideService.getTide(stationId || '—', dateFrom, dateTo);
  }
}
