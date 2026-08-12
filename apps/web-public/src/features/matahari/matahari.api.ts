export interface SunDataPoint {
  date: string;
  sunrise: string;
  sunset: string;
  solarNoon: string;
  daylightDuration: string;
}

export interface SunResponse {
  data: SunDataPoint;
}

export async function getSunData(stationId?: string, date?: string): Promise<SunResponse> {
  const params = new URLSearchParams();
  if (stationId) params.set('stationId', stationId);
  if (date) params.set('date', date);
  const res = await fetch(`/api/public/sun${params.size ? '?' + params.toString() : ''}`);
  if (!res.ok) throw new Error(`Gagal mendapatkan data matahari (${res.status})`);
  return res.json();
}
