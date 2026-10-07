import { describe, expect, it } from 'vitest';
import { mapExtreme, mapExtremes } from './stormglass-tide-mapper';

describe('StormGlassTideMapper', () => {
  describe('mapExtreme', () => {
    it('maps a high tide event', () => {
      const point = mapExtreme({
        time: '2026-10-14T00:00:00+00:00',
        height: 2.34,
        type: 'high',
      });

      expect(point.type).toBe('HIGH');
      expect(point.height).toBe(2.34);
      expect(point.date).toBe('2026-10-14');
      expect(point.time).toBe('2026-10-14T00:00:00+00:00');
    });

    it('maps a low tide event', () => {
      const point = mapExtreme({
        time: '2026-10-14T06:00:00+00:00',
        height: 0.42,
        type: 'low',
      });

      expect(point.type).toBe('LOW');
      expect(point.height).toBe(0.42);
    });
  });

  describe('mapExtremes', () => {
    it('maps an array of extremes', () => {
      const points = mapExtremes([
        { time: '2026-10-14T00:00:00+00:00', height: 2.34, type: 'high' },
        { time: '2026-10-14T06:00:00+00:00', height: 0.42, type: 'low' },
      ]);

      expect(points).toHaveLength(2);
      expect(points[0]?.type).toBe('HIGH');
      expect(points[1]?.type).toBe('LOW');
    });

    it('returns empty array for empty input', () => {
      expect(mapExtremes([])).toEqual([]);
    });
  });
});
