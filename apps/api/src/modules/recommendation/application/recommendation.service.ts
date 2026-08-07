import { Injectable } from '@nestjs/common';
import type { OperationalRecommendation, RecommendationResponse } from '../domain';
import { calculateOverallScore, calculateOverallStatus, generateRecommendation } from '../domain/scoring-engine';
import { WeatherRule } from '../rules/weather.rule';
import { WindRule } from '../rules/wind.rule';
import { WaveRule } from '../rules/wave.rule';
import { TideRule } from '../rules/tide.rule';
import { MoonRule } from '../rules/moon.rule';
import { SunRule } from '../rules/sun.rule';
import { OperationalCalendarService } from '../../operational-calendar/application/operational-calendar.service';

@Injectable()
export class RecommendationService {
  private readonly rules = [
    new WeatherRule(),
    new WindRule(),
    new WaveRule(),
    new TideRule(),
    new MoonRule(),
    new SunRule(),
  ];

  constructor(
    private readonly calendarService: OperationalCalendarService,
  ) {}

  async getRecommendation(stationId: string, dateFrom?: string, dateTo?: string): Promise<RecommendationResponse> {
    const calendar = await this.calendarService.getCalendar(stationId, dateFrom, dateTo);
    const recommendations: OperationalRecommendation[] = [];

    for (const record of calendar.data) {
      const ruleResults = this.rules.map((rule) => rule.evaluate(record));
      const overallScore = calculateOverallScore(ruleResults);
      const overallStatus = calculateOverallStatus(ruleResults, overallScore);
      const recommendation = generateRecommendation(overallStatus);

      const warnings = ruleResults
        .filter((r) => r.status === 'WARNING' || r.status === 'UNSAFE')
        .map((r) => r.message);

      const advisories = ruleResults
        .filter((r) => r.status === 'CAUTION')
        .map((r) => r.message);

      recommendations.push({
        stationId: record.stationId,
        stationName: record.stationName,
        date: record.date,
        overallStatus,
        overallScore,
        recommendation,
        warnings,
        advisories,
        ruleResults,
        generatedAt: new Date().toISOString(),
      });
    }

    return { data: recommendations, generatedAt: new Date().toISOString() };
  }
}
