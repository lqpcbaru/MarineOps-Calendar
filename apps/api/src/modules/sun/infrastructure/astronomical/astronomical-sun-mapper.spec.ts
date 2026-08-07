import { describe, expect, it } from 'vitest';
import { mapSunData } from './astronomical-sun-mapper';
import { computeSunData } from './sun-engine';
import type { AstronomicalSunRawData } from './astronomical-sun-raw-dto';

describe('AstronomicalSunMapper', () => {
  it('maps raw data to SunDataPoint', () => {
    const raw: AstronomicalSunRawData = {
      date: '2026-08-06',
      sunrise: '2026-08-06T06:30:00Z',
      sunset: '2026-08-06T18:45:00Z',
      solarNoon: '2026-08-06T12:37:30Z',
      daylightDuration: 'PT12H15M',
      civilTwilightBegin: '2026-08-06T06:00:00Z',
      civilTwilightEnd: '2026-08-06T19:15:00Z',
      nauticalTwilightBegin: null,
      nauticalTwilightEnd: null,
      astronomicalTwilightBegin: null,
      astronomicalTwilightEnd: null,
      solarDeclination: 16.5,
      dayLengthMinutes: 735,
    };
    const result = mapSunData(raw);
    expect(result.date).toBe('2026-08-06');
    expect(result.sunrise).toBe('2026-08-06T06:30:00Z');
    expect(result.sunset).toBe('2026-08-06T18:45:00Z');
    expect(result.solarNoon).toBe('2026-08-06T12:37:30Z');
    expect(result.daylightDuration).toBe('PT12H15M');
  });
});

describe('SunEngine', () => {
  it('produces deterministic output', () => {
    const a = computeSunData(3.0, 101.0, new Date('2026-08-06'));
    const b = computeSunData(3.0, 101.0, new Date('2026-08-06'));
    expect(a).toEqual(b);
  });

  it('returns valid sunrise before sunset', () => {
    const result = computeSunData(3.0, 101.0, new Date('2026-08-06'));
    const sunrise = new Date(result.sunrise).getTime();
    const sunset = new Date(result.sunset).getTime();
    expect(sunrise).toBeLessThan(sunset);
  });

  it('returns positive day length', () => {
    const result = computeSunData(3.0, 101.0, new Date('2026-08-06'));
    expect(result.dayLengthMinutes).toBeGreaterThan(0);
  });

  it('different latitudes produce different results', () => {
    const equatorial = computeSunData(0, 101.0, new Date('2026-08-06'));
    const northern = computeSunData(60, 101.0, new Date('2026-08-06'));
    expect(equatorial.dayLengthMinutes).not.toBe(northern.dayLengthMinutes);
  });

  it('different dates produce different results', () => {
    const summer = computeSunData(3.0, 101.0, new Date('2026-06-21'));
    const winter = computeSunData(3.0, 101.0, new Date('2026-12-21'));
    expect(summer.dayLengthMinutes).not.toBe(winter.dayLengthMinutes);
  });
});
