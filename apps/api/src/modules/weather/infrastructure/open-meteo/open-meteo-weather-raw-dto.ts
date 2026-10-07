/**
 * Raw Open-Meteo response shapes.
 *
 * Open-Meteo is a free, key-less global weather API queried by latitude and
 * longitude. The endpoints used here return flat arrays whose positions line
 * up by index: `time[0]` corresponds to `temperature_2m_max[0]`, and so on.
 * These types capture only the fields MarineOps actually consumes.
 */

export interface OpenMeteoWeatherResponse {
  latitude: number;
  longitude: number;
  timezone: string;
  daily?: {
    time: string[];
    temperature_2m_max?: number[];
    temperature_2m_min?: number[];
    weather_code?: number[];
    precipitation_sum?: number[];
    wind_speed_10m_max?: number[];
  };
  current_weather?: {
    time: string;
    temperature: number;
    weathercode: number;
    windspeed: number;
  };
}
