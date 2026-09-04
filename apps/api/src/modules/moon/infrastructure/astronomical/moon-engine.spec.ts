import { describe, expect, it } from 'vitest';
import { computeMoonPhase } from './moon-engine';

/** Pelabuhan Klang — the reference observer for these cases. */
const LATITUDE = 3.0033;
const LONGITUDE = 101.3925;
const MYT_OFFSET_HOURS = 8;

function at(date: string) {
  return computeMoonPhase(new Date(`${date}T12:00:00Z`), LATITUDE, LONGITUDE);
}

function mytHour(iso: string | null): number | null {
  if (!iso) return null;
  const d = new Date(iso);
  d.setUTCHours(d.getUTCHours() + MYT_OFFSET_HOURS);
  return d.getUTCHours() + d.getUTCMinutes() / 60;
}

/**
 * The engine these replace was not astronomy: it derived the moon's age
 * from `(year * 365 + month * 30 + day) * 7 + 3) % 2953 / 100` and
 * produced rise/set as `(seed * 3 + 6) % 24` o'clock. The tests it passed
 * asked only whether illumination fell between 0 and 100 and whether two
 * different dates differed — both true of invented numbers, which is why
 * a full moon reported at 44% illumination survived.
 *
 * These assert against the actual sky instead: real 2026 lunation dates,
 * and the geometric relationships that hold for any correct computation.
 */
describe('computeMoonPhase', () => {
  describe('known 2026 lunations', () => {
    // New and full moon dates for 2026 from published lunation tables.
    const NEW_MOONS = ['2026-08-12', '2026-09-11'];
    const FULL_MOONS = ['2026-08-28', '2026-09-26'];

    for (const date of NEW_MOONS) {
      it(`reports a new moon on ${date}`, () => {
        const result = at(date);
        expect(result.illumination).toBeLessThanOrEqual(2);
        expect(result.phaseName).toBe('Bulan Baharu');
      });
    }

    for (const date of FULL_MOONS) {
      it(`reports a full moon on ${date}`, () => {
        const result = at(date);
        expect(result.illumination).toBeGreaterThanOrEqual(98);
        expect(result.phaseName).toBe('Bulan Penuh');
      });
    }
  });

  // The single check that would have caught the old engine outright.
  it('never reports a full moon at partial illumination', () => {
    for (let day = 1; day <= 28; day++) {
      const result = at(`2026-09-${String(day).padStart(2, '0')}`);
      if (result.phaseName === 'Bulan Penuh') {
        expect(result.illumination).toBeGreaterThanOrEqual(95);
      }
      if (result.phaseName === 'Bulan Baharu') {
        expect(result.illumination).toBeLessThanOrEqual(5);
      }
    }
  });

  // Geometry, not tables: a full moon is opposite the sun, so it rises as
  // the sun sets and sets as the sun rises. Near the equator that puts
  // moonrise in the evening and moonset the following morning.
  it('has the full moon rise in the evening and set in the morning', () => {
    const full = at('2026-08-28');
    const rise = mytHour(full.moonrise);
    const set = mytHour(full.moonset);
    expect(rise).not.toBeNull();
    expect(set).not.toBeNull();
    expect(rise!).toBeGreaterThan(17);
    expect(set!).toBeLessThan(11);
  });

  // A new moon travels with the sun, so it rises in the morning.
  it('has the new moon rise around sunrise', () => {
    const newMoon = at('2026-09-11');
    const rise = mytHour(newMoon.moonrise);
    expect(rise).not.toBeNull();
    expect(rise!).toBeGreaterThan(5);
    expect(rise!).toBeLessThan(10);
  });

  it('advances the moon roughly 50 minutes later each day', () => {
    const first = mytHour(at('2026-09-04').moonrise);
    const second = mytHour(at('2026-09-05').moonrise);
    expect(first).not.toBeNull();
    expect(second).not.toBeNull();
    const delayMinutes = (second! - first!) * 60;
    expect(delayMinutes).toBeGreaterThan(20);
    expect(delayMinutes).toBeLessThan(90);
  });

  it('completes one cycle of ages across a synodic month', () => {
    // Age wraps at the new moon, so a moment just BEFORE one reads ~29.5
    // rather than ~0 — the same point in the cycle from the other side.
    // 2026-08-12 noon UTC falls shortly before that new moon.
    const nearNew = at('2026-08-12').ageDays;
    expect(Math.min(nearNew, 29.53 - nearNew)).toBeLessThan(1.5);

    const nearFull = at('2026-08-27').ageDays;
    expect(nearFull).toBeGreaterThan(12);
    expect(nearFull).toBeLessThan(17);
  });

  it('keeps the distance within the real lunar orbit', () => {
    for (const date of ['2026-08-12', '2026-08-28', '2026-09-11', '2026-09-26']) {
      const { distanceKm } = at(date);
      expect(distanceKm).toBeGreaterThan(356000);
      expect(distanceKm).toBeLessThan(407000);
    }
  });

  // Rise and set depend on the observer, which the old engine ignored
  // entirely — it took only a date.
  it('gives different rise times at different longitudes', () => {
    const klang = computeMoonPhase(new Date('2026-09-04T12:00:00Z'), 3.0033, 101.3925);
    const kudat = computeMoonPhase(new Date('2026-09-04T12:00:00Z'), 6.8833, 116.8333);
    expect(klang.moonrise).not.toBe(kudat.moonrise);
  });

  it('is deterministic for the same inputs', () => {
    expect(at('2026-09-04')).toEqual(at('2026-09-04'));
  });

  // The moon runs later each day, so on some dates one of the two events
  // genuinely falls outside the 24 hours. Null is the honest answer; the
  // DTO has always allowed it.
  it('returns null rather than inventing a missing rise or set', () => {
    let sawNull = false;
    for (let day = 1; day <= 31; day++) {
      const result = at(`2026-08-${String(day).padStart(2, '0')}`);
      if (result.moonrise === null || result.moonset === null) sawNull = true;
      for (const value of [result.moonrise, result.moonset]) {
        if (value !== null) expect(value).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
      }
    }
    expect(sawNull).toBe(true);
  });
});
