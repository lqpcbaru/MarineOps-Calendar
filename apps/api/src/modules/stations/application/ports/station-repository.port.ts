import type { StationRecord, OperationRegionRecord, CreateStationParams, UpdateStationParams, StationListResult } from '../../domain';

export interface StationRepository {
  findById(id: string): Promise<StationRecord | null>;
  findByIdAdmin(id: string): Promise<StationRecord | null>;
  findByCode(code: string): Promise<StationRecord | null>;
  findAllPublic(params: { page: number; pageSize: number; regionId?: string }): Promise<StationListResult>;
  findAllAdmin(params: { page: number; pageSize: number; status?: string; search?: string; regionId?: string }): Promise<StationListResult>;
  create(params: CreateStationParams): Promise<StationRecord>;
  update(id: string, params: UpdateStationParams): Promise<StationRecord>;
  archive(id: string): Promise<StationRecord>;
}

export interface RegionRepository {
  findById(id: string): Promise<OperationRegionRecord | null>;
  findByCode(code: string): Promise<OperationRegionRecord | null>;
  findAllActive(): Promise<OperationRegionRecord[]>;
  create(params: { code: string; name: string; description?: string | null; parentRegionId?: string | null; sortOrder?: number }): Promise<OperationRegionRecord>;
}
