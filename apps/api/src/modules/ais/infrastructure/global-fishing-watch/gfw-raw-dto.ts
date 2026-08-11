export interface GfwVesselSearchItem {
  id: string;
  shipname: string | null;
  mmsi: string | null;
  imo: string | null;
  flag: string | null;
  vesselType: string | null;
  callsign: string | null;
  lastPosition?: {
    lat: number;
    lon: number;
    speed: number | null;
    course: number | null;
    heading: number | null;
    timestamp: string;
  } | null;
}

export interface GfwVesselSearchResponse {
  entries: GfwVesselSearchItem[];
  total: number;
  limit: number;
  offset: number;
}

export interface GfwVesselProfileResponse {
  id: string;
  shipname: string | null;
  mmsi: string | null;
  imo: string | null;
  flag: string | null;
  callsign: string | null;
  vesselType: string | null;
  length: number | null;
  width: number | null;
  grossTonnage: number | null;
  lastPosition?: {
    lat: number;
    lon: number;
    speed: number | null;
    course: number | null;
    heading: number | null;
    timestamp: string;
  } | null;
  activitySummary?: {
    fishingHours: number | null;
    encounterCount: number | null;
    portVisitCount: number | null;
  } | null;
}

export interface GfwVesselEventItem {
  id: string;
  vesselId: string;
  type: string;
  start: string;
  end: string | null;
  lat: number | null;
  lon: number | null;
  regions?: Record<string, unknown>;
  boundingBox?: number[];
  distances?: Record<string, unknown>;
}

export interface GfwVesselEventsResponse {
  entries: GfwVesselEventItem[];
  total: number;
  limit: number;
  offset: number;
}
