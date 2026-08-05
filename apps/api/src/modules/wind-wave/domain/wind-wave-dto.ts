export interface Freshness {
  status: 'fresh' | 'stale' | 'unavailable';
  fetchedAt: string;
  validUntil: string;
  source: string;
}

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
  freshness: Freshness;
}
