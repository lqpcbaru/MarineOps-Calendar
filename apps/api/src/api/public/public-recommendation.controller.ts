import { Controller, Get, Query } from '@nestjs/common';
import { RecommendationService } from '../../modules/recommendation/application/recommendation.service';
import type { RecommendationResponse } from '../../modules/recommendation/domain';
import { Public } from '../../modules/authentication/api/public.decorator';

@Controller('public/recommendation')
@Public()
export class PublicRecommendationController {
  constructor(private readonly recommendationService: RecommendationService) {}

  @Get()
  async getRecommendation(
    @Query('stationId') stationId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ): Promise<RecommendationResponse> {
    return this.recommendationService.getRecommendation(stationId || '—', dateFrom, dateTo);
  }
}
