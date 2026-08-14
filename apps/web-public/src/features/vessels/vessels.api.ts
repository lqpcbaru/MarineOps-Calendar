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

export type VesselEventType =
  'FISHING' | 'ENCOUNTER' | 'PORT_VISIT' | 'LOITERING' | 'AIS_GAP' | 'UNKNOWN';

export interface VesselEvent {
  id: string;
  vesselId: string;
  type: VesselEventType;
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

async function throwApiError(res: Response, fallbackMessage: string): Promise<never> {
  let backendMessage: string | null = null;
  try {
    const body = (await res.json()) as unknown;
    if (body && typeof body === 'object') {
      const candidate = (body as { message?: unknown }).message;
      if (typeof candidate === 'string' && candidate.trim().length > 0) {
        backendMessage = candidate.trim();
      }
    }
  } catch {
    backendMessage = null;
  }

  if (backendMessage) {
    throw new Error(`${backendMessage} (${res.status})`);
  }
  throw new Error(`${fallbackMessage} (${res.status})`);
}

export async function searchVessels(
  query: string,
  page = 1,
  pageSize = 20,
): Promise<VesselSearchResult> {
  const params = new URLSearchParams();
  params.set('q', query);
  params.set('page', String(page));
  params.set('pageSize', String(pageSize));
  const res = await fetch(`/api/public/vessels/search?${params.toString()}`);
  if (!res.ok) await throwApiError(res, 'Gagal mendapatkan maklumat kapal');
  return res.json();
}

export async function getVesselProfile(vesselId: string): Promise<VesselProfile> {
  const res = await fetch(`/api/public/vessels/${encodeURIComponent(vesselId)}`);
  if (!res.ok) await throwApiError(res, 'Gagal mendapatkan profil kapal');
  return res.json();
}

export async function getVesselEvents(
  vesselId: string,
  dateFrom?: string,
  dateTo?: string,
): Promise<VesselEventsResult> {
  const params = new URLSearchParams();
  if (dateFrom) params.set('dateFrom', dateFrom);
  if (dateTo) params.set('dateTo', dateTo);
  const res = await fetch(
    `/api/public/vessels/${encodeURIComponent(vesselId)}/events${params.size ? '?' + params.toString() : ''}`,
  );
  if (!res.ok) await throwApiError(res, 'Gagal mendapatkan aktiviti kapal');
  return res.json();
}
