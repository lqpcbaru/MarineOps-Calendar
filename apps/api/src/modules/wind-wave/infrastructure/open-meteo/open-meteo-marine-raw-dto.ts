/**
 * Raw Open-Meteo marine response shape.
 *
 * Wind speed and wave height come from the same daily forecast as weather;
 * Open-Meteo exposes wave data via the `marine` API. The flat arrays are
 * index-aligned with `time`.
 */
export interface OpenMeteoMarineResponse {
  latitude: number;
  longitude: number;
  timezone: string;
  daily?: {
    time: string[];
    wind_speed_10m_max?: number[];
    wind_gusts_10m_max?: number[];
    wind_direction_10m_dominant?: number[];
    wave_height_max?: number[];
    wave_period_max?: number[];
  };
}
