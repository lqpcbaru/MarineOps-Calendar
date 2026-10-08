/**
 * Raw Open-Meteo marine sea-level response.
 *
 * The marine API's `sea_level_height_msl` field returns hourly water height
 * relative to mean sea level. It is index-aligned with `time`. From these
 * hourly samples MarineOps derives high/low tide events locally.
 */
export interface OpenMeteoSeaLevelResponse {
  latitude: number;
  longitude: number;
  timezone: string;
  hourly?: {
    time: string[];
    sea_level_height_msl?: number[];
  };
}
