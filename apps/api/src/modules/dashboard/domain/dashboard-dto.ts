export interface DashboardResponse {
  date: string;
  station: {
    id: string;
    name: string;
    code: string;
    regionName: string | null;
  };
  operationalStatus: string;
  overallScore: number;
  recommendation: string;
  weather: {
    conditions: string;
    temperature: number;
  } | null;
  wind: {
    speed: number;
    direction: string;
  } | null;
  wave: {
    height: number;
  } | null;
  tide: {
    type: string;
    nextHigh: { time: string; height: number } | null;
    nextLow: { time: string; height: number } | null;
  } | null;
  moon: {
    phaseName: string;
    illumination: number;
  } | null;
  sun: {
    sunrise: string;
    sunset: string;
  } | null;
  warnings: string[];
  advisories: string[];
  generatedAt: string;
}
