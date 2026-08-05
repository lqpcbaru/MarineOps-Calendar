import { describe, expect, it } from 'vitest';
import { TideService } from './tide.service';
import type { TideProviderPort, TideDataPoint } from '../domain';

class StubTideProvider implements TideProviderPort {
  async getTide(): Promise<TideDataPoint[]> {
    return [
      { date: '2026-08-05', time: '2026-08-05T06:30:00Z', height: 2.5, type: 'HIGH' },
      { date: '2026-08-05', time: '2026-08-05T12:45:00Z', height: 0.8, type: 'LOW' },
    ];
  }
}

describe('TideService', () => {
  it('returns TideResponse with data and freshness', async () => {
    const provider = new StubTideProvider();
    const service = new TideService(provider);

    const result = await service.getTide('st-001');

    expect(result.data).toHaveLength(2);
    expect(result.data[0]!.type).toBe('HIGH');
    expect(result.data[0]!.height).toBe(2.5);
    expect(result.freshness.status).toBe('fresh');
    expect(result.freshness.source).toBe('placeholder');
  });

  it('accepts optional dateFrom and dateTo', async () => {
    const provider = new StubTideProvider();
    const service = new TideService(provider);

    const result = await service.getTide('st-001', '2026-08-05', '2026-08-10');
    expect(result.data).toHaveLength(2);
  });

  it('defaults dateTo to dateFrom when omitted', async () => {
    const provider = new StubTideProvider();
    const service = new TideService(provider);

    const result = await service.getTide('st-001', '2026-08-05');
    expect(result.data).toHaveLength(2);
  });
});
