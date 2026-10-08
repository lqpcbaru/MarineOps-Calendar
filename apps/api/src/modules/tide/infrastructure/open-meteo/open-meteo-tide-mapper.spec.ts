import { describe, expect, it } from 'vitest';
import { detectExtremes, mapSeaLevelToTide } from './open-meteo-tide-mapper';

describe('OpenMeteoTideMapper', () => {
  describe('detectExtremes', () => {
    it('detects high and low from a smooth series', () => {
      // A simple sine-like series: 0, 1, 2, 1, 0, -1, 0
      const points = detectExtremes([
        { time: '2026-10-08T00:00', height: 0 },
        { time: '2026-10-08T01:00', height: 1 },
        { time: '2026-10-08T02:00', height: 2 },
        { time: '2026-10-08T03:00', height: 1 },
        { time: '2026-10-08T04:00', height: 0 },
        { time: '2026-10-08T05:00', height: -1 },
        { time: '2026-10-08T06:00', height: 0 },
      ]);

      const highs = points.filter((p) => p.type === 'HIGH');
      const lows = points.filter((p) => p.type === 'LOW');

      expect(highs).toHaveLength(1);
      expect(highs[0]?.height).toBe(2);
      expect(lows).toHaveLength(1);
      expect(lows[0]?.height).toBe(-1);
    });

    it('returns empty for a flat series', () => {
      const points = detectExtremes([
        { time: '2026-10-08T00:00', height: 1 },
        { time: '2026-10-08T01:00', height: 1 },
        { time: '2026-10-08T02:00', height: 1 },
      ]);
      expect(points).toEqual([]);
    });
  });

  describe('mapSeaLevelToTide', () => {
    it('maps hourly sea level to tide points', () => {
      const points = mapSeaLevelToTide({
        latitude: 3,
        longitude: 101,
        timezone: 'Asia/Kuala_Lumpur',
        hourly: {
          time: ['2026-10-08T00:00', '2026-10-08T01:00', '2026-10-08T02:00', '2026-10-08T03:00'],
          sea_level_height_msl: [0, 1.5, 2.0, 1.0],
        },
      });

      expect(points.length).toBeGreaterThan(0);
      expect(points.every((p) => p.date === '2026-10-08')).toBe(true);
      expect(points.every((p) => p.type === 'HIGH' || p.type === 'LOW')).toBe(true);
    });

    it('returns empty when hourly is absent', () => {
      expect(mapSeaLevelToTide({ latitude: 3, longitude: 101, timezone: 'UTC' })).toEqual([]);
    });
  });
});
