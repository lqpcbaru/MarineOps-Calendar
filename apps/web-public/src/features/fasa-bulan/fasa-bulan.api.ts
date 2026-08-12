export interface MoonDataPoint {
  date: string;
  phaseName: string;
  illumination: number;
  ageDays: number;
  moonrise: string | null;
  moonset: string | null;
}

export interface MoonResponse {
  data: MoonDataPoint;
}

export async function getMoonPhase(stationId?: string, date?: string): Promise<MoonResponse> {
  const params = new URLSearchParams();
  if (stationId) params.set('stationId', stationId);
  if (date) params.set('date', date);
  const res = await fetch(`/api/public/moon${params.size ? '?' + params.toString() : ''}`);
  if (!res.ok) throw new Error(`Gagal mendapatkan data fasa bulan (${res.status})`);
  return res.json();
}
