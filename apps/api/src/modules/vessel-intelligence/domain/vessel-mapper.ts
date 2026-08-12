import type { VesselDataStatus, VesselSummary, VesselEvent, VesselProfile } from './vessel-dto';
import type { AisVesselSummary, AisVesselEvent, AisVesselProfile } from '../../ais/domain';

export function classifyVesselStatus(vessel: AisVesselSummary, freshness: string): VesselDataStatus {
  if (!vessel.name && !vessel.mmsi) return 'UNKNOWN';
  if (freshness === 'stale') return 'STALE';
  if (!vessel.lastPositionAt) return 'NO_RECENT_DATA';
  return 'KNOWN';
}

export function mapToVesselSummary(raw: AisVesselSummary, freshness: string): VesselSummary {
  return {
    id: raw.id,
    name: raw.name,
    mmsi: raw.mmsi,
    imo: raw.imo,
    callsign: null,
    flag: raw.flag,
    vesselType: raw.vesselType,
    length: null,
    tonnage: null,
    source: raw.source,
    dataStatus: classifyVesselStatus(raw, freshness),
    lastKnownPosition: raw.lastKnownPosition ? {
      latitude: raw.lastKnownPosition.latitude,
      longitude: raw.lastKnownPosition.longitude,
      speed: raw.lastKnownPosition.speed,
      course: raw.lastKnownPosition.course,
      heading: raw.lastKnownPosition.heading,
      timestamp: raw.lastKnownPosition.timestamp,
    } : null,
    lastPositionAt: raw.lastPositionAt,
    observedAt: raw.lastPositionAt,
    retrievedAt: new Date().toISOString(),
  };
}

export function mapToVesselEvent(raw: AisVesselEvent, freshness: string): VesselEvent {
  return {
    id: raw.id,
    vesselId: raw.vesselId,
    type: raw.type,
    startAt: raw.startAt,
    endAt: raw.endAt,
    latitude: raw.latitude,
    longitude: raw.longitude,
    source: 'gfw',
    freshness,
    retrievedAt: new Date().toISOString(),
  };
}

export function mapToVesselProfile(profile: AisVesselProfile, events: AisVesselEvent[], freshness: string): VesselProfile {
  return {
    identity: {
      id: profile.identity.id,
      name: profile.identity.name,
      mmsi: profile.identity.mmsi,
      imo: profile.identity.imo,
      callsign: profile.identity.callsign,
      flag: profile.identity.flag,
      vesselType: profile.identity.vesselType,
      length: profile.identity.length,
      tonnage: profile.identity.grossTonnage,
      source: 'gfw',
      dataStatus: 'KNOWN',
      lastKnownPosition: profile.position ? {
        latitude: profile.position.latitude,
        longitude: profile.position.longitude,
        speed: profile.position.speed,
        course: profile.position.course,
        heading: profile.position.heading,
        timestamp: profile.position.timestamp,
      } : null,
      lastPositionAt: profile.position?.timestamp ?? null,
      observedAt: profile.position?.timestamp ?? null,
      retrievedAt: new Date().toISOString(),
    },
    position: profile.position ? {
      latitude: profile.position.latitude,
      longitude: profile.position.longitude,
      speed: profile.position.speed,
      course: profile.position.course,
      heading: profile.position.heading,
      timestamp: profile.position.timestamp,
    } : null,
    events: events.map((e) => mapToVesselEvent(e, freshness)),
    source: 'gfw',
    retrievedAt: new Date().toISOString(),
  };
}
