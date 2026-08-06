import { Injectable } from '@nestjs/common';
import { WeatherService } from '../../weather/application/weather.service';
import { TideService } from '../../tide/application/tide.service';
import { WindWaveService } from '../../wind-wave/application/wind-wave.service';
import { MoonService } from '../../moon/application/moon.service';
import { SunService } from '../../sun/application/sun.service';
import type { PublicDashboardResponse, Freshness } from '../domain';

@Injectable()
export class DashboardService {
  constructor(
    private readonly weatherService: WeatherService,
    private readonly tideService: TideService,
    private readonly windWaveService: WindWaveService,
    private readonly moonService: MoonService,
    private readonly sunService: SunService,
  ) {}

  async getPublicDashboard(stationId?: string): Promise<PublicDashboardResponse> {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const sid = stationId || '—';

    const [
      weatherResult,
      tideResult,
      windWaveResult,
      moonResult,
      sunResult,
    ] = await Promise.all([
      this.weatherService.getWeather(sid, dateStr, dateStr),
      this.tideService.getTide(sid, dateStr, dateStr),
      this.windWaveService.getWindWave(sid, dateStr, dateStr),
      this.moonService.getMoonPhase(sid, dateStr),
      this.sunService.getSunData(sid, dateStr),
    ]);

    const dashboardFreshness: Freshness = {
      status: 'fresh',
      fetchedAt: now.toISOString(),
      validUntil: new Date(now.getTime() + 300_000).toISOString(),
      source: 'dashboard-aggregator',
    };

    return {
      date: dateStr,
      hijriDate: '—',
      station: {
        id: sid,
        name: '—',
        code: '—',
      },
      tide: {
        next: tideResult.data[0] ?? null,
        freshness: dashboardFreshness,
      },
      weather: {
        current: weatherResult.data[0] ?? null,
        freshness: dashboardFreshness,
      },
      windWave: {
        current: windWaveResult.data[0] ?? null,
        freshness: dashboardFreshness,
      },
      moon: {
        phaseName: moonResult.data.phaseName,
        illumination: moonResult.data.illumination,
      },
      sun: {
        sunrise: sunResult.data.sunrise,
        sunset: sunResult.data.sunset,
      },
      activeAlerts: {
        count: 0,
        latest: null,
      },
      operationalStatus: 'UNKNOWN',
    };
  }
}
