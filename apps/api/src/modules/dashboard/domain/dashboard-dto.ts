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

export interface WeatherDataPoint {
  date: string;
  temperature: number;
  conditions: string;
  visibility: number;
  precipitation: number;
}

export interface WindWaveDataPoint {
  date: string;
  windSpeed: number;
  windDirection: string;
  windGusts: number;
  waveHeight: number;
  wavePeriod: number;
}

export interface AlertPublicSummary {
  id: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  title: string;
  publishAt: string;
}

export interface PublicDashboardResponse {
  date: string;
  hijriDate: string;
  station: {
    id: string;
    name: string;
    code: string;
  };
  tide: {
    next: TideDataPoint | null;
    freshness: Freshness;
  };
  weather: {
    current: WeatherDataPoint | null;
    freshness: Freshness;
  };
  windWave: {
    current: WindWaveDataPoint | null;
    freshness: Freshness;
  };
  moon: {
    phaseName: string;
    illumination: number;
  };
  sun: {
    sunrise: string;
    sunset: string;
  };
  activeAlerts: {
    count: number;
    latest: AlertPublicSummary | null;
  };
  operationalStatus: 'SAFE' | 'CAUTION' | 'DANGER' | 'UNKNOWN';
}
