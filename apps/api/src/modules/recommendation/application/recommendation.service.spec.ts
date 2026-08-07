import { describe, expect, it } from 'vitest';
import { RecommendationService } from './recommendation.service';
import type { OperationalCalendarService } from '../../operational-calendar/application/operational-calendar.service';

describe('RecommendationService', () => {
  function createService() {
    const calendarService = {
      async getCalendar() {
        return {
          data: [{
            stationId: 'st-001', stationName: 'Test', stationCode: 'TST', regionName: null,
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
    return new RecommendationService(calendarService);
  }

  it('produces recommendation with overall status', async () => {
    const svc = createService();
    const result = await svc.getRecommendation('st-001');
    expect(result.data).toHaveLength(1);
    const rec = result.data[0]!;
    expect(rec.overallStatus).toBeDefined();
    expect(rec.overallScore).toBeGreaterThan(0);
    expect(rec.ruleResults).toHaveLength(6);
    expect(rec.warnings).toBeDefined();
    expect(rec.advisories).toBeDefined();
  });

  it('generates recommendation text', async () => {
    const svc = createService();
    const result = await svc.getRecommendation('st-001');
    expect(result.data[0]!.recommendation.length).toBeGreaterThan(10);
  });

  it('handles missing data gracefully', async () => {
    const calendarService = {
      async getCalendar() {
        return {
          data: [{
            stationId: 'st-001', stationName: 'Test', stationCode: 'TST', regionName: null,
            date: '2026-08-06', hijriDate: '—',
            weather: null, tide: null, windWave: null, moon: null, sun: null,
            freshness: { status: 'fresh', fetchedAt: '', validUntil: '', source: '' },
            generatedAt: '',
          }],
          freshness: { status: 'fresh', fetchedAt: '', validUntil: '', source: '' },
        };
      },
    } as unknown as OperationalCalendarService;
    const svc = new RecommendationService(calendarService);
    const result = await svc.getRecommendation('st-001');
    expect(result.data[0]!.overallStatus).toBe('UNSAFE');
  });

  it('supports multi-day recommendations', async () => {
    const calendarService = {
      async getCalendar() {
        return {
          data: [
            { stationId: 'st-001', stationName: 'Test', stationCode: 'TST', regionName: null, date: '2026-08-06', hijriDate: '—', weather: null, tide: null, windWave: null, moon: null, sun: null, freshness: { status: 'fresh', fetchedAt: '', validUntil: '', source: '' }, generatedAt: '' },
            { stationId: 'st-001', stationName: 'Test', stationCode: 'TST', regionName: null, date: '2026-08-07', hijriDate: '—', weather: null, tide: null, windWave: null, moon: null, sun: null, freshness: { status: 'fresh', fetchedAt: '', validUntil: '', source: '' }, generatedAt: '' },
            { stationId: 'st-001', stationName: 'Test', stationCode: 'TST', regionName: null, date: '2026-08-08', hijriDate: '—', weather: null, tide: null, windWave: null, moon: null, sun: null, freshness: { status: 'fresh', fetchedAt: '', validUntil: '', source: '' }, generatedAt: '' },
          ],
          freshness: { status: 'fresh', fetchedAt: '', validUntil: '', source: '' },
        };
      },
    } as unknown as OperationalCalendarService;
    const svc = new RecommendationService(calendarService);
    const result = await svc.getRecommendation('st-001', '2026-08-06', '2026-08-08');
    expect(result.data).toHaveLength(3);
  });
});
