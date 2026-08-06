import type { StationRecord, OperationRegionRecord } from '../../domain';

export interface StationsQueryPort {
  findById(id: string): Promise<StationRecord | null>;
  findPublicById(id: string): Promise<StationRecord | null>;
  list(params: { page: number; pageSize: number; regionId?: string }): Promise<{ stations: StationRecord[]; total: number; page: number; pageSize: number }>;
  listPublic(params: { page: number; pageSize: number; regionId?: string }): Promise<{ stations: StationRecord[]; total: number; page: number; pageSize: number }>;
  listRegions(): Promise<OperationRegionRecord[]>;
}
