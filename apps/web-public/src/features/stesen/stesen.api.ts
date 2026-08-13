export interface StationRecord {
  id: string;
  code: string;
  name: string;
  latitude: number;
  longitude: number;
  timezone: string;
  regionId: string | null;
  regionName?: string | null;
}

export interface StationListResult {
  stations: StationRecord[];
  total: number;
  page: number;
  pageSize: number;
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
}

export async function getStations(
  page = 1,
  pageSize = 20,
  regionId?: string,
): Promise<StationListResult> {
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('pageSize', String(pageSize));
  if (regionId) params.set('regionId', regionId);
  const res = await fetch(`/api/public/stations?${params.toString()}`);
  if (!res.ok) throw new Error(`Gagal mendapatkan senarai stesen (${res.status})`);
  return res.json();
}

export async function getStationRegions(): Promise<OperationRegionRecord[]> {
  const res = await fetch('/api/public/stations/regions');
  if (!res.ok) throw new Error(`Gagal mendapatkan senarai wilayah (${res.status})`);
  const data = await res.json();
  return data.data ?? [];
}

export async function getStationById(id: string): Promise<StationRecord> {
  const res = await fetch(`/api/public/stations/${id}`);
  if (!res.ok) throw new Error(`Gagal mendapatkan maklumat stesen (${res.status})`);
  return res.json();
}
