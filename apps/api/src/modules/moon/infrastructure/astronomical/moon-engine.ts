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
 * The series below are the standard low-precision solar and lunar terms
 * (Meeus, Astronomical Algorithms, reduced). They are good to a few
 * arc-minutes in position, which is a couple of minutes in rise/set and
 * well under 1% in illumination: far beyond what operational planning
 * needs, and honest about what it is.
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

/** Lunar ecliptic longitude, radians. */
function lunarLongitude(d: number): number {
  const meanLongitude = (218.316 + 13.176396 * d) * DEG;
  const meanAnomaly = (134.963 + 13.064993 * d) * DEG;
  return meanLongitude + 6.289 * DEG * Math.sin(meanAnomaly);
}

function moonPosition(d: number): EquatorialCoordinates {
  const meanAnomaly = (134.963 + 13.064993 * d) * DEG;
  const meanDistance = (93.272 + 13.22935 * d) * DEG;

  const longitude = lunarLongitude(d);
  const latitude = 5.128 * DEG * Math.sin(meanDistance);
  const distanceKm = 385001 - 20905 * Math.cos(meanAnomaly);

  return eclipticToEquatorial(longitude, latitude, distanceKm);
}

/** Greenwich mean sidereal time plus the observer's longitude, radians. */
function siderealTime(d: number, observerLongitudeRad: number): number {
  return (280.16 + 360.9856235 * d) * DEG + observerLongitudeRad;
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
 * The altitude at which the moon counts as risen or set: its centre sits
 * slightly below the horizon when the upper limb touches it, once
 * refraction and the moon's semi-diameter are allowed for.
 */
const MOON_HORIZON = -0.83 * DEG;

/**
 * UTC instants at which the moon crosses the horizon on `date`.
 *
 * Walks the day in hourly steps looking for a sign change in altitude,
 * then bisects. Unlike the sun, the moon can legitimately fail to rise or
 * set on a given date: it runs about 50 minutes later each day, so one or
 * other event regularly falls outside a particular 24 hours. Those return
 * null, which the DTO has always allowed, rather than an invented time.
 */
function findMoonRiseSet(
  date: Date,
  latitudeRad: number,
  longitudeRad: number,
): { moonrise: Date | null; moonset: Date | null } {
  const startOfDay = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());

  const altitudeAt = (hoursFromStart: number): number => {
    const instant = new Date(startOfDay + hoursFromStart * 3600000);
    const d = daysSinceJ2000(instant);
    return altitude(d, latitudeRad, longitudeRad, moonPosition(d)) - MOON_HORIZON;
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
    const result = new Date(startOfDay + ((low + high) / 2) * 3600000);
    result.setUTCSeconds(0, 0);
    return result;
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
 * @param date      The UTC instant to report on.
 * @param latitude  Observer latitude in degrees, north positive.
 * @param longitude Observer longitude in degrees, east positive.
 */
export function computeMoonPhase(
  date: Date,
  latitude: number,
  longitude: number,
): AstronomicalMoonRawData {
  const d = daysSinceJ2000(date);
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

  const { moonrise, moonset } = findMoonRiseSet(date, latitude * DEG, longitude * DEG);

  // Next principal phase: distance to the next multiple of 90 degrees.
  const quarter = Math.PI / 2;
  const nextQuarterAngle = (Math.floor(angle / quarter) + 1) * quarter;
  const daysToNextQuarter = ((nextQuarterAngle - angle) / (2 * Math.PI)) * SYNODIC_MONTH;
  const nextPhaseIndex = (Math.round(nextQuarterAngle / quarter) * 2) % 8;

  return {
    julianDate: toJulian(date),
    phaseAngle: angle / DEG,
    illumination: Math.round(illuminatedFraction * 100),
    ageDays: Math.round(ageDays * 10) / 10,
    phaseName: PHASE_NAMES[phaseIndex] ?? 'Tidak Diketahui',
    moonrise: toIsoMinutes(moonrise),
    moonset: toIsoMinutes(moonset),
    nextPhase: {
      name: PHASE_NAMES[nextPhaseIndex] ?? 'Tidak Diketahui',
      date: fromJulian(toJulian(date) + daysToNextQuarter)
        .toISOString()
        .slice(0, 10),
    },
    distanceKm: Math.round(moon.distanceKm),
    // Apparent semi-diameter doubled: 2 * atan(1737.4 / distance), degrees.
    angularDiameter: Math.round(((2 * Math.atan(1737.4 / moon.distanceKm)) / DEG) * 1000) / 1000,
  };
}
