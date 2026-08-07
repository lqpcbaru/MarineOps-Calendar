import { Module } from '@nestjs/common';
import { DashboardService } from '../application/dashboard.service';
import { OperationalCalendarModule } from '../../operational-calendar/api/operational-calendar.module';
import { RecommendationModule } from '../../recommendation/api/recommendation.module';

@Module({
  imports: [OperationalCalendarModule, RecommendationModule],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
