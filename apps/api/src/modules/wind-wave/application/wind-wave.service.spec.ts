import { describe, expect, it } from 'vitest';
import { WindWaveService } from './wind-wave.service';
import type { WindWaveProviderPort, WindWaveDataPoint } from '../domain';

class StubWindWaveProvider implements WindWaveProviderPort {
  async getWindWave(): Promise<WindWaveDataPoint[]> {
    return [
      {
        date: '2026-08-05',
        windSpeed: 12,
        windDirection: 'NE',
        windGusts: 18,
        waveHeight: 1.2,
        wavePeriod: 6,
      },
    ];
  }
}

describe('WindWaveService', () => {
  it('returns WindWaveResponse with data and freshness', async () => {
    const provider = new StubWindWaveProvider();
    const service = new WindWaveService(provider);

    const result = await service.getWindWave('st-001');

    expect(result.data).toHaveLength(1);
    expect(result.data[0]!.windSpeed).toBe(12);
    expect(result.data[0]!.waveHeight).toBe(1.2);
    expect(result.freshness.status).toBe('fresh');
    expect(result.freshness.source).toBe('placeholder');
  });

  it('accepts optional dateFrom and dateTo', async () => {
    const provider = new StubWindWaveProvider();
    const service = new WindWaveService(provider);

    const result = await service.getWindWave('st-001', '2026-08-05', '2026-08-10');
    expect(result.data).toHaveLength(1);
  });

  it('defaults dateTo to dateFrom when omitted', async () => {
    const provider = new StubWindWaveProvider();
    const service = new WindWaveService(provider);

    const result = await service.getWindWave('st-001', '2026-08-05');
    expect(result.data).toHaveLength(1);
  });
});
