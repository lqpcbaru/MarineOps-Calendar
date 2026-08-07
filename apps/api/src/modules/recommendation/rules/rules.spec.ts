import { describe, expect, it } from 'vitest';
import { WeatherRule } from './weather.rule';
import { WindRule } from './wind.rule';
import { WaveRule } from './wave.rule';
import { TideRule } from './tide.rule';
import { MoonRule } from './moon.rule';
import { SunRule } from './sun.rule';
import type { DailyOperationalRecord } from '../../operational-calendar/domain';

const baseRecord: DailyOperationalRecord = {
  stationId: 'st-001', stationName: 'Test', stationCode: 'TST', regionName: null,
  date: '2026-08-06', hijriDate: '—',
  weather: { conditions: 'Cerah', temperature: 30, visibility: 10, precipitation: 0 },
  tide: { nextHigh: { time: '06:30', height: 2.5 }, nextLow: { time: '12:45', height: 0.8 }, type: 'HIGH' },
  windWave: { windSpeed: 10, windDirection: 'SW', windGusts: 15, waveHeight: 1.0, wavePeriod: 6 },
  moon: { phaseName: 'Bulan Penuh', illumination: 100, moonrise: '18:30', moonset: '06:00' },
  sun: { sunrise: '06:30', sunset: '18:45', dayLength: 'PT12H15M' },
  freshness: { status: 'fresh', fetchedAt: '', validUntil: '', source: '' },
  generatedAt: '',
};

describe('Recommendation Rules', () => {
  describe('WeatherRule', () => {
    it('returns SAFE for good conditions', () => {
      const result = new WeatherRule().evaluate(baseRecord);
      expect(result.status).toBe('SAFE');
      expect(result.scoreContribution).toBe(20);
    });
    it('returns UNSAFE for thunderstorm', () => {
      const record = { ...baseRecord, weather: { ...baseRecord.weather!, conditions: 'THUNDERSTORM' } };
      expect(new WeatherRule().evaluate(record).status).toBe('UNSAFE');
    });
    it('returns UNSAFE when weather missing', () => {
      expect(new WeatherRule().evaluate({ ...baseRecord, weather: null }).status).toBe('UNSAFE');
    });
  });

  describe('WindRule', () => {
    it('returns SAFE for light wind', () => {
      expect(new WindRule().evaluate(baseRecord).status).toBe('SAFE');
    });
    it('returns UNSAFE for strong wind', () => {
      const record = { ...baseRecord, windWave: { ...baseRecord.windWave!, windSpeed: 35 } };
      expect(new WindRule().evaluate(record).status).toBe('UNSAFE');
    });
    it('returns WARNING for moderate wind', () => {
      const record = { ...baseRecord, windWave: { ...baseRecord.windWave!, windSpeed: 25 } };
      expect(new WindRule().evaluate(record).status).toBe('WARNING');
    });
  });

  describe('WaveRule', () => {
    it('returns SAFE for calm waves', () => {
      expect(new WaveRule().evaluate(baseRecord).status).toBe('SAFE');
    });
    it('returns UNSAFE for high waves', () => {
      const record = { ...baseRecord, windWave: { ...baseRecord.windWave!, waveHeight: 4.0 } };
      expect(new WaveRule().evaluate(record).status).toBe('UNSAFE');
    });
  });

  describe('TideRule', () => {
    it('returns SAFE when tide data available', () => {
      expect(new TideRule().evaluate(baseRecord).status).toBe('SAFE');
    });
    it('returns UNSAFE when tide missing', () => {
      expect(new TideRule().evaluate({ ...baseRecord, tide: null }).status).toBe('UNSAFE');
    });
  });

  describe('MoonRule', () => {
    it('returns SAFE for full moon', () => {
      expect(new MoonRule().evaluate(baseRecord).status).toBe('SAFE');
    });
    it('returns CAUTION for low illumination', () => {
      const record = { ...baseRecord, moon: { ...baseRecord.moon!, illumination: 15 } };
      expect(new MoonRule().evaluate(record).status).toBe('CAUTION');
    });
  });

  describe('SunRule', () => {
    it('returns SAFE for long day', () => {
      expect(new SunRule().evaluate(baseRecord).status).toBe('SAFE');
    });
    it('returns UNSAFE when sun missing', () => {
      expect(new SunRule().evaluate({ ...baseRecord, sun: null }).status).toBe('UNSAFE');
    });
  });
});
