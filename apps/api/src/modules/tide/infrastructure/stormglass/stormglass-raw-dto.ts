/**
 * Raw StormGlass API response shapes.
 *
 * StormGlass (stormglass.io) is a coordinate-driven marine API. The
 * `tide/extremes/point` endpoint returns high/low tide events over a window.
 * Each entry carries an ISO time, a height in metres, and a "high"/"low" type.
 */
export interface StormGlassTideExtreme {
  time: string;
  height: number;
  type: 'high' | 'low';
}

export interface StormGlassTideResponse {
  data: StormGlassTideExtreme[];
  meta?: {
    cost: number;
    dailyQuota: number;
    requestCount: number;
    lat: number;
    lng: number;
    start: string;
    end: string;
  };
}
