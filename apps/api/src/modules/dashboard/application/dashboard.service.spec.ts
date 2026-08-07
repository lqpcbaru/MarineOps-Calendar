import { describe, expect, it } from 'vitest';
import { DashboardService } from './dashboard.service';
import type { OperationalCalendarService } from '../../operational-calendar/application/operational-calendar.service';
import type { RecommendationService } from '../../recommendation/application/recommendation.service';

describe('DashboardService', () => {
  function createService() {
    const calendarService = {
      async getCalendar() {
        return {
          data: [{
            stationId: 'st-001', stationName: 'Pelabuhan Klang', stationCode: 'PKG-01', regionName: 'Selangor',
            date: '2026-08-06', hijriDate: '—',
            weather: { conditions: 'Cerah', temperature: 30, visibility: 10, precipitation: 0 },
            tide: { nextHigh: { time: '06:30', height: 2.5 }, nextLow: { time: '12:45', height: 0.8 }, type: 'HIGH' },
            windWave: { windSpeed: 10, windDirection: 'SW', windGusts: 15, waveHeight: 1.0, wavePeriod: 6 },
            moon: { phaseName: 'Bulan Penuh', illumination: 100, moonrise: '18:30', moonset: '06:00' },
            sun: { sunrise: '06:30', sunset: '18:45', dayLength: 'PT12H15M' },
            freshness: { status: 'fresh', fetchedAt: '', validUntil: '', source: '' },
            generatedAt: '',
          }],
          freshness: { status: 'fresh', fetchedAt: '', validUntil: '', source: '' },
        };
      },
    } as unknown as OperationalCalendarService;

    const recommendationService = {
      async getRecommendation() {
        return {
          data: [{
            stationId: 'st-001', stationName: 'Pelabuhan Klang', date: '2026-08-06',
            overallStatus: 'SAFE' as const, overallScore: 85,
            recommendation: 'Keadaan sesuai untuk operasi laut.',
            warnings: [], advisories: ['Angin sederhana'],
            ruleResults: [], generatedAt: '',
          }],
          generatedAt: '',
        };
      },
    } as unknown as RecommendationService;

    return new DashboardService(calendarService, recommendationService);
  }

  it('merges calendar and recommendation into dashboard', async () => {
    const svc = createService();
    const result = await svc.getPublicDashboard('st-001');
    expect(result.station.name).toBe('Pelabuhan Klang');
    expect(result.station.code).toBe('PKG-01');
    expect(result.operationalStatus).toBe('SAFE');
    expect(result.overallScore).toBe(85);
    expect(result.weather!.conditions).toBe('Cerah');
    expect(result.wind!.speed).toBe(10);
    expect(result.wave!.height).toBe(1.0);
    expect(result.moon!.phaseName).toBe('Bulan Penuh');
    expect(result.sun!.sunrise).toBe('06:30');
    expect(result.advisories).toHaveLength(1);
  });

  it('handles missing calendar data', async () => {
    const calendarService = {
      async getCalendar() { return { data: [], freshness: { status: 'fresh', fetchedAt: '', validUntil: '', source: '' } }; },
    } as unknown as OperationalCalendarService;
    const recommendationService = {
      async getRecommendation() { return { data: [], generatedAt: '' }; },
    } as unknown as RecommendationService;
    const svc = new DashboardService(calendarService, recommendationService);
    const result = await svc.getPublicDashboard('st-001');
    expect(result.operationalStatus).toBe('UNKNOWN');
    expect(result.weather).toBeNull();
  });

  it('defaults stationId to —', async () => {
    const svc = createService();
    const result = await svc.getPublicDashboard();
    expect(result.station.id).toBe('—');
  });
});
