import { Module } from '@nestjs/common';
import { RecommendationService } from '../application/recommendation.service';
import { OperationalCalendarModule } from '../../operational-calendar/api/operational-calendar.module';

@Module({
  imports: [OperationalCalendarModule],
  providers: [RecommendationService],
  exports: [RecommendationService],
})
export class RecommendationModule {}
