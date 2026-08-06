import { describe, expect, it } from 'vitest';
import { SunService } from './sun.service';
import type { SunProviderPort, SunDataPoint } from '../domain';

class StubSunProvider implements SunProviderPort {
  async getSunData(): Promise<SunDataPoint> {
    return {
      date: '2026-08-05',
      sunrise: '2026-08-05T06:30:00Z',
      sunset: '2026-08-05T18:45:00Z',
      solarNoon: '2026-08-05T12:37:30Z',
      daylightDuration: 'PT12H15M',
    };
  }
}

describe('SunService', () => {
  it('returns SunResponse with sun data', async () => {
    const provider = new StubSunProvider();
    const service = new SunService(provider);

    const result = await service.getSunData('st-001');

    expect(result.data.sunrise).toBe('2026-08-05T06:30:00Z');
    expect(result.data.sunset).toBe('2026-08-05T18:45:00Z');
    expect(result.data.daylightDuration).toBe('PT12H15M');
  });

  it('accepts optional date', async () => {
    const provider = new StubSunProvider();
    const service = new SunService(provider);

    const result = await service.getSunData('st-001', '2026-08-10');
    expect(result.data.date).toBe('2026-08-05');
  });

  it('defaults date to today when omitted', async () => {
    const provider = new StubSunProvider();
    const service = new SunService(provider);

    const result = await service.getSunData('st-001');
    expect(result.data.date).toBe('2026-08-05');
  });
});
