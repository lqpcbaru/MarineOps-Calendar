import type { AisVesselSummary, AisVesselProfile, AisVesselEvent, AisPosition } from '../../domain';
import type {
  GfwVesselSearchItem,
  GfwVesselProfileResponse,
  GfwVesselEventItem,
} from './gfw-raw-dto';

export function mapPosition(
  raw:
    | {
        lat: number;
        lon: number;
        speed: number | null;
        course: number | null;
        heading: number | null;
        timestamp: string;
      }
    | null
    | undefined,
): AisPosition | null {
  if (!raw || raw.lat == null || raw.lon == null) return null;
  if (raw.lat < -90 || raw.lat > 90 || raw.lon < -180 || raw.lon > 180) return null;
  return {
    latitude: raw.lat,
    longitude: raw.lon,
    speed: raw.speed ?? null,
    course: raw.course ?? null,
    heading: raw.heading ?? null,
    timestamp: raw.timestamp,
  };
}

export function mapVesselSummary(raw: GfwVesselSearchItem): AisVesselSummary {
  return {
    id: raw.id,
    name: raw.shipname ?? null,
    mmsi: raw.mmsi ?? null,
    imo: raw.imo ?? null,
    flag: raw.flag ?? null,
    vesselType: raw.vesselType ?? null,
    source: 'gfw',
    lastKnownPosition: mapPosition(raw.lastPosition),
    lastPositionAt: raw.lastPosition?.timestamp ?? null,
  };
}

export function mapVesselSummaries(raw: GfwVesselSearchItem[]): AisVesselSummary[] {
  return raw.map(mapVesselSummary);
}

export function mapVesselProfile(raw: GfwVesselProfileResponse): AisVesselProfile {
  return {
    identity: {
      id: raw.id,
      name: raw.shipname ?? null,
      mmsi: raw.mmsi ?? null,
      imo: raw.imo ?? null,
      flag: raw.flag ?? null,
      callsign: raw.callsign ?? null,
      vesselType: raw.vesselType ?? null,
      length: raw.length ?? null,
      width: raw.width ?? null,
      grossTonnage: raw.grossTonnage ?? null,
    },
    position: mapPosition(raw.lastPosition),
    activity: {
      fishingHours: raw.activitySummary?.fishingHours ?? null,
      encounterCount: raw.activitySummary?.encounterCount ?? null,
      portVisitCount: raw.activitySummary?.portVisitCount ?? null,
    },
  };
}

const EVENT_TYPE_MAP: Record<string, AisVesselEvent['type']> = {
  FISHING: 'FISHING',
  fishing: 'FISHING',
  ENCOUNTER: 'ENCOUNTER',
  encounter: 'ENCOUNTER',
  PORT_VISIT: 'PORT_VISIT',
  port_visit: 'PORT_VISIT',
  LOITERING: 'LOITERING',
  loitering: 'LOITERING',
  GAP: 'AIS_GAP',
  gap: 'AIS_GAP',
};

export function mapEventType(rawType: string): AisVesselEvent['type'] {
  return EVENT_TYPE_MAP[rawType] ?? 'UNKNOWN';
}

export function mapVesselEvent(raw: GfwVesselEventItem): AisVesselEvent {
  return {
    id: raw.id,
    vesselId: raw.vesselId,
    type: mapEventType(raw.type),
    startAt: raw.start,
    endAt: raw.end ?? null,
    latitude: raw.lat ?? null,
    longitude: raw.lon ?? null,
    metadata: raw.regions ?? null,
  };
}

export function mapVesselEvents(raw: GfwVesselEventItem[]): AisVesselEvent[] {
  return raw.map(mapVesselEvent);
}
