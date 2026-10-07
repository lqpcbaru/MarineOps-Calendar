/**
 * Raw WorldTides API response shapes.
 *
 * WorldTides (worldtides.info) is a coordinate-driven tide prediction API.
 * The `extremes` query returns the high/low tide events for a location over a
 * given window; each entry carries a Unix timestamp, a height in metres, and
 * a "High"/"Low" type.
 */
export interface WorldTidesExtreme {
  dt: number;
  date: string;
  height: number;
  type: 'High' | 'Low';
}

export interface WorldTidesResponse {
  status: number;
  callCount: number;
  copyright: string;
  requestLat: number;
  requestLon: number;
  responseLat: number;
  responseLon: number;
  atlas: string;
  extremes: WorldTidesExtreme[];
}
