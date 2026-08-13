export interface DailyOperationalRecord {
  stationId: string;
  stationName: string;
  stationCode: string;
  regionName: string | null;
  date: string;
  hijriDate: string;
  weather: {
    conditions: string;
    temperature: number;
    visibility: number;
    precipitation: number;
  } | null;
  tide: {
    nextHigh: { time: string; height: number } | null;
    nextLow: { time: string; height: number } | null;
    type: string;
  } | null;
  windWave: {
    windSpeed: number;
    windDirection: string;
    windGusts: number;
    waveHeight: number;
    wavePeriod: number;
  } | null;
  moon: {
    phaseName: string;
    illumination: number;
    moonrise: string | null;
    moonset: string | null;
  } | null;
  sun: { sunrise: string; sunset: string; dayLength: string } | null;
  freshness: { status: string; fetchedAt: string; validUntil: string; source: string };
  generatedAt: string;
}

export interface CalendarResponse {
  data: DailyOperationalRecord[];
  freshness: { status: string; fetchedAt: string; validUntil: string; source: string };
}

export async function getCalendar(
  stationId?: string,
  dateFrom?: string,
  dateTo?: string,
): Promise<CalendarResponse> {
  const params = new URLSearchParams();
  if (stationId) params.set('stationId', stationId);
  if (dateFrom) params.set('dateFrom', dateFrom);
  if (dateTo) params.set('dateTo', dateTo);
  const res = await fetch(`/api/public/calendar${params.size ? '?' + params.toString() : ''}`);
  if (!res.ok) throw new Error(`Gagal mendapatkan data kalendar operasi (${res.status})`);
  return res.json();
}
