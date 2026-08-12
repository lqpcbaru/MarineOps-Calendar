export interface WindWaveDataPoint {
  date: string;
  windSpeed: number;
  windDirection: string;
  windGusts: number;
  waveHeight: number;
  wavePeriod: number;
}

export interface WindWaveResponse {
  data: WindWaveDataPoint[];
  freshness: { status: string; fetchedAt: string; validUntil: string; source: string };
}

export async function getWindWave(
  stationId?: string,
  dateFrom?: string,
  dateTo?: string,
): Promise<WindWaveResponse> {
  const params = new URLSearchParams();
  if (stationId) params.set('stationId', stationId);
  if (dateFrom) params.set('dateFrom', dateFrom);
  if (dateTo) params.set('dateTo', dateTo);
  const res = await fetch(`/api/public/wind-wave${params.size ? '?' + params.toString() : ''}`);
  if (!res.ok) throw new Error(`Gagal mendapatkan data angin & ombak (${res.status})`);
  return res.json();
}
