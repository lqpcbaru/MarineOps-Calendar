import { describe, expect, it } from 'vitest';
import { computeSunData } from './sun-engine';
import { computeMoonPhase } from '../../../moon/infrastructure/astronomical/moon-engine';
import reference from './__fixtures__/ephemeris-reference.json';

/**
 * Accuracy of both astronomical engines against independently computed
 * reference values.
 *
 * `__fixtures__/ephemeris-reference.json` was produced with PyEphem
 * (XEphem's VSOP87/ELP2000 implementation) — a separate, established
 * library, not this code and not hand-written numbers. It covers six
 * stations spanning the country's full extent, from Langkawi in the
 * north-west to Tawau in the east, on dates chosen to exercise where date
 * arithmetic tends to break: both solstices, a year boundary, a leap day
 * and the days either side of it, and a new and a full moon.
 *
 * Both engines are deliberately low-precision series. The point of the
 * bounds below is not to chase arc-seconds but to catch the class of
 * error that has actually occurred in this file's history — an inverted
 * longitude sign, a day window scanned in the wrong timezone, a horizon
 * constant borrowed from the wrong body. Each of those moved results by
 * tens of minutes to tens of hours, far outside any tolerance here.
 *
 * Measured across 20 stations x 53 weekly dates spanning a year, the
 * worst observed deviations were 1.6 min (sun), 1.3 min (moon rise/set),
 * 1 percentage point (illumination) and 400 km (distance).
 */

/** Every Malaysian station is UTC+8 year-round; there is no DST. */
const TIMEZONE = 'Asia/Kuala_Lumpur';

const TIME_TOLERANCE_MINUTES = 4;
const ILLUMINATION_TOLERANCE_PERCENT = 3;
const DISTANCE_TOLERANCE_KM = 2000;

interface ReferenceDay {
  sunrise: string;
  sunset: string;
  solarNoon: string;
  moonrise: string | null;
  moonset: string | null;
  illumination: number;
  distanceKm: number;
}

interface ReferenceStation {
  latitude: number;
  longitude: number;
  days: Record<string, ReferenceDay>;
}

const stations = reference as unknown as Record<string, ReferenceStation>;

interface Sample {
  label: string;
  expected: ReferenceDay;
  sun: ReturnType<typeof computeSunData>;
  moon: ReturnType<typeof computeMoonPhase>;
}

const samples: Sample[] = Object.entries(stations).flatMap(([code, station]) =>
  Object.entries(station.days).map(([day, expected]) => {
    const date = new Date(`${day}T00:00:00Z`);
    return {
      label: `${code} ${day}`,
      expected,
      sun: computeSunData(station.latitude, station.longitude, date),
      moon: computeMoonPhase(date, station.latitude, station.longitude, TIMEZONE),
    };
  }),
);

function minutesApart(actual: string, expected: string): number {
  return Math.abs(new Date(actual).getTime() - new Date(expected).getTime()) / 60000;
}

/**
 * Collects EVERY deviation before failing, so one run shows the whole
 * pattern — a uniform offset, a single station, one date — rather than
 * whichever sample happened to be checked first.
 */
function expectAllWithin(
  metric: string,
  tolerance: number,
  unit: string,
  measure: (s: Sample) => number | null,
): void {
  const failures = samples
    .map((s) => ({ label: s.label, delta: measure(s) }))
    .filter((r): r is { label: string; delta: number } => r.delta !== null && r.delta > tolerance)
    .map((r) => `${r.label}: off by ${r.delta.toFixed(1)}${unit}`);

  expect(
    failures,
    `${metric} outside ${tolerance}${unit} for ${failures.length} sample(s)`,
  ).toEqual([]);
}

/**
 * An event landing within a minute of local midnight can legitimately be
 * attributed to either day, so presence agreement is only asserted when
 * the reference is clear of that boundary.
 */
function nearLocalMidnight(iso: string | null): boolean {
  if (!iso) return false;
  const localMinutes = (new Date(iso).getTime() / 60000 + 8 * 60) % (24 * 60);
  return localMinutes < 2 || localMinutes > 24 * 60 - 2;
}

describe('ephemeris accuracy against PyEphem', () => {
  it('covers every station and date in the fixture', () => {
    expect(samples.length).toBeGreaterThanOrEqual(60);
  });

  it('computes sunrise within tolerance', () => {
    expectAllWithin('sunrise', TIME_TOLERANCE_MINUTES, 'min', (s) =>
      minutesApart(s.sun.sunrise, s.expected.sunrise),
    );
  });

  it('computes sunset within tolerance', () => {
    expectAllWithin('sunset', TIME_TOLERANCE_MINUTES, 'min', (s) =>
      minutesApart(s.sun.sunset, s.expected.sunset),
    );
  });

  it('computes solar noon within tolerance', () => {
    expectAllWithin('solarNoon', TIME_TOLERANCE_MINUTES, 'min', (s) =>
      minutesApart(s.sun.solarNoon, s.expected.solarNoon),
    );
  });

  it('computes moon illumination within tolerance', () => {
    expectAllWithin('illumination', ILLUMINATION_TOLERANCE_PERCENT, '%', (s) =>
      Math.abs(s.moon.illumination - s.expected.illumination),
    );
  });

  it('computes the earth-moon distance within tolerance', () => {
    expectAllWithin('distanceKm', DISTANCE_TOLERANCE_KM, 'km', (s) =>
      Math.abs(s.moon.distanceKm - s.expected.distanceKm),
    );
  });

  // Whether a rise or set falls inside a given local day is as much a part
  // of being correct as the time itself: scanning the UTC day rather than
  // the station's own day silently substituted the following day's
  // moonrise for roughly a third of the lunar cycle.
  it('computes moonrise within tolerance, on the right local day', () => {
    expectAllWithin('moonrise', TIME_TOLERANCE_MINUTES, 'min', (s) => {
      if (!s.expected.moonrise || nearLocalMidnight(s.expected.moonrise)) return null;
      if (!s.moon.moonrise) return Number.POSITIVE_INFINITY;
      return minutesApart(s.moon.moonrise, s.expected.moonrise);
    });
  });

  it('computes moonset within tolerance, on the right local day', () => {
    expectAllWithin('moonset', TIME_TOLERANCE_MINUTES, 'min', (s) => {
      if (!s.expected.moonset || nearLocalMidnight(s.expected.moonset)) return null;
      if (!s.moon.moonset) return Number.POSITIVE_INFINITY;
      return minutesApart(s.moon.moonset, s.expected.moonset);
    });
  });

  it('reports no moonrise or moonset on days that genuinely have none', () => {
    const failures = samples.flatMap((s) => {
      const out: string[] = [];
      if (s.expected.moonrise === null && s.moon.moonrise !== null) {
        out.push(`${s.label}: invented a moonrise at ${s.moon.moonrise}`);
      }
      if (s.expected.moonset === null && s.moon.moonset !== null) {
        out.push(`${s.label}: invented a moonset at ${s.moon.moonset}`);
      }
      return out;
    });
    expect(failures).toEqual([]);
  });
});
