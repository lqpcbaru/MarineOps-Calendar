export interface StationRecord {
  id: string;
  code: string;
  name: string;
  latitude: number;
  longitude: number;
  timezone: string;
  regionId: string | null;
  regionName?: string | null;
  status: 'ACTIVE' | 'ARCHIVED';
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface OperationRegionRecord {
  id: string;
  code: string;
  name: string;
  description: string | null;
  parentRegionId: string | null;
  status: 'ACTIVE' | 'ARCHIVED';
  sortOrder: number;
  stationCount?: number;
  children?: OperationRegionRecord[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ProviderMappingRecord {
  id: string;
  stationId: string;
  dataType: string;
  providerName: string;
  providerStationId: string | null;
  config: Record<string, unknown> | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateStationParams {
  code: string;
  name: string;
  latitude: number;
  longitude: number;
  timezone: string;
  regionId?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface UpdateStationParams {
  name?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  regionId?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface StationListResult {
  stations: StationRecord[];
  total: number;
  page: number;
  pageSize: number;
}
