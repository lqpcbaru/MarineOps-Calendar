import { describe, expect, it } from 'vitest';
import { mapTideType, parseJupemDateTime, mapTidePoint, mapTideDay, mapTideResponse } from './jupem-tide-mapper';
import type { JupemRawTidePoint, JupemRawTideDay } from './jupem-raw-dto';

describe('JupemTideMapper', () => {
  describe('mapTideType', () => {
    it('maps Air Pasang to HIGH', () => {
      expect(mapTideType('Air Pasang')).toBe('HIGH');
    });
    it('maps Air Surut to LOW', () => {
      expect(mapTideType('Air Surut')).toBe('LOW');
    });
    it('maps lowercase pasang to HIGH', () => {
      expect(mapTideType('air pasang')).toBe('HIGH');
    });
    it('defaults to HIGH for unknown', () => {
      expect(mapTideType('unknown')).toBe('HIGH');
    });
  });

  describe('parseJupemDateTime', () => {
    it('combines date and time into ISO datetime', () => {
      expect(parseJupemDateTime('2026-08-06', '06:30')).toBe('2026-08-06T06:30:00Z');
    });
    it('pads single-digit hour/minute', () => {
      expect(parseJupemDateTime('2026-08-06', '6:5')).toBe('2026-08-06T06:05:00Z');
    });
  });

  describe('mapTidePoint', () => {
    it('maps a raw point to TideDataPoint', () => {
      const raw: JupemRawTidePoint = { tarikh: '2026-08-06', masa: '06:30', ketinggian: 2.5, jenis: 'Air Pasang' };
      const result = mapTidePoint(raw);
      expect(result.date).toBe('2026-08-06');
      expect(result.time).toBe('2026-08-06T06:30:00Z');
      expect(result.height).toBe(2.5);
      expect(result.type).toBe('HIGH');
    });
  });

  describe('mapTideDay', () => {
    it('maps all points in a day', () => {
      const day: JupemRawTideDay = {
        tarikh: '2026-08-06',
        ramalan: 'baik',
        pasangSurut: [
          { tarikh: '2026-08-06', masa: '06:30', ketinggian: 2.5, jenis: 'Air Pasang' },
          { tarikh: '2026-08-06', masa: '12:45', ketinggian: 0.8, jenis: 'Air Surut' },
        ],
      };
      const result = mapTideDay(day);
      expect(result).toHaveLength(2);
      expect(result[0]!.type).toBe('HIGH');
      expect(result[1]!.type).toBe('LOW');
    });
  });

  describe('mapTideResponse', () => {
    it('flattens multiple days', () => {
      const days: JupemRawTideDay[] = [
        { tarikh: '2026-08-06', ramalan: '', pasangSurut: [{ tarikh: '2026-08-06', masa: '06:30', ketinggian: 2.5, jenis: 'Air Pasang' }] },
        { tarikh: '2026-08-07', ramalan: '', pasangSurut: [{ tarikh: '2026-08-07', masa: '07:00', ketinggian: 2.3, jenis: 'Air Pasang' }] },
      ];
      const result = mapTideResponse(days);
      expect(result).toHaveLength(2);
      expect(result[0]!.date).toBe('2026-08-06');
      expect(result[1]!.date).toBe('2026-08-07');
    });
  });
});
