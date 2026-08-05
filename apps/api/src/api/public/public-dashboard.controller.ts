import { Controller, Get, Query } from '@nestjs/common';
import { DashboardService } from '../../modules/dashboard/application/dashboard.service';
import type { PublicDashboardResponse } from '../../modules/dashboard/domain';
import { Public } from '../../modules/authentication/api/public.decorator';

@Controller('dashboard')
@Public()
export class PublicDashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  async getDashboard(@Query('stationId') stationId?: string): Promise<PublicDashboardResponse> {
    return this.dashboardService.getPublicDashboard(stationId);
  }
}
