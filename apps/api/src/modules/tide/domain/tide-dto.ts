export interface Freshness {
  status: 'fresh' | 'stale' | 'unavailable';
  fetchedAt: string;
  validUntil: string;
  source: string;
}

export interface TideDataPoint {
  date: string;
  time: string;
  height: number;
  type: 'HIGH' | 'LOW';
}

export interface TideResponse {
  data: TideDataPoint[];
  freshness: Freshness;
}
