export interface TideDataPoint {
  date: string;
  time: string;
  height: number;
  type: 'HIGH' | 'LOW';
}

export interface TideResponse {
  data: TideDataPoint[];
  freshness: { status: string; fetchedAt: string; validUntil: string; source: string };
}

export async function getTide(
  stationId?: string,
  dateFrom?: string,
  dateTo?: string,
): Promise<TideResponse> {
  const params = new URLSearchParams();
  if (stationId) params.set('stationId', stationId);
  if (dateFrom) params.set('dateFrom', dateFrom);
  if (dateTo) params.set('dateTo', dateTo);
  const res = await fetch(`/api/public/tide${params.size ? '?' + params.toString() : ''}`);
  if (!res.ok) throw new Error(`Gagal mendapatkan data pasang surut (${res.status})`);
  return res.json();
}
