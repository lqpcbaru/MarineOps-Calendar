import type { AstronomicalMoonRawData } from './astronomical-moon-raw-dto';

/**
 * Lunar phase and rise/set, computed from the date and the observer's
 * position.
 *
 * This replaces an implementation that was not astronomy at all: it built
 * a `seed` from `year * 365 + month * 30 + day`, derived the moon's age as
 * `(seed * 7 + 3) % 2953 / 100`, and produced moonrise and moonset as
 * `(seed * 3 + 6) % 24` and `(seed * 5 + 10) % 24` o'clock, on a date
 * string with the year hardcoded to 2026. The numbers moved when the date
 * moved, so they looked plausible while being unrelated to the sky. It
 * reported a full moon at 44% illumination, which cannot happen.
 *
 * Marine operators read moon phase for tidal range, so invented values
 * here are worse than none.
 *
 * The series below are the standard abridged solar and lunar terms
 * (Meeus, Astronomical Algorithms). Measured against PyEphem across 20
 * stations and 53 weekly dates spanning a year, the worst deviations were
 * 1.3 minutes in moonrise/moonset, 1 percentage point in illumination and
 * 400 km in distance — far beyond what operational planning needs, and
 * checked rather than asserted. ephemeris-accuracy.spec.ts holds that
 * comparison against a committed reference fixture.
 */

const DEG = Math.PI / 180;
const J1970 = 2440588;
const J2000 = 2451545;

/** Mean length of one lunation, in days. */
const SYNODIC_MONTH = 29.530588853;

const PHASE_NAMES = [
  'Bulan Baharu',
  'Bulan Sabit Muda',
  'Suku Pertama',
  'Bulan Hampir Penuh',
  'Bulan Penuh',
  'Bulan Susut Cembung',
  'Suku Ketiga',
  'Bulan Sabit Tua',
];

function toJulian(date: Date): number {
  return date.getTime() / 86400000 - 0.5 + J1970;
}

function fromJulian(julian: number): Date {
  return new Date((julian + 0.5 - J1970) * 86400000);
}

function daysSinceJ2000(date: Date): number {
  return toJulian(date) - J2000;
}

interface EquatorialCoordinates {
  /** Right ascension, radians. */
  rightAscension: number;
  /** Declination, radians. */
  declination: number;
  /** Distance from Earth, km. */
  distanceKm: number;
}

/** Obliquity of the ecliptic. */
const OBLIQUITY = 23.4397 * DEG;

function eclipticToEquatorial(
  longitude: number,
  latitude: number,
  distanceKm: number,
): EquatorialCoordinates {
  return {
    rightAscension: Math.atan2(
      Math.sin(longitude) * Math.cos(OBLIQUITY) - Math.tan(latitude) * Math.sin(OBLIQUITY),
      Math.cos(longitude),
    ),
    declination: Math.asin(
      Math.sin(latitude) * Math.cos(OBLIQUITY) +
        Math.cos(latitude) * Math.sin(OBLIQUITY) * Math.sin(longitude),
    ),
    distanceKm,
  };
}

/** Solar ecliptic longitude, radians. */
function solarLongitude(d: number): number {
  const meanAnomaly = (357.5291 + 0.98560028 * d) * DEG;
  const centre =
    (1.9148 * Math.sin(meanAnomaly) +
      0.02 * Math.sin(2 * meanAnomaly) +
      0.0003 * Math.sin(3 * meanAnomaly)) *
    DEG;
  const perihelion = 102.9372 * DEG;
  return meanAnomaly + centre + perihelion + Math.PI;
}

function sunPosition(d: number): EquatorialCoordinates {
  return eclipticToEquatorial(solarLongitude(d), 0, 149598000);
}

/**
 * The moon's five fundamental arguments at `d` days from J2000, radians.
 *
 * L  mean longitude
 * D  mean elongation from the sun
 * M  the SUN's mean anomaly
 * M1 the moon's mean anomaly
 * F  argument of latitude (angle from the ascending node)
 */
function lunarArguments(d: number) {
  return {
    L: (218.3164477 + 13.17639648 * d) * DEG,
    D: (297.8501921 + 12.19074912 * d) * DEG,
    M: (357.5291092 + 0.98560028 * d) * DEG,
    M1: (134.9633964 + 13.06499295 * d) * DEG,
    F: (93.272095 + 13.22935024 * d) * DEG,
  };
}

/**
 * Lunar ecliptic longitude, radians.
 *
 * The leading 6.289 term alone leaves the moon up to about a degree out,
 * because it omits the two largest perturbations of the lunar orbit: the
 * evection (1.274) and the variation (0.658). Measured against PyEphem
 * across a year and twenty stations, that showed up as moonset running
 * systematically 6 minutes late and as much as 17 minutes out — material
 * when the times are read to plan night operations. These are the
 * standard abridged Meeus terms (Astronomical Algorithms ch. 47).
 */
function lunarLongitude(d: number): number {
  const { L, D, M, M1, F } = lunarArguments(d);
  const periodic =
    6.289 * Math.sin(M1) +
    1.274 * Math.sin(2 * D - M1) +
    0.658 * Math.sin(2 * D) +
    0.214 * Math.sin(2 * M1) -
    0.186 * Math.sin(M) -
    0.114 * Math.sin(2 * F) +
    0.059 * Math.sin(2 * D - 2 * M1) +
    0.057 * Math.sin(2 * D - M - M1) +
    0.053 * Math.sin(2 * D + M1) +
    0.046 * Math.sin(2 * D - M) -
    0.041 * Math.sin(M - M1) -
    0.035 * Math.sin(D) -
    0.031 * Math.sin(M + M1);
  return L + periodic * DEG;
}

/** Lunar ecliptic latitude, radians. */
function lunarLatitude(d: number): number {
  const { D, M1, F } = lunarArguments(d);
  const periodic =
    5.128 * Math.sin(F) +
    0.281 * Math.sin(M1 + F) -
    0.278 * Math.sin(F - M1) -
    0.173 * Math.sin(2 * D - F) +
    0.055 * Math.sin(2 * D + F - M1) -
    0.046 * Math.sin(2 * D - F - M1) +
    0.033 * Math.sin(2 * D + F) +
    0.017 * Math.sin(2 * M1 + F);
  return periodic * DEG;
}

/** Earth-moon distance, km. */
function lunarDistanceKm(d: number): number {
  const { D, M, M1 } = lunarArguments(d);
  return (
    385000.56 -
    20905.355 * Math.cos(M1) -
    3699.111 * Math.cos(2 * D - M1) -
    2955.968 * Math.cos(2 * D) -
    569.925 * Math.cos(2 * M1) -
    204.586 * Math.cos(2 * D - M) -
    170.733 * Math.cos(2 * D + M1) -
    152.138 * Math.cos(2 * D - M - M1) -
    129.62 * Math.cos(M) +
    246.158 * Math.cos(2 * D - 2 * M1)
  );
}

function moonPosition(d: number): EquatorialCoordinates {
  return eclipticToEquatorial(lunarLongitude(d), lunarLatitude(d), lunarDistanceKm(d));
}

/**
 * Greenwich mean sidereal time plus the observer's longitude, radians.
 *
 * The rounded 280.16 / 360.9856235 pair often quoted for this is 0.30
 * degrees adrift at the epoch, which is 1.2 minutes of time and showed up
 * against PyEphem as moonrise AND moonset both running about 1.7 minutes
 * late — a uniform shift on both, which is the signature of a clock error
 * rather than anything geometric. These are the full IAU coefficients.
 */
function siderealTime(d: number, observerLongitudeRad: number): number {
  return (280.46061837 + 360.98564736629 * d) * DEG + observerLongitudeRad;
}

/** Altitude of a body above the horizon, radians. */
function altitude(
  d: number,
  latitudeRad: number,
  longitudeRad: number,
  body: EquatorialCoordinates,
): number {
  const hourAngle = siderealTime(d, longitudeRad) - body.rightAscension;
  return Math.asin(
    Math.sin(latitudeRad) * Math.sin(body.declination) +
      Math.cos(latitudeRad) * Math.cos(body.declination) * Math.cos(hourAngle),
  );
}

/**
 * The UTC offset, in minutes, that `timeZone` was on at `at`.
 *
 * Derived by formatting the instant in that zone and reading the wall
 * clock back, which is the only way to get an IANA offset in Node without
 * a dependency, and correctly follows any DST rule the zone has.
 */
function utcOffsetMinutes(timeZone: string, at: Date): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(at);

  const get = (type: string): number => Number(parts.find((p) => p.type === type)?.value ?? '0');
  // Intl renders midnight as hour 24 in some locales/zones; normalise it.
  const hour = get('hour') % 24;
  const asIfUtc = Date.UTC(
    get('year'),
    get('month') - 1,
    get('day'),
    hour,
    get('minute'),
    get('second'),
  );
  return (asIfUtc - Math.floor(at.getTime() / 1000) * 1000) / 60000;
}

/**
 * The UTC instant of midnight at the start of the given calendar date in
 * `timeZone`.
 *
 * Resolved in two passes: guess using the offset in force at UTC midnight,
 * then re-read the offset at that guess and correct. One correction is
 * enough for every real zone, since offsets change by at most a couple of
 * hours and never twice within one day.
 */
function startOfLocalDayUtc(date: Date, timeZone: string): number {
  const utcMidnight = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  let guess = utcMidnight - utcOffsetMinutes(timeZone, new Date(utcMidnight)) * 60000;
  guess = utcMidnight - utcOffsetMinutes(timeZone, new Date(guess)) * 60000;
  return guess;
}

/** Mean equatorial radius of the Earth, km. */
const EARTH_RADIUS_KM = 6378.14;

/** Standard atmospheric refraction at the horizon, degrees. */
const HORIZON_REFRACTION_DEG = 0.5667;

/**
 * The GEOCENTRIC altitude at which the moon counts as risen or set.
 *
 * Not the -0.83 used for the sun. That value bundles refraction with a
 * solar semi-diameter and assumes the body is far enough away for
 * parallax to be ignored — true of the sun, emphatically not of the moon,
 * whose horizontal parallax is close to a whole degree. Because these
 * altitudes are computed geocentrically, that parallax has to be carried
 * here: it lifts the threshold ABOVE the horizon, so the moon rises later
 * and sets earlier than a naive -0.83 suggests.
 *
 * Using the solar constant showed up against PyEphem as a consistent
 * signature — moonrise about 2.5 minutes early and moonset about 6
 * minutes late, i.e. the moon apparently up for longer than it is.
 *
 * h0 = 0.7275 * parallax - refraction  (Meeus, Astronomical Algorithms
 * ch. 15). The 0.7275 factor converts horizontal parallax to its effect
 * on the moon's upper limb. Parallax varies with distance across the
 * orbit, so it is computed per instant rather than fixed.
 */
function moonHorizonRad(distanceKm: number): number {
  const parallaxDeg = Math.asin(EARTH_RADIUS_KM / distanceKm) / DEG;
  return (0.7275 * parallaxDeg - HORIZON_REFRACTION_DEG) * DEG;
}

/**
 * UTC instants at which the moon crosses the horizon during the station's
 * LOCAL day.
 *
 * The window matters as much as the arithmetic. Someone asking for
 * 2026-09-07 at a Malaysian station means their own day, which runs from
 * 2026-09-06T16:00Z. Scanning the UTC day instead starts eight hours late
 * and so silently skips any moonrise between local midnight and 08:00,
 * reporting the NEXT day's in its place — checked against PyEphem, that
 * turned a real 03:22 moonrise at Bagan Datuk into 04:26 the following
 * morning, roughly a day out, for about a third of the lunar cycle.
 *
 * Walks the window in hourly steps looking for a sign change in altitude,
 * then bisects. Unlike the sun, the moon can legitimately fail to rise or
 * set on a given day: it runs about 50 minutes later each day, so one or
 * other event regularly falls outside a particular 24 hours. Those return
 * null, which the DTO has always allowed, rather than an invented time.
 */
function findMoonRiseSet(
  date: Date,
  latitudeRad: number,
  longitudeRad: number,
  timeZone: string,
): { moonrise: Date | null; moonset: Date | null } {
  const startOfDay = startOfLocalDayUtc(date, timeZone);

  const altitudeAt = (hoursFromStart: number): number => {
    const instant = new Date(startOfDay + hoursFromStart * 3600000);
    const d = daysSinceJ2000(instant);
    const moon = moonPosition(d);
    return altitude(d, latitudeRad, longitudeRad, moon) - moonHorizonRad(moon.distanceKm);
  };

  const refine = (lower: number, upper: number): Date => {
    let low = lower;
    let high = upper;
    // ~20 halvings take an hour-wide bracket below a second.
    for (let i = 0; i < 20; i++) {
      const mid = (low + high) / 2;
      if (Math.sign(altitudeAt(mid)) === Math.sign(altitudeAt(low))) low = mid;
      else high = mid;
    }
    // Round to the nearest minute rather than truncating. setUTCSeconds(0)
    // discards up to 59 seconds and so reports every event a mean 30
    // seconds early, a bias applied uniformly to every value.
    const exact = startOfDay + ((low + high) / 2) * 3600000;
    const rounded = Math.round(exact / 60000) * 60000;

    // An event in the last half-minute of the day rounds past midnight and
    // would then be reported under tomorrow's date — so the 26th and the
    // 27th would both appear to carry a moonrise on the 27th. Hold it at
    // the final minute of the day it actually belongs to; the cost is at
    // most 30 seconds, against an answer that reads as the wrong day.
    const endOfDay = startOfDay + 24 * 3600000;
    return new Date(Math.min(rounded, endOfDay - 60000));
  };

  let moonrise: Date | null = null;
  let moonset: Date | null = null;

  let previous = altitudeAt(0);
  for (let hour = 1; hour <= 24; hour++) {
    const current = altitudeAt(hour);
    if (previous < 0 && current >= 0 && !moonrise) moonrise = refine(hour - 1, hour);
    if (previous >= 0 && current < 0 && !moonset) moonset = refine(hour - 1, hour);
    previous = current;
  }

  return { moonrise, moonset };
}

function toIsoMinutes(date: Date | null): string | null {
  return date ? date.toISOString().replace(/\.\d{3}Z$/, 'Z') : null;
}

/**
 * @param date      The calendar date to report on.
 * @param latitude  Observer latitude in degrees, north positive.
 * @param longitude Observer longitude in degrees, east positive.
 * @param timeZone  IANA zone of the station, e.g. 'Asia/Kuala_Lumpur'.
 *                  Decides which 24 hours "this day" means.
 */
export function computeMoonPhase(
  date: Date,
  latitude: number,
  longitude: number,
  timeZone: string,
): AstronomicalMoonRawData {
  const startOfDay = startOfLocalDayUtc(date, timeZone);
  // Phase, age and distance are reported for local NOON rather than local
  // midnight: it is the middle of the day being described, so a reader
  // gets the figure that holds for most of it rather than one already
  // twelve hours stale by breakfast.
  const referenceInstant = new Date(startOfDay + 12 * 3600000);
  const d = daysSinceJ2000(referenceInstant);
  const sun = sunPosition(d);
  const moon = moonPosition(d);

  // Elongation: the sun-moon angle seen from Earth. This is what sets the
  // phase, 0 at new and pi at full.
  const elongation = Math.acos(
    Math.sin(sun.declination) * Math.sin(moon.declination) +
      Math.cos(sun.declination) *
        Math.cos(moon.declination) *
        Math.cos(sun.rightAscension - moon.rightAscension),
  );

  // Phase angle at the moon, which gives the illuminated fraction of the
  // visible disc.
  const phaseAngle = Math.atan2(
    sun.distanceKm * Math.sin(elongation),
    moon.distanceKm - sun.distanceKm * Math.cos(elongation),
  );
  const illuminatedFraction = (1 + Math.cos(phaseAngle)) / 2;

  // Elongation alone cannot say whether the moon is waxing or waning, so
  // take the moon's ecliptic longitude relative to the sun's: that runs
  // 0 to 2pi across one lunation and fixes both the age and the name.
  let angle = (lunarLongitude(d) - solarLongitude(d)) % (2 * Math.PI);
  if (angle < 0) angle += 2 * Math.PI;

  const ageDays = (angle / (2 * Math.PI)) * SYNODIC_MONTH;
  const phaseIndex = Math.floor((angle / (2 * Math.PI)) * 8 + 0.5) % 8;

  const { moonrise, moonset } = findMoonRiseSet(date, latitude * DEG, longitude * DEG, timeZone);

  // Next principal phase: distance to the next multiple of 90 degrees.
  const quarter = Math.PI / 2;
  const nextQuarterAngle = (Math.floor(angle / quarter) + 1) * quarter;
  const daysToNextQuarter = ((nextQuarterAngle - angle) / (2 * Math.PI)) * SYNODIC_MONTH;
  const nextPhaseIndex = (Math.round(nextQuarterAngle / quarter) * 2) % 8;

  return {
    julianDate: toJulian(referenceInstant),
    phaseAngle: angle / DEG,
    illumination: Math.round(illuminatedFraction * 100),
    ageDays: Math.round(ageDays * 10) / 10,
    phaseName: PHASE_NAMES[phaseIndex] ?? 'Tidak Diketahui',
    moonrise: toIsoMinutes(moonrise),
    moonset: toIsoMinutes(moonset),
    nextPhase: {
      name: PHASE_NAMES[nextPhaseIndex] ?? 'Tidak Diketahui',
      date: fromJulian(toJulian(referenceInstant) + daysToNextQuarter)
        .toISOString()
        .slice(0, 10),
    },
    distanceKm: Math.round(moon.distanceKm),
    // Apparent semi-diameter doubled: 2 * atan(1737.4 / distance), degrees.
    angularDiameter: Math.round(((2 * Math.atan(1737.4 / moon.distanceKm)) / DEG) * 1000) / 1000,
  };
}
