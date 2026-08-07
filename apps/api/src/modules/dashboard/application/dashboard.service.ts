import { Injectable } from '@nestjs/common';
import { OperationalCalendarService } from '../../operational-calendar/application/operational-calendar.service';
import { RecommendationService } from '../../recommendation/application/recommendation.service';
import type { DashboardResponse } from '../domain';

@Injectable()
export class DashboardService {
  constructor(
    private readonly calendarService: OperationalCalendarService,
    private readonly recommendationService: RecommendationService,
  ) {}

  async getPublicDashboard(stationId?: string): Promise<DashboardResponse> {
    const sid = stationId || '—';
    const today = new Date().toISOString().slice(0, 10);

    const [calendar, recommendation] = await Promise.all([
      this.calendarService.getCalendar(sid, today, today),
      this.recommendationService.getRecommendation(sid, today, today),
    ]);

    const record = calendar.data[0];
    const rec = recommendation.data[0];

    return {
      date: today,
      station: {
        id: sid,
        name: record?.stationName ?? '—',
        code: record?.stationCode ?? '—',
        regionName: record?.regionName ?? null,
      },
      operationalStatus: rec?.overallStatus ?? 'UNKNOWN',
      overallScore: rec?.overallScore ?? 0,
      recommendation: rec?.recommendation ?? '—',
      weather: record?.weather ? { conditions: record.weather.conditions, temperature: record.weather.temperature } : null,
      wind: record?.windWave ? { speed: record.windWave.windSpeed, direction: record.windWave.windDirection } : null,
      wave: record?.windWave ? { height: record.windWave.waveHeight } : null,
      tide: record?.tide ? { type: record.tide.type, nextHigh: record.tide.nextHigh, nextLow: record.tide.nextLow } : null,
      moon: record?.moon ? { phaseName: record.moon.phaseName, illumination: record.moon.illumination } : null,
      sun: record?.sun ? { sunrise: record.sun.sunrise, sunset: record.sun.sunset } : null,
      warnings: rec?.warnings ?? [],
      advisories: rec?.advisories ?? [],
      generatedAt: new Date().toISOString(),
    };
  }
}
