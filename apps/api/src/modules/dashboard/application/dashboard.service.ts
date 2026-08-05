import { Injectable } from '@nestjs/common';
import type { PublicDashboardResponse, Freshness } from '../domain';

@Injectable()
export class DashboardService {
  async getPublicDashboard(stationId?: string): Promise<PublicDashboardResponse> {
    const now = new Date();
    const freshness: Freshness = {
      status: 'fresh',
      fetchedAt: now.toISOString(),
      validUntil: new Date(now.getTime() + 300_000).toISOString(),
      source: 'placeholder',
    };

    return {
      date: now.toISOString().slice(0, 10),
      hijriDate: '—',
      station: {
        id: stationId || '—',
        name: '—',
        code: '—',
      },
      tide: {
        next: null,
        freshness,
      },
      weather: {
        current: null,
        freshness,
      },
      windWave: {
        current: null,
        freshness,
      },
      moon: {
        phaseName: '—',
        illumination: 0,
      },
      sun: {
        sunrise: '—',
        sunset: '—',
      },
      activeAlerts: {
        count: 0,
        latest: null,
      },
      operationalStatus: 'UNKNOWN',
    };
  }
}
