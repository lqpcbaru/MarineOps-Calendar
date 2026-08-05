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
  visibility: number;
  precipitation: number;
}

export interface WeatherResponse {
  data: WeatherDataPoint[];
  freshness: Freshness;
}
