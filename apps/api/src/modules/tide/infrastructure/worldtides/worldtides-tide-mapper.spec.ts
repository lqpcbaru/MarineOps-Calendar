import { describe, expect, it } from 'vitest';
import { mapExtreme, mapExtremes } from './worldtides-tide-mapper';

describe('WorldTidesTideMapper', () => {
  describe('mapExtreme', () => {
    it('maps a High tide event', () => {
      const point = mapExtreme({
        dt: 1760396400,
        date: '2026-10-14',
        height: 2.34,
        type: 'High',
      });

      expect(point.type).toBe('HIGH');
      expect(point.height).toBe(2.34);
      expect(point.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(point.time).toMatch(/Z$/);
    });

    it('maps a Low tide event', () => {
      const point = mapExtreme({
        dt: 1760425200,
        date: '2026-10-14',
        height: 0.42,
        type: 'Low',
      });

      expect(point.type).toBe('LOW');
      expect(point.height).toBe(0.42);
    });
  });

  describe('mapExtremes', () => {
    it('maps an array of extremes', () => {
      const points = mapExtremes([
        { dt: 1760396400, date: '2026-10-14', height: 2.34, type: 'High' },
        { dt: 1760425200, date: '2026-10-14', height: 0.42, type: 'Low' },
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
