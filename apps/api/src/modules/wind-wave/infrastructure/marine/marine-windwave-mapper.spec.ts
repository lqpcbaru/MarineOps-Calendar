import { describe, expect, it } from 'vitest';
import { mapWindDirection, parseWindSpeedKnots, parseWindGustsKnots, parseWaveHeight, parseMarineDate, mapForecastItem, mapForecastItems } from './marine-windwave-mapper';
import type { MarineRawForecastItem } from './marine-raw-dto';

describe('MarineWindWaveMapper', () => {
  describe('mapWindDirection', () => {
    it('maps BM codes to standard', () => {
      expect(mapWindDirection('U')).toBe('N');
      expect(mapWindDirection('BD')).toBe('SW');
      expect(mapWindDirection('TG')).toBe('SE');
    });
    it('preserves unknown codes', () => {
      expect(mapWindDirection('XX')).toBe('XX');
    });
  });

  describe('parseWindSpeedKnots', () => {
    it('converts range midpoint to knots', () => {
      expect(parseWindSpeedKnots('10-20km/h')).toBeCloseTo(8.1, 0);
    });
    it('handles single value', () => {
      expect(parseWindSpeedKnots('15km/h')).toBeCloseTo(8.1, 0);
    });
  });

  describe('parseWindGustsKnots', () => {
    it('uses upper bound for gusts', () => {
      expect(parseWindGustsKnots('10-20km/h')).toBeCloseTo(10.8, 0);
    });
  });

  describe('parseWaveHeight', () => {
    it('parses range to midpoint', () => {
      expect(parseWaveHeight('0.5-1.0 m')).toBe(0.75);
    });
  });

  describe('parseMarineDate', () => {
    it('converts DD/MM/YYYY', () => {
      expect(parseMarineDate('06/08/2026')).toBe('2026-08-06');
    });
  });

  describe('mapForecastItem', () => {
    it('maps full item', () => {
      const raw: MarineRawForecastItem = {
        tarikh: '06/08/2026', hari: 'Khamis', cuaca: 'Ribut petir',
        arahAngin: 'BD', kelajuanAngin: '10-20km/h',
        ketinggianOmbak: '0.5-1.0 m', tempohOmbak: 6, amaran: null,
      };
      const result = mapForecastItem(raw);
      expect(result.date).toBe('2026-08-06');
      expect(result.windDirection).toBe('SW');
      expect(result.windSpeed).toBeCloseTo(8.1, 0);
      expect(result.waveHeight).toBe(0.75);
      expect(result.wavePeriod).toBe(6);
    });
    it('defaults wavePeriod to 0 when null', () => {
      const raw: MarineRawForecastItem = { tarikh: '06/08/2026', hari: '', cuaca: '', arahAngin: '', kelajuanAngin: '10km/h', ketinggianOmbak: '1.0 m', tempohOmbak: null, amaran: null };
      expect(mapForecastItem(raw).wavePeriod).toBe(0);
    });
  });

  describe('mapForecastItems', () => {
    it('maps array', () => {
      const items: MarineRawForecastItem[] = [
        { tarikh: '06/08/2026', hari: '', cuaca: '', arahAngin: 'U', kelajuanAngin: '10km/h', ketinggianOmbak: '1.0 m', tempohOmbak: null, amaran: null },
      ];
      const result = mapForecastItems(items);
      expect(result).toHaveLength(1);
      expect(result[0]!.windDirection).toBe('N');
    });
  });
});
