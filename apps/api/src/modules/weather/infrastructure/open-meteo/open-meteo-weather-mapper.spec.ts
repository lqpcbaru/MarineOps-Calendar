import { describe, expect, it } from 'vitest';
import { mapWmoCondition, mapOpenMeteoWeather } from './open-meteo-weather-mapper';

describe('OpenMeteoWeatherMapper', () => {
  describe('mapWmoCondition', () => {
    it('maps clear/sunny codes', () => {
      expect(mapWmoCondition(0)).toBe('CLEAR');
      expect(mapWmoCondition(1)).toBe('CLEAR');
    });

    it('maps cloudy codes', () => {
      expect(mapWmoCondition(2)).toBe('CLOUDY');
      expect(mapWmoCondition(3)).toBe('CLOUDY');
      expect(mapWmoCondition(45)).toBe('CLOUDY');
    });

    it('maps rain codes', () => {
      expect(mapWmoCondition(61)).toBe('RAIN');
      expect(mapWmoCondition(63)).toBe('RAIN');
      expect(mapWmoCondition(65)).toBe('HEAVY_RAIN');
    });

    it('maps thunderstorm codes', () => {
      expect(mapWmoCondition(95)).toBe('THUNDERSTORM');
      expect(mapWmoCondition(96)).toBe('THUNDERSTORM');
    });

    it('returns UNKNOWN for undefined or unmapped codes', () => {
      expect(mapWmoCondition(undefined)).toBe('UNKNOWN');
      expect(mapWmoCondition(null)).toBe('UNKNOWN');
      expect(mapWmoCondition(42)).toBe('UNKNOWN');
    });
  });

  describe('mapOpenMeteoWeather', () => {
    it('maps index-aligned daily arrays', () => {
      const points = mapOpenMeteoWeather({
        daily: {
          time: ['2026-10-01', '2026-10-02'],
          temperature_2m_max: [31.2, 30.5],
          temperature_2m_min: [24.1, 24.3],
          weather_code: [61, 2],
          precipitation_sum: [5.4, 0],
        },
      });

      expect(points).toHaveLength(2);
      expect(points[0]).toEqual({
        date: '2026-10-01',
        temperature: 31.2,
        conditions: 'RAIN',
        visibility: null,
        precipitation: 5.4,
      });
      expect(points[1]).toEqual({
        date: '2026-10-02',
        temperature: 30.5,
        conditions: 'CLOUDY',
        visibility: null,
        precipitation: 0,
      });
    });

    it('falls back to min temperature when max is missing', () => {
      const points = mapOpenMeteoWeather({
        daily: { time: ['2026-10-01'], temperature_2m_min: [22.5] },
      });
      expect(points[0]?.temperature).toBe(22.5);
    });

    it('returns empty array when daily is absent or empty', () => {
      expect(mapOpenMeteoWeather({})).toEqual([]);
      expect(mapOpenMeteoWeather({ daily: { time: [] } })).toEqual([]);
    });
  });
});
