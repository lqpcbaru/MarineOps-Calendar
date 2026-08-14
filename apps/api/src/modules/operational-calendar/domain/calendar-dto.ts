export interface Freshness {
  status: 'fresh' | 'stale' | 'unavailable';
  fetchedAt: string;
  validUntil: string;
  source: string;
}

export interface WeatherSummary {
  conditions: string;
  temperature: number;
  visibility: number | null;
  precipitation: number | null;
}

export interface TideSummary {
  nextHigh: { time: string; height: number } | null;
  nextLow: { time: string; height: number } | null;
  type: string;
}

export interface WindWaveSummary {
  windSpeed: number;
  windDirection: string;
  windGusts: number;
  waveHeight: number;
  wavePeriod: number;
}

export interface MoonSummary {
  phaseName: string;
  illumination: number;
  moonrise: string | null;
  moonset: string | null;
}

export interface SunSummary {
  sunrise: string;
  sunset: string;
  dayLength: string;
}

export interface DailyOperationalRecord {
  stationId: string;
  stationName: string;
  stationCode: string;
  regionName: string | null;
  date: string;
  hijriDate: string;
  weather: WeatherSummary | null;
  tide: TideSummary | null;
  windWave: WindWaveSummary | null;
  moon: MoonSummary | null;
  sun: SunSummary | null;
  freshness: Freshness;
  generatedAt: string;
}

export interface CalendarResponse {
  data: DailyOperationalRecord[];
  freshness: Freshness;
}
