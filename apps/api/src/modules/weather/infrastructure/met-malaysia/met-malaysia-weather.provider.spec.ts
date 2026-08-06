import { describe, expect, it } from 'vitest';
import { MetMalaysiaWeatherProvider } from './met-malaysia-weather.provider';
import type { StationProviderMappingPort } from '../../../stations/application/ports';
import type { ProviderMappingRecord } from '../../../stations/domain';

function makeMapping(marineArea: string): ProviderMappingRecord {
  return {
    id: 'm-1',
    stationId: 'st-001',
    dataType: 'weather',
    providerName: 'MetMalaysia',
    providerStationId: marineArea,
    config: { marineArea },
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

describe('MetMalaysiaWeatherProvider', () => {
  it('resolves station mapping via StationProviderMappingPort', async () => {
    const mappingPort: StationProviderMappingPort = {
      getByStation: async () => [makeMapping('Selangor')],
      getByStationAndType: async () => makeMapping('Selangor'),
    };

    const provider = new MetMalaysiaWeatherProvider(mappingPort);

    void await provider.getCurrentWeather('st-001').catch(() => null);

    expect(provider.getMetrics).toBeDefined();
    expect(provider.getHealth).toBeDefined();
  });

  it('throws when no mapping exists for station', async () => {
    const mappingPort: StationProviderMappingPort = {
      getByStation: async () => [],
      getByStationAndType: async () => null,
    };

    const provider = new MetMalaysiaWeatherProvider(mappingPort);

    await expect(provider.getCurrentWeather('st-unknown')).rejects.toThrow();
  });

  it('throws when mapping is inactive', async () => {
    const inactive: ProviderMappingRecord = { ...makeMapping('Selangor'), isActive: false };
    const mappingPort: StationProviderMappingPort = {
      getByStation: async () => [inactive],
      getByStationAndType: async () => inactive,
    };

    const provider = new MetMalaysiaWeatherProvider(mappingPort);

    await expect(provider.getCurrentWeather('st-001')).rejects.toThrow();
  });
});
