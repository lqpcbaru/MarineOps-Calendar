export interface Freshness {
  status: 'fresh' | 'stale' | 'unavailable';
  fetchedAt: string;
  validUntil: string;
  source: string;
}

export interface WeatherDataPoint {
  date: string;
  temperature: number;
  conditions: string;
  visibility: number | null;
  precipitation: number | null;
}

export interface WeatherResponse {
  data: WeatherDataPoint[];
  freshness: Freshness;
}
