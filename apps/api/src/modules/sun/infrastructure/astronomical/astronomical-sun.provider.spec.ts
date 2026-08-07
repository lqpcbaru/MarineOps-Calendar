import { describe, expect, it } from 'vitest';
import { AstronomicalSunProvider } from './astronomical-sun.provider';

describe('AstronomicalSunProvider', () => {
  it('returns SunDataPoint for a station and date', async () => {
    const provider = new AstronomicalSunProvider();
    const result = await provider.getSunData('st-001', '2026-08-06');
    expect(result.date).toBe('2026-08-06');
    expect(result.sunrise).toBeDefined();
    expect(result.sunset).toBeDefined();
    expect(result.solarNoon).toBeDefined();
    expect(result.daylightDuration).toBeDefined();
  });

  it('sunrise is before sunset', async () => {
    const provider = new AstronomicalSunProvider();
    const result = await provider.getSunData('st-001', '2026-08-06');
    expect(new Date(result.sunrise).getTime()).toBeLessThan(new Date(result.sunset).getTime());
  });

  it('tracks metrics on success', async () => {
    const provider = new AstronomicalSunProvider();
    await provider.getSunData('st-001', '2026-08-06');
    expect(provider.getMetrics().getState().successfulRequests).toBeGreaterThanOrEqual(1);
  });

  it('health starts online', () => {
    const provider = new AstronomicalSunProvider();
    expect(provider.getHealth().isOnline()).toBe(true);
  });
});
