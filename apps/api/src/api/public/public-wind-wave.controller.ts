import { Controller, Get, Query } from '@nestjs/common';
import { WindWaveService } from '../../modules/wind-wave/application/wind-wave.service';
import type { WindWaveResponse } from '../../modules/wind-wave/domain';
import { Public } from '../../modules/authentication/api/public.decorator';

@Controller('wind-wave')
@Public()
export class PublicWindWaveController {
  constructor(private readonly windWaveService: WindWaveService) {}

  @Get()
  async getWindWave(
    @Query('stationId') stationId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ): Promise<WindWaveResponse> {
    return this.windWaveService.getWindWave(stationId || '—', dateFrom, dateTo);
  }
}
