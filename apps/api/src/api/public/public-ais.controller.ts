import { Controller, Get, Param, Query } from '@nestjs/common';
import { AisService } from '../../modules/ais/application/ais.service';
import type { AisSearchResult, AisProfileResult, AisEventsResult } from '../../modules/ais/domain';
import { Public } from '../../modules/authentication/api/public.decorator';

@Controller('ais/vessels')
@Public()
export class PublicAisController {
  constructor(private readonly aisService: AisService) {}

  @Get('search')
  async searchVessels(
    @Query('q') q: string,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ): Promise<AisSearchResult> {
    return this.aisService.searchVessels(q || '', page || 1, pageSize || 20);
  }

  @Get(':vesselId')
  async getVesselProfile(@Param('vesselId') vesselId: string): Promise<AisProfileResult> {
    return this.aisService.getVesselProfile(vesselId);
  }

  @Get(':vesselId/events')
  async getVesselEvents(
    @Param('vesselId') vesselId: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ): Promise<AisEventsResult> {
    return this.aisService.getVesselEvents(vesselId, dateFrom, dateTo);
  }
}
