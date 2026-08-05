import { describe, expect, it } from 'vitest';
import { WeatherService } from './weather.service';
import type { WeatherProviderPort } from '../domain';
import type { WeatherDataPoint } from '../domain';

class StubWeatherProvider implements WeatherProviderPort {
  async getCurrentWeather(): Promise<WeatherDataPoint> {
    return {
      date: '2026-08-05',
      temperature: 30,
      conditions: 'Cerah',
      visibility: 10,
      precipitation: 0,
    };
  }

  async getForecast(): Promise<WeatherDataPoint[]> {
    return [
      {
        date: '2026-08-05',
        temperature: 30,
        conditions: 'Cerah',
        visibility: 10,
        precipitation: 0,
      },
    ];
  }
}

describe('WeatherService', () => {
  it('returns WeatherResponse with data and freshness', async () => {
    const provider = new StubWeatherProvider();
    const service = new WeatherService(provider);

    const result = await service.getWeather('st-001');

    expect(result.data).toHaveLength(1);
    expect(result.data[0]!.conditions).toBe('Cerah');
    expect(result.data[0]!.temperature).toBe(30);
    expect(result.freshness.status).toBe('fresh');
    expect(result.freshness.source).toBe('placeholder');
  });

  it('accepts optional dateFrom and dateTo', async () => {
    const provider = new StubWeatherProvider();
    const service = new WeatherService(provider);

    const result = await service.getWeather('st-001', '2026-08-05', '2026-08-10');
    expect(result.data).toHaveLength(1);
  });

  it('defaults dateTo to dateFrom when omitted', async () => {
    const provider = new StubWeatherProvider();
    const service = new WeatherService(provider);

    const result = await service.getWeather('st-001', '2026-08-05');
    expect(result.data).toHaveLength(1);
  });
});
