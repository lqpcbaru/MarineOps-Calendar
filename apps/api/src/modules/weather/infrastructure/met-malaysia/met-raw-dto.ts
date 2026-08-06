export interface MetRawForecastItem {
  date: string;
  day: string;
  weatherCode: string;
  weatherCondition: string;
  morningForecast: string;
  afternoonForecast: string;
  nightForecast: string;
  minTemperature: number | null;
  maxTemperature: number | null;
  windDirection: string;
  windSpeed: string;
  waveHeight: string;
  humidity: number | null;
}

export interface MetRawForecastResponse {
  status: string;
  data: MetRawForecastItem[];
  metadata?: {
    generatedAt: string;
    validUntil: string;
    station: string;
  };
}
