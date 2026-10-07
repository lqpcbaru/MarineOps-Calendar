import { describe, expect, it } from 'vitest';
import { mapWindDirection, mapOpenMeteoMarine } from './open-meteo-marine-mapper';

describe('OpenMeteoMarineMapper', () => {
  describe('mapWindDirection', () => {
    it('maps cardinal directions', () => {
      expect(mapWindDirection(0)).toBe('N');
      expect(mapWindDirection(90)).toBe('E');
      expect(mapWindDirection(180)).toBe('S');
      expect(mapWindDirection(270)).toBe('W');
    });

    it('maps intercardinal directions', () => {
      expect(mapWindDirection(45)).toBe('NE');
      expect(mapWindDirection(135)).toBe('SE');
      expect(mapWindDirection(225)).toBe('SW');
      expect(mapWindDirection(315)).toBe('NW');
    });

    it('returns UNKNOWN for undefined', () => {
      expect(mapWindDirection(undefined)).toBe('UNKNOWN');
      expect(mapWindDirection(null)).toBe('UNKNOWN');
    });
  });

  describe('mapOpenMeteoMarine', () => {
    it('maps index-aligned wind/wave arrays', () => {
      const points = mapOpenMeteoMarine({
        daily: {
          time: ['2026-10-01', '2026-10-02'],
          wind_speed_10m_max: [12.5, 8.3],
          wind_gusts_10m_max: [20.1, 15.4],
          wind_direction_10m_dominant: [225, 90],
          wave_height_max: [1.2, 0.6],
          wave_period_max: [8.5, 6.2],
        },
      });

      expect(points).toHaveLength(2);
      expect(points[0]).toEqual({
        date: '2026-10-01',
        windSpeed: 12.5,
        windDirection: 'SW',
        windGusts: 20.1,
        waveHeight: 1.2,
        wavePeriod: 8.5,
      });
      expect(points[1]).toEqual({
        date: '2026-10-02',
        windSpeed: 8.3,
        windDirection: 'E',
        windGusts: 15.4,
        waveHeight: 0.6,
        wavePeriod: 6.2,
      });
    });

    it('returns empty array when daily is absent', () => {
      expect(mapOpenMeteoMarine({})).toEqual([]);
      expect(mapOpenMeteoMarine({ daily: { time: [] } })).toEqual([]);
    });
  });
});
