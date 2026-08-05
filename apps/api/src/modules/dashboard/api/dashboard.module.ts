import { Module } from '@nestjs/common';
import { DashboardService } from '../application/dashboard.service';

@Module({
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
