export type VesselDataStatus = 'KNOWN' | 'UNKNOWN' | 'STALE' | 'NO_RECENT_DATA' | 'AIS_GAP';

export interface VesselPosition {
  latitude: number;
  longitude: number;
  speed: number | null;
  course: number | null;
  heading: number | null;
  timestamp: string;
}

export interface VesselSummary {
  id: string;
  name: string | null;
  mmsi: string | null;
  imo: string | null;
  callsign: string | null;
  flag: string | null;
  vesselType: string | null;
  length: number | null;
  tonnage: number | null;
  source: string;
  dataStatus: VesselDataStatus;
  lastKnownPosition: VesselPosition | null;
  lastPositionAt: string | null;
  observedAt: string | null;
  retrievedAt: string;
}

export interface VesselEvent {
  id: string;
  vesselId: string;
  type: 'FISHING' | 'ENCOUNTER' | 'PORT_VISIT' | 'LOITERING' | 'AIS_GAP' | 'UNKNOWN';
  startAt: string;
  endAt: string | null;
  latitude: number | null;
  longitude: number | null;
  source: string;
  freshness: string;
  retrievedAt: string;
}

export interface VesselProfile {
  identity: VesselSummary;
  position: VesselPosition | null;
  events: VesselEvent[];
  source: string;
  retrievedAt: string;
}

export interface VesselSearchResult {
  vessels: VesselSummary[];
  total: number;
  page: number;
  pageSize: number;
  retrievedAt: string;
  source: string;
}

export interface VesselEventsResult {
  vesselId: string;
  events: VesselEvent[];
  retrievedAt: string;
  source: string;
}
