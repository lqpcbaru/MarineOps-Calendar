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
