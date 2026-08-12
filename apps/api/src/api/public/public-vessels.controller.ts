import { Controller, Get, Param, Query } from '@nestjs/common';
import { VesselIntelligenceService } from '../../modules/vessel-intelligence/application/vessel-intelligence.service';
import type { VesselSearchResult, VesselProfile, VesselEventsResult } from '../../modules/vessel-intelligence/domain';
import { Public } from '../../modules/authentication/api/public.decorator';

@Controller('vessels')
@Public()
export class PublicVesselsController {
  constructor(private readonly vesselService: VesselIntelligenceService) {}

  @Get('search')
  async searchVessels(
    @Query('q') q: string,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ): Promise<VesselSearchResult> {
    return this.vesselService.searchVessels(q || '', page || 1, pageSize || 20);
  }

  @Get(':vesselId')
  async getVesselProfile(@Param('vesselId') vesselId: string): Promise<VesselProfile> {
    return this.vesselService.getVesselProfile(vesselId);
  }

  @Get(':vesselId/events')
  async getVesselEvents(
    @Param('vesselId') vesselId: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ): Promise<VesselEventsResult> {
    return this.vesselService.getVesselEvents(vesselId, dateFrom, dateTo);
  }
}
