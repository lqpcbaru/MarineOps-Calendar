import { apiRequest, buildQuery } from '../../shared/api/http';

/** Mirrors `toPublicStation()` in admin-stations.controller.ts. */
export interface AdminStation {
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
  createdAt: string;
  updatedAt: string;
}

export interface StationListResult {
  stations: AdminStation[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ListStationsParams {
  page?: number;
  pageSize?: number;
  status?: 'ACTIVE' | 'ARCHIVED' | '';
  search?: string;
  regionId?: string;
}

export function listStations(params: ListStationsParams = {}): Promise<StationListResult> {
  const qs = buildQuery({
    page: params.page,
    pageSize: params.pageSize,
    status: params.status,
    search: params.search,
    regionId: params.regionId,
  });
  return apiRequest<StationListResult>(`/api/v1/stations${qs}`, {
    fallbackMessage: 'Gagal mendapatkan senarai stesen',
  });
}

export interface CreateStationInput {
  code: string;
  name: string;
  latitude: number;
  longitude: number;
  timezone: string;
  regionId?: string | null;
}

export function createStation(input: CreateStationInput): Promise<AdminStation> {
  return apiRequest<AdminStation>('/api/v1/stations', {
    method: 'POST',
    body: input,
    fallbackMessage: 'Gagal mencipta stesen',
  });
}

/** `code` is immutable — updateStationSchema does not accept it. */
export interface UpdateStationInput {
  name?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  regionId?: string | null;
}

export function updateStation(id: string, input: UpdateStationInput): Promise<AdminStation> {
  return apiRequest<AdminStation>(`/api/v1/stations/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: input,
    fallbackMessage: 'Gagal mengemas kini stesen',
  });
}

/** DELETE archives (soft-delete via status=ARCHIVED), it does not destroy. */
export function archiveStation(id: string): Promise<void> {
  return apiRequest<void>(`/api/v1/stations/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    fallbackMessage: 'Gagal mengarkib stesen',
  });
}

export interface OperationRegion {
  id: string;
  code: string;
  name: string;
  parentRegionId: string | null;
  status: 'ACTIVE' | 'ARCHIVED';
  children?: OperationRegion[];
}

/**
 * Regions come from the PUBLIC endpoint: there is no admin regions
 * controller, and region reference data is already public
 * (public-stations.controller.ts). Using it avoids inventing a backend
 * endpoint purely for a dropdown.
 */
export async function listRegions(): Promise<OperationRegion[]> {
  const body = await apiRequest<{ data: OperationRegion[] }>('/api/public/stations/regions', {
    fallbackMessage: 'Gagal mendapatkan senarai wilayah',
  });
  return body.data ?? [];
}

/** The regions endpoint returns a tree; the station form needs a flat list. */
export function flattenRegions(regions: OperationRegion[]): OperationRegion[] {
  const out: OperationRegion[] = [];
  const walk = (nodes: OperationRegion[]) => {
    for (const node of nodes) {
      out.push(node);
      if (node.children?.length) walk(node.children);
    }
  };
  walk(regions);
  return out;
}
