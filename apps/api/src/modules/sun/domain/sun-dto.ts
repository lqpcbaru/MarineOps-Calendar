export interface SunDataPoint {
  date: string;
  sunrise: string;
  sunset: string;
  solarNoon: string;
  daylightDuration: string;
}

export interface SunResponse {
  data: SunDataPoint;
}
