import { describe, expect, it } from 'vitest';
import { computeSunData } from './sun-engine';

/** Malaysia is UTC+8 year-round, with no daylight saving. */
const MYT_OFFSET_HOURS = 8;

function toMytHhMm(iso: string): string {
  const d = new Date(iso);
  d.setUTCHours(d.getUTCHours() + MYT_OFFSET_HOURS);
  return d.toISOString().slice(11, 16);
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h! * 60 + m!;
}

/**
 * Reference sunrise/sunset in local Malaysian time for 2026-09-04,
 * from the NOAA sunrise/sunset algorithm.
 *
 * These pin down a real defect. `solarNoonHours` was computed as
 * `12 + longitude / 15`, but solar noon in UTC is 12:00 MINUS
 * longitude/15 for east-positive longitude — the sun peaks EARLIER in UTC
 * the further east you are. At Malaysian longitudes that inverted the day
 * by roughly 2 x 101/15 = 13.5 hours: the portal displayed sunrise at
 * 20:41 and sunset at 08:50 for Port Klang, on a page whose whole purpose
 * is planning operations within daylight.
 */
const REFERENCE = [
  { name: 'Port Klang', latitude: 3.0033, longitude: 101.3925, sunrise: '07:10', sunset: '19:20' },
  { name: 'Kuching', latitude: 1.5535, longitude: 110.3593, sunrise: '06:35', sunset: '18:43' },
  { name: 'Kudat', latitude: 6.8833, longitude: 116.8333, sunrise: '06:06', sunset: '18:20' },
  { name: 'Langkawi', latitude: 6.35, longitude: 99.8, sunrise: '07:14', sunset: '19:28' },
];

const DATE = new Date('2026-09-04T00:00:00Z');

// The declination and equation-of-time terms here are the low-precision
// forms, so a few minutes of drift from NOAA is expected and fine. Ten
// minutes is comfortably inside that while still failing loudly on any
// sign or offset error, which is the class of bug that actually occurred.
const TOLERANCE_MINUTES = 10;

describe('computeSunData', () => {
  for (const station of REFERENCE) {
    describe(station.name, () => {
      const result = computeSunData(station.latitude, station.longitude, DATE);

      it('puts sunrise within tolerance of the NOAA reference', () => {
        const delta = Math.abs(toMinutes(toMytHhMm(result.sunrise)) - toMinutes(station.sunrise));
        expect(delta).toBeLessThanOrEqual(TOLERANCE_MINUTES);
      });

      it('puts sunset within tolerance of the NOAA reference', () => {
        const delta = Math.abs(toMinutes(toMytHhMm(result.sunset)) - toMinutes(station.sunset));
        expect(delta).toBeLessThanOrEqual(TOLERANCE_MINUTES);
      });

      // The blunt sanity check the original code would have failed: near
      // the equator the sun rises in the morning and sets in the evening.
      it('rises in the morning and sets in the evening, local time', () => {
        const rise = toMinutes(toMytHhMm(result.sunrise));
        const set = toMinutes(toMytHhMm(result.sunset));
        expect(rise).toBeGreaterThan(toMinutes('05:00'));
        expect(rise).toBeLessThan(toMinutes('08:00'));
        expect(set).toBeGreaterThan(toMinutes('17:00'));
        expect(set).toBeLessThan(toMinutes('20:00'));
      });
    });
  }

  it('gives eastern stations an earlier sunrise than western ones', () => {
    const kudat = computeSunData(6.8833, 116.8333, DATE);
    const langkawi = computeSunData(6.35, 99.8, DATE);
    expect(new Date(kudat.sunrise).getTime()).toBeLessThan(new Date(langkawi.sunrise).getTime());
  });

  it('reports a daylight duration consistent with sunrise and sunset', () => {
    const r = computeSunData(3.0033, 101.3925, DATE);
    const spanMinutes = (new Date(r.sunset).getTime() - new Date(r.sunrise).getTime()) / 60000;
    expect(Math.abs(spanMinutes - r.dayLengthMinutes)).toBeLessThanOrEqual(2);
  });

  // Day-of-year used to be derived from a UTC timestamp minus a LOCAL
  // new Date(year, 0, 0), so the result depended on the server's timezone.
  it('does not depend on the host timezone for a UTC instant', () => {
    const a = computeSunData(3.0033, 101.3925, new Date('2026-09-04T00:00:00Z'));
    const b = computeSunData(3.0033, 101.3925, new Date('2026-09-04T23:59:00Z'));
    expect(a.sunrise).toBe(b.sunrise);
  });
});
