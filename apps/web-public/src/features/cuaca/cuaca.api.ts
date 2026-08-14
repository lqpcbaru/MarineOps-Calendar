export interface WeatherDataPoint {
  date: string;
  temperature: number;
  conditions: string;
  visibility: number;
  precipitation: number;
}

export interface WeatherResponse {
  data: WeatherDataPoint[];
  freshness: {
    status: 'fresh' | 'stale' | 'unavailable';
    fetchedAt: string;
    validUntil: string;
    source: string;
  };
}

export async function getWeather(
  stationId?: string,
  dateFrom?: string,
  dateTo?: string,
): Promise<WeatherResponse> {
  const params = new URLSearchParams();
  if (stationId) params.set('stationId', stationId);
  if (dateFrom) params.set('dateFrom', dateFrom);
  if (dateTo) params.set('dateTo', dateTo);
  const res = await fetch(`/api/public/weather${params.size ? '?' + params.toString() : ''}`);
  if (!res.ok) throw new Error(`Gagal mendapatkan data cuaca (${res.status})`);
  return res.json();
}
