import { describe, expect, it } from 'vitest';
import {
  toLocalDateString,
  localToday,
  parseCalendarDate,
  iterateCalendarDates,
  validateDateString,
} from './date-validation';

describe('date-validation', () => {
  describe('toLocalDateString', () => {
    it('formats an instant as Malaysia (Asia/Kuala_Lumpur) calendar date', () => {
      // 2026-08-13T16:30:00Z == 2026-08-14T00:30 in Malaysia (UTC+8).
      const d = new Date('2026-08-13T16:30:00Z');
      expect(toLocalDateString(d)).toBe('2026-08-14');
    });

    it('formats a mid-day Malaysia instant as the same Malaysia date', () => {
      const d = new Date('2026-08-14T04:00:00Z'); // 12:00 Malaysia
      expect(toLocalDateString(d)).toBe('2026-08-14');
    });

    it('is not affected by a UTC process timezone at the Malaysia/UTC boundary', () => {
      // Boundary case: 00:00–07:59 Malaysia still maps to the same calendar
      // day even when the instant is "previous day" in UTC.
      const earlyMalaysiaMorning = new Date('2026-08-13T17:00:00Z'); // 01:00 MYT
      expect(toLocalDateString(earlyMalaysiaMorning)).toBe('2026-08-14');
    });
  });

  describe('localToday', () => {
    it('matches the Malaysia calendar date via Intl, independent of server TZ', () => {
      const malaysiaToday = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Kuala_Lumpur',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(new Date());
      expect(localToday()).toBe(malaysiaToday);
    });

    it('matches YYYY-MM-DD shape', () => {
      expect(localToday()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('parseCalendarDate', () => {
    it('parses YYYY-MM-DD into a UTC-midnight Date', () => {
      const d = parseCalendarDate('2026-08-14');
      expect(d.getUTCFullYear()).toBe(2026);
      expect(d.getUTCMonth()).toBe(7);
      expect(d.getUTCDate()).toBe(14);
    });
  });

  describe('iterateCalendarDates', () => {
    it('returns exact calendar dates in order for a multi-day range', () => {
      expect(iterateCalendarDates('2026-08-14', '2026-08-20')).toEqual([
        '2026-08-14',
        '2026-08-15',
        '2026-08-16',
        '2026-08-17',
        '2026-08-18',
        '2026-08-19',
        '2026-08-20',
      ]);
    });

    it('returns a single date for an equal range', () => {
      expect(iterateCalendarDates('2026-08-14', '2026-08-14')).toEqual(['2026-08-14']);
    });

    it('crosses a month boundary correctly', () => {
      expect(iterateCalendarDates('2026-01-31', '2026-02-02')).toEqual([
        '2026-01-31',
        '2026-02-01',
        '2026-02-02',
      ]);
    });

    it('crosses a year boundary correctly', () => {
      expect(iterateCalendarDates('2026-12-31', '2027-01-02')).toEqual([
        '2026-12-31',
        '2027-01-01',
        '2027-01-02',
      ]);
    });

    it('handles February in a leap year', () => {
      expect(iterateCalendarDates('2028-02-28', '2028-03-01')).toEqual([
        '2028-02-28',
        '2028-02-29',
        '2028-03-01',
      ]);
    });

    it('returns empty for a reversed range', () => {
      expect(iterateCalendarDates('2026-08-20', '2026-08-14')).toEqual([]);
    });
  });

  describe('validateDateString', () => {
    it('returns the Malaysia calendar date when value is omitted', () => {
      const result = validateDateString(undefined, 'date');
      expect(result).toBe(localToday());
    });

    it('preserves an explicit valid date', () => {
      expect(validateDateString('2026-08-14', 'date')).toBe('2026-08-14');
    });

    it('rejects malformed date', () => {
      expect(() => validateDateString('14/08/2026', 'date')).toThrow(/YYYY-MM-DD/);
    });

    it('rejects non-date garbage that matches format', () => {
      expect(() => validateDateString('2026-99-99', 'date')).toThrow(/tarikh yang sah/);
    });
  });
});
