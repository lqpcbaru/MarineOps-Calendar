export interface AisPosition {
  latitude: number;
  longitude: number;
  speed: number | null;
  course: number | null;
  heading: number | null;
  timestamp: string;
}

export interface AisVesselSummary {
  id: string;
  name: string | null;
  mmsi: string | null;
  imo: string | null;
  flag: string | null;
  vesselType: string | null;
  source: string;
  lastKnownPosition: AisPosition | null;
  lastPositionAt: string | null;
}

export interface AisVesselProfile {
  identity: {
    id: string;
    name: string | null;
    mmsi: string | null;
    imo: string | null;
    flag: string | null;
    callsign: string | null;
    vesselType: string | null;
    length: number | null;
    width: number | null;
    grossTonnage: number | null;
  };
  position: AisPosition | null;
  activity: {
    fishingHours: number | null;
    encounterCount: number | null;
    portVisitCount: number | null;
  };
}

export interface AisVesselEvent {
  id: string;
  vesselId: string;
  type: 'FISHING' | 'ENCOUNTER' | 'PORT_VISIT' | 'LOITERING' | 'AIS_GAP' | 'UNKNOWN';
  startAt: string;
  endAt: string | null;
  latitude: number | null;
  longitude: number | null;
  metadata: Record<string, unknown> | null;
}

export interface AisSearchResult {
  vessels: AisVesselSummary[];
  total: number;
  page: number;
  pageSize: number;
  freshness: { status: 'fresh' | 'stale'; fetchedAt: string; source: string };
}

export interface AisEventsResult {
  vesselId: string;
  events: AisVesselEvent[];
  freshness: { status: 'fresh' | 'stale'; fetchedAt: string; source: string };
}

export interface AisProfileResult {
  profile: AisVesselProfile;
  freshness: { status: 'fresh' | 'stale'; fetchedAt: string; source: string };
}
