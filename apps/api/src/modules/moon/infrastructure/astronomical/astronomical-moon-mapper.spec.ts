import { describe, expect, it } from 'vitest';
import { mapMoonData } from './astronomical-moon-mapper';
import { computeMoonPhase } from './moon-engine';
import type { AstronomicalMoonRawData } from './astronomical-moon-raw-dto';

describe('AstronomicalMoonMapper', () => {
  it('maps raw data to MoonDataPoint', () => {
    const raw: AstronomicalMoonRawData = {
      julianDate: 2459200,
      phaseAngle: 180,
      illumination: 100,
      ageDays: 14.5,
      phaseName: 'Bulan Penuh',
      moonrise: '2026-08-06T18:30:00Z',
      moonset: '2026-08-07T06:00:00Z',
      nextPhase: { name: 'Suku Ketiga', date: '2026-08-13' },
      distanceKm: 384400,
      angularDiameter: 0.52,
    };
    const result = mapMoonData(raw, '2026-08-06');
    expect(result.date).toBe('2026-08-06');
    expect(result.phaseName).toBe('Bulan Penuh');
    expect(result.illumination).toBe(100);
    expect(result.ageDays).toBe(14.5);
    expect(result.moonrise).toBe('2026-08-06T18:30:00Z');
    expect(result.moonset).toBe('2026-08-07T06:00:00Z');
  });
});

describe('MoonEngine', () => {
  it('produces deterministic output', () => {
    const a = computeMoonPhase(new Date('2026-08-06'), 3.0033, 101.3925);
    const b = computeMoonPhase(new Date('2026-08-06'), 3.0033, 101.3925);
    expect(a).toEqual(b);
  });

  it('returns valid phase name', () => {
    const result = computeMoonPhase(new Date('2026-08-06'), 3.0033, 101.3925);
    expect([
      'Bulan Baharu',
      'Bulan Sabit Muda',
      'Suku Pertama',
      'Bulan Hampir Penuh',
      'Bulan Penuh',
      'Suku Ketiga',
      'Bulan Sabit Tua',
      'Tidak Diketahui',
    ]).toContain(result.phaseName);
  });

  it('returns illumination between 0-100', () => {
    const result = computeMoonPhase(new Date('2026-08-06'), 3.0033, 101.3925);
    expect(result.illumination).toBeGreaterThanOrEqual(0);
    expect(result.illumination).toBeLessThanOrEqual(100);
  });

  it('returns positive age in days', () => {
    const result = computeMoonPhase(new Date('2026-08-06'), 3.0033, 101.3925);
    expect(result.ageDays).toBeGreaterThan(0);
    expect(result.ageDays).toBeLessThan(30);
  });

  it('different dates produce different results', () => {
    const a = computeMoonPhase(new Date('2026-08-01'), 3.0033, 101.3925);
    const b = computeMoonPhase(new Date('2026-08-29'), 3.0033, 101.3925);
    expect(a.phaseName).not.toBe(b.phaseName);
  });
});
