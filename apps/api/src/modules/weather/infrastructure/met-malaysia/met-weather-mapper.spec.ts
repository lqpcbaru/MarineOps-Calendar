import { describe, expect, it } from 'vitest';
import {
  mapCondition,
  mapWindDirection,
  parseWindSpeedKnots,
  parseWindGustsKnots,
  parseWaveHeight,
  parseMetDate,
  mapForecastItem,
  mapForecastItems,
} from './met-weather-mapper';
import type { MetRawForecastItem } from './met-raw-dto';

describe('MetWeatherMapper', () => {
  describe('mapCondition', () => {
    it('maps known BM conditions', () => {
      expect(mapCondition('Tiada hujan')).toBe('CLEAR');
      expect(mapCondition('Ribut petir di beberapa tempat')).toBe('THUNDERSTORM');
      expect(mapCondition('Hujan lebat')).toBe('HEAVY_RAIN');
      expect(mapCondition('Mendung')).toBe('CLOUDY');
      expect(mapCondition('Cerah')).toBe('CLEAR');
    });

    it('falls back to fuzzy matching', () => {
      expect(mapCondition('Ribut petir di kawasan pantai')).toBe('THUNDERSTORM');
      expect(mapCondition('Hujan di kawasan barat')).toBe('RAIN');
      expect(mapCondition('Unknown pattern')).toBe('UNKNOWN');
    });
  });

  describe('mapWindDirection', () => {
    it('maps BM wind codes', () => {
      expect(mapWindDirection('U')).toBe('N');
      expect(mapWindDirection('TL')).toBe('NE');
      expect(mapWindDirection('BD')).toBe('SW');
      expect(mapWindDirection('TG')).toBe('SE');
      expect(mapWindDirection('S')).toBe('S');
    });

    it('preserves uppercase if unknown', () => {
      expect(mapWindDirection('XX')).toBe('XX');
    });
  });

  describe('parseWindSpeedKnots', () => {
    it('parses range to midpoint in knots', () => {
      const result = parseWindSpeedKnots('10-20km/h');
      expect(result).toBeCloseTo(8.1, 0);
    });

    it('handles single value', () => {
      expect(parseWindSpeedKnots('15km/h')).toBeCloseTo(8.1, 0);
    });

    it('returns 0 for unparseable', () => {
      expect(parseWindSpeedKnots('unknown')).toBe(0);
    });
  });

  describe('parseWindGustsKnots', () => {
    it('uses upper bound for gusts', () => {
      const result = parseWindGustsKnots('10-20km/h');
      expect(result).toBeCloseTo(10.8, 0);
    });
  });

  describe('parseWaveHeight', () => {
    it('parses range to midpoint', () => {
      expect(parseWaveHeight('0.5-1.0 m')).toBe(0.75);
    });

    it('handles single value', () => {
      expect(parseWaveHeight('2.0 m')).toBe(2);
    });

    it('returns 0 for unparseable', () => {
      expect(parseWaveHeight('unknown')).toBe(0);
    });
  });

  describe('parseMetDate', () => {
    it('converts DD/MM/YYYY to YYYY-MM-DD', () => {
      expect(parseMetDate('06/08/2026')).toBe('2026-08-06');
    });

    it('handles single-digit day/month', () => {
      expect(parseMetDate('1/1/2026')).toBe('2026-01-01');
    });
  });

  describe('mapForecastItem', () => {
    it('maps a full MET item to WeatherDataPoint', () => {
      const raw: MetRawForecastItem = {
        date: '06/08/2026',
        day: 'Khamis',
        weatherCode: 'T',
        weatherCondition: 'Ribut petir di beberapa tempat',
        morningForecast: 'Ribut petir di beberapa tempat',
        afternoonForecast: 'Tiada hujan',
        nightForecast: 'Tiada hujan',
        minTemperature: null,
        maxTemperature: 32,
        windDirection: 'BD',
        windSpeed: '10-20km/h',
        waveHeight: '0.5-1.0 m',
        humidity: null,
      };

      const result = mapForecastItem(raw);
      expect(result.date).toBe('2026-08-06');
      expect(result.conditions).toBe('THUNDERSTORM');
      expect(result.temperature).toBe(32);
      expect(result.visibility).toBeNull();
      expect(result.precipitation).toBeNull();
    });

    it('uses minTemperature when maxTemperature is null', () => {
      const raw: MetRawForecastItem = {
        date: '06/08/2026',
        day: '',
        weatherCode: '',
        weatherCondition: 'Cerah',
        morningForecast: '',
        afternoonForecast: '',
        nightForecast: '',
        minTemperature: 25,
        maxTemperature: null,
        windDirection: '',
        windSpeed: '',
        waveHeight: '',
        humidity: null,
      };
      expect(mapForecastItem(raw).temperature).toBe(25);
    });
  });

  describe('mapForecastItems', () => {
    it('maps an array of items', () => {
      const items: MetRawForecastItem[] = [
        {
          date: '06/08/2026',
          day: '',
          weatherCode: '',
          weatherCondition: 'Cerah',
          morningForecast: '',
          afternoonForecast: '',
          nightForecast: '',
          minTemperature: null,
          maxTemperature: null,
          windDirection: '',
          windSpeed: '',
          waveHeight: '',
          humidity: null,
        },
        {
          date: '07/08/2026',
          day: '',
          weatherCode: '',
          weatherCondition: 'Hujan',
          morningForecast: '',
          afternoonForecast: '',
          nightForecast: '',
          minTemperature: null,
          maxTemperature: null,
          windDirection: '',
          windSpeed: '',
          waveHeight: '',
          humidity: null,
        },
      ];
      const result = mapForecastItems(items);
      expect(result).toHaveLength(2);
      expect(result[0]!.conditions).toBe('CLEAR');
      expect(result[1]!.conditions).toBe('RAIN');
    });
  });
});
