import { describe, expect, it } from 'vitest';
import { AstronomicalMoonProvider } from './astronomical-moon.provider';

describe('AstronomicalMoonProvider', () => {
  it('returns MoonDataPoint for a station and date', async () => {
    const provider = new AstronomicalMoonProvider();
    const result = await provider.getMoonPhase('st-001', '2026-08-06');
    expect(result.date).toBe('2026-08-06');
    expect(result.phaseName).toBeDefined();
    expect(result.illumination).toBeGreaterThanOrEqual(0);
    expect(result.ageDays).toBeGreaterThan(0);
    expect(result.moonrise).toBeDefined();
    expect(result.moonset).toBeDefined();
  });

  it('returns different phases for different dates', async () => {
    const provider = new AstronomicalMoonProvider();
    const a = await provider.getMoonPhase('st-001', '2026-08-01');
    const b = await provider.getMoonPhase('st-001', '2026-08-29');
    expect(a.phaseName).not.toBe(b.phaseName);
  });

  it('tracks metrics on success', async () => {
    const provider = new AstronomicalMoonProvider();
    await provider.getMoonPhase('st-001', '2026-08-06');
    expect(provider.getMetrics().getState().successfulRequests).toBeGreaterThanOrEqual(1);
  });

  it('health starts online', () => {
    const provider = new AstronomicalMoonProvider();
    expect(provider.getHealth().isOnline()).toBe(true);
  });
});
