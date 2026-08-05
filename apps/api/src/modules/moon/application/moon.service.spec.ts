import { describe, expect, it } from 'vitest';
import { MoonService } from './moon.service';
import type { MoonProviderPort, MoonDataPoint } from '../domain';

class StubMoonProvider implements MoonProviderPort {
  async getMoonPhase(): Promise<MoonDataPoint> {
    return {
      date: '2026-08-05',
      phaseName: 'Bulan Penuh',
      illumination: 100,
      ageDays: 14,
      moonrise: '2026-08-05T18:30:00Z',
      moonset: '2026-08-06T06:00:00Z',
    };
  }
}

describe('MoonService', () => {
  it('returns MoonResponse with phase data', async () => {
    const provider = new StubMoonProvider();
    const service = new MoonService(provider);

    const result = await service.getMoonPhase('st-001');

    expect(result.data.phaseName).toBe('Bulan Penuh');
    expect(result.data.illumination).toBe(100);
    expect(result.data.ageDays).toBe(14);
    expect(result.data.moonrise).toBe('2026-08-05T18:30:00Z');
    expect(result.data.moonset).toBe('2026-08-06T06:00:00Z');
  });

  it('accepts optional date', async () => {
    const provider = new StubMoonProvider();
    const service = new MoonService(provider);

    const result = await service.getMoonPhase('st-001', '2026-08-10');
    expect(result.data.date).toBe('2026-08-05');
  });

  it('defaults date to today when omitted', async () => {
    const provider = new StubMoonProvider();
    const service = new MoonService(provider);

    const result = await service.getMoonPhase('st-001');
    expect(result.data.date).toBe('2026-08-05');
  });
});
