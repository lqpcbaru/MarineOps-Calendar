import type { ProviderMappingRecord } from '../../domain';

export interface StationProviderMappingPort {
  getByStation(stationId: string): Promise<ProviderMappingRecord[]>;
  getByStationAndType(stationId: string, dataType: string): Promise<ProviderMappingRecord | null>;
}
