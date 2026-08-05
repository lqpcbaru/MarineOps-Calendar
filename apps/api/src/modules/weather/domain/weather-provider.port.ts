import type { WeatherDataPoint } from './weather-dto';

/**
 * Provider port — abstracts where weather data comes from.
 * Implemented by infrastructure (placeholder now, real API later).
 * Swapping providers requires no service or domain change.
 */
export interface WeatherProviderPort {
  getCurrentWeather(stationId: string): Promise<WeatherDataPoint>;
  getForecast(stationId: string, dateFrom: string, dateTo: string): Promise<WeatherDataPoint[]>;
}
